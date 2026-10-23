"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RootLayout from "@/componentsedit/layout/RootLayout";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useTranslations, useLocale } from "next-intl";
import { useRedirectGuestFromCheckout } from "@/lib/auth/useGuestCheckoutGuard";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import { useUser } from "@/componentsedit/context/UserContext";
import OrderReviewCenterContent from "./_components/OrderReviewCenterContent";
import SkipCashCardForm, {
  type SkipCashCardFormHandle,
} from "./_components/SkipCashCardForm";
import {
  buildOrderReviewDataFromPreview,
  extractOrderPreviewMeta,
  fetchOrderPreviewWithError,
  mapOrderPreviewCartToCheckoutLines,
  type OrderPreviewResponse,
} from "@/services/orders/fetchOrderPreview";
import type { CartSummaryShape } from "@/types/checkoutDisplay";
import {
  readCheckoutCartItemUuids,
  readCheckoutReviewSession,
  writeCheckoutCartItemUuids,
} from "@/lib/checkout/checkoutReviewSession";
import {
  createOrder,
  getOrderPayUrl,
  type CreateOrderResponse,
} from "@/services/orders/createOrder";
import { invalidateUserCartCache } from "@/lib/cartCache";
import { dispatchCartCountInvalidated } from "@/hooks/useCustomerCartCount";
import { trackPaymentAttempt } from "@/componentsedit/analytics/postPurchaseGtm";
import { submitSkipCashPaymentResult } from "@/services/skipcash/skipcashApi";
import { absoluteLocaleUrl } from "@/lib/seo/siteUrl";

function toSafeNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function resolveApiErrorMessage(
  apiError: string | null | undefined,
  fallback: string,
): string {
  const msg = apiError?.trim();
  return msg || fallback;
}

function extractSkipCashSessionId(order: CreateOrderResponse | null): string | null {
  if (!order || typeof order !== "object") return null;

  const candidateKeys = [
    "sessionId",
    "sessionID",
    "session_id",
    "paymentSessionId",
    "paymentSessionID",
    "paymentSession_id",
    "tokenizationSessionId",
    "tokenizationSessionID",
    "tokenizationSession_id",
    "checkoutSessionId",
    "checkoutSessionID",
    "checkoutSession_id",
  ];

  const normalize = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  const seen = new Set<unknown>();
  const stack: unknown[] = [order];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current)) continue;
    seen.add(current);

    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (candidateKeys.includes(key)) {
        const found = normalize(value);
        if (found) return found;
      }

      if (value && typeof value === "object") stack.push(value);
    }
  }

  return null;
}

export default function OrderReviewPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { currency } = useCurrency();
  const savedToken = Cookies.get("token");
  const { user, loading: userLoading } = useUser();
  useRedirectGuestFromCheckout(userLoading);

  const [preview, setPreview] = useState<OrderPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewErrorMessage, setPreviewErrorMessage] = useState<string | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(() => {
    const fromSession = String(readCheckoutReviewSession().couponCode ?? "").trim();
    return fromSession ? fromSession : null;
  });
  const [checkoutCartItemUuids] = useState<string[] | undefined>(() =>
    typeof window !== "undefined" ? readCheckoutCartItemUuids() : undefined,
  );

  const loadPreview = useCallback(async () => {
    if (!savedToken) return;
    setPreviewLoading(true);
    setPreviewErrorMessage(null);
    // Prefer live session (may have been cleared as stale on prior checkout steps).
    const selectedUuids = checkoutCartItemUuids ?? readCheckoutCartItemUuids();
    const { preview: data, error } = await fetchOrderPreviewWithError(savedToken, {
      currency: currency || "QAR",
      language: locale,
      couponCode: appliedCouponCode ?? undefined,
      cartItemUuids: selectedUuids,
    });
    setPreviewLoading(false);
    if (!data) {
      setPreview(null);
      setPreviewErrorMessage(error);
      return;
    }
    setPreview(data);
  }, [savedToken, currency, locale, appliedCouponCode, checkoutCartItemUuids]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const displayCurrency = useMemo(() => {
    if (!preview) return currency || "QAR";
    const meta = extractOrderPreviewMeta(preview);
    return meta.previewCurrency || currency || "QAR";
  }, [preview, currency]);

  const checkoutLines = useMemo(
    () => mapOrderPreviewCartToCheckoutLines(preview?.cart, locale),
    [preview?.cart, locale],
  );

  const cartSummary = useMemo<CartSummaryShape>(() => {
    if (!preview) return {} as CartSummaryShape;
    const subFromApi = toSafeNumber(preview.cart_total);
    const subFromLines = checkoutLines.reduce(
      (acc, l) => acc + (Number(l.price) || 0) * (Number(l.quantity) || 0),
      0,
    );
    const sub =
      subFromLines > 0 &&
      (subFromApi <= 0 ||
        Math.abs(subFromLines - subFromApi) > Math.max(1, subFromLines * 0.5))
        ? subFromLines
        : subFromApi;
    const disc = toSafeNumber(preview.discount);
    const ship = toSafeNumber(preview.shippingTotal);
    const computedGrand = sub - disc + ship;
    const apiGrand = toSafeNumber(preview.grand_total);
    const grand =
      computedGrand > 0 &&
      (apiGrand <= 0 ||
        Math.abs(apiGrand - computedGrand) > Math.max(1, computedGrand * 0.2))
        ? computedGrand
        : apiGrand || computedGrand;
    return {
      cart_total: sub,
      discount: disc,
      shipping_total: ship,
      grand_total: grand,
    };
  }, [preview, checkoutLines]);

  const reviewData = useMemo(() => {
    if (!preview) return {};
    const email = String(user?.email ?? Cookies.get("email") ?? "");
    return buildOrderReviewDataFromPreview(
      preview,
      email,
      readCheckoutReviewSession(),
      displayCurrency,
    );
  }, [preview, user?.email, displayCurrency]);

  const subtotal = cartSummary.cart_total ?? 0;
  const discount = cartSummary.discount ?? 0;
  const shippingCost = toSafeNumber(preview?.shippingTotal ?? cartSummary.shipping_total);
  const grandTotal = cartSummary.grand_total ?? subtotal - discount + shippingCost;

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [skipCashModalOpen, setSkipCashModalOpen] = useState(false);

  const checkoutSession = useMemo(() => readCheckoutReviewSession(), []);
  const skipCashPaymentSelected =
    String(checkoutSession.paymentMethod ?? "")
      .trim()
      .toUpperCase() === "CREDIT_CARD";
  const skipCashSavedCardTokenId =
    typeof checkoutSession.skipcashSavedCardTokenId === "string"
      ? checkoutSession.skipcashSavedCardTokenId
      : null;

  const skipCashCardFormRef = useRef<SkipCashCardFormHandle | null>(null);
  const [skipCashOrder, setSkipCashOrder] = useState<CreateOrderResponse | null>(null);
  const [skipCashSessionId, setSkipCashSessionId] = useState<string | null>(null);
  const [skipCashCreatingSession, setSkipCashCreatingSession] = useState(false);
  const [skipCashCreateError, setSkipCashCreateError] = useState<string | null>(null);

  const handleApplyCoupon = useCallback(async () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error(t("enterCouponCode"), {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }
    if (!savedToken) return;
    setApplyingCoupon(true);
    try {
      const { preview: data, error } = await fetchOrderPreviewWithError(savedToken, {
        currency: currency || "QAR",
        language: locale,
        couponCode: code,
        cartItemUuids: checkoutCartItemUuids ?? readCheckoutCartItemUuids(),
      });
      if (!data) {
        toast.error(resolveApiErrorMessage(error, t("somethingWentWrong")), {
          position: "top-center",
          autoClose: 3500,
        });
        return;
      }
      setPreviewErrorMessage(null);
      setAppliedCouponCode(code);
      setPreview(data);
      toast.success(t("applied") || "Applied", {
        position: "top-center",
        autoClose: 1500,
      });
    } catch (e) {
      const msg =
        (e instanceof Error && e.message.trim() ? e.message : null) ||
        t("somethingWentWrong");
      toast.error(msg, { position: "top-center", autoClose: 3500 });
    } finally {
      setApplyingCoupon(false);
    }
  }, [couponInput, t, savedToken, currency, locale, checkoutCartItemUuids]);

  const createSkipCashSession = useCallback(async () => {
    if (!savedToken || !preview) return false;

    const cartItemUuids = (preview.cart ?? [])
      .map((line) => (typeof line.uuid === "string" ? line.uuid.trim() : ""))
      .filter(Boolean);

    if (!cartItemUuids.length) {
      toast.error(t("somethingWentWrong"), {
        position: "top-center",
        autoClose: 3000,
      });
      return false;
    }

    setSkipCashCreatingSession(true);
    setSkipCashCreateError(null);
    setSkipCashOrder(null);
    setSkipCashSessionId(null);

    try {
      const { order, error } = await createOrder(savedToken, {
        cartItemUuids,
        paymentMethod: "credit_card",
        currency: String(displayCurrency || "QAR").toLowerCase(),
        couponCode: appliedCouponCode ?? undefined,
        tokenizeCard: Boolean(checkoutSession.skipcashTokenizeCard),
      });

      if (!order?.uuid) {
        const msg = resolveApiErrorMessage(error, t("placeOrderFailed"));
        setSkipCashCreateError(msg);
        toast.error(msg, { position: "top-center", autoClose: 4000 });
        return false;
      }

      const sdkSessionId = extractSkipCashSessionId(order);
      if (!sdkSessionId) {
        setSkipCashCreateError(t("placeOrderFailed"));
        toast.error(t("placeOrderFailed"), { position: "top-center", autoClose: 4000 });
        return false;
      }

      setSkipCashOrder(order);
      setSkipCashSessionId(sdkSessionId);
      return true;
    } catch (e) {
      const msg =
        e instanceof Error && e.message.trim() ? e.message : t("placeOrderFailed");
      setSkipCashCreateError(msg);
      toast.error(msg, { position: "top-center", autoClose: 4000 });
      return false;
    } finally {
      setSkipCashCreatingSession(false);
    }
  }, [savedToken, preview, appliedCouponCode, displayCurrency, t]);

  const handlePlaceOrder = useCallback(async () => {
    if (!savedToken || !preview) return;

    if (skipCashPaymentSelected) {
      if (skipCashSavedCardTokenId) {
        const cartItemUuids = (preview.cart ?? [])
          .map((line) => (typeof line.uuid === "string" ? line.uuid.trim() : ""))
          .filter(Boolean);
        if (!cartItemUuids.length) {
          toast.error(t("somethingWentWrong"), {
            position: "top-center",
            autoClose: 3000,
          });
          return;
        }
        setPlacingOrder(true);
        try {
          const { order, error } = await createOrder(savedToken, {
            cartItemUuids,
            paymentMethod: "credit_card",
            currency: String(displayCurrency || "QAR").toLowerCase(),
            couponCode: appliedCouponCode ?? undefined,
            redirectUrl: absoluteLocaleUrl(locale, "/checkout/confirmation"),
            tokenId: skipCashSavedCardTokenId,
          });

          if (!order?.uuid) {
            trackPaymentAttempt({
              paymentMethod: "credit_card",
              value: grandTotal,
              currency: displayCurrency,
              errorCode: "create_order_failed",
              errorStage: "create_order",
            });
            toast.error(resolveApiErrorMessage(error, t("placeOrderFailed")), {
              position: "top-center",
              autoClose: 4000,
            });
            return;
          }

          const payUrl = getOrderPayUrl(order);
          if (payUrl || order.paymentTransaction) {
            trackPaymentAttempt({
              orderId: order.uuid,
              gatewayTransactionReference:
                order.paymentTransaction?.transactionId ?? order.paymentTransaction?.id,
              paymentMethod: order.paymentTransaction?.provider ?? "credit_card",
              value: toSafeNumber(order.total?.amount ?? grandTotal),
              currency: order.total?.currencyCode ?? displayCurrency,
            });
          }
          if (payUrl) {
            const userId = Cookies.get("id");
            if (userId) invalidateUserCartCache(userId);
            dispatchCartCountInvalidated();
            writeCheckoutCartItemUuids(null);
            window.location.assign(payUrl);
            return;
          }
          const loc = pathname?.split("/")[1] || "en";
          const params = new URLSearchParams();
          params.set("orderId", order.uuid);
          params.set("orderNumber", `#${order.uuid.slice(0, 8)}`);
          if (order.eta?.trim()) params.set("estDelivery", order.eta.trim());
          const userId = Cookies.get("id");
          if (userId) invalidateUserCartCache(userId);
          dispatchCartCountInvalidated();
          writeCheckoutCartItemUuids(null);
          router.push(`/${loc}/checkout/confirmation?${params.toString()}`);
          return;
        } catch {
          trackPaymentAttempt({
            paymentMethod: "credit_card",
            value: grandTotal,
            currency: displayCurrency,
            errorCode: "create_order_exception",
            errorStage: "create_order",
          });
          toast.error(t("placeOrderFailed"), {
            position: "top-center",
            autoClose: 4000,
          });
        } finally {
          setPlacingOrder(false);
        }
        return;
      }

      if (skipCashCreateError) {
        toast.error(skipCashCreateError, { position: "top-center", autoClose: 3500 });
        return;
      }
      if (skipCashCreatingSession) {
        toast.info(t("loadingSkipCashPayment"), {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }

      setSkipCashModalOpen(true);
      if (!skipCashSessionId && !skipCashOrder) {
        void createSkipCashSession();
      }
      return;
    }

    const cartItemUuids = (preview.cart ?? [])
      .map((line) => (typeof line.uuid === "string" ? line.uuid.trim() : ""))
      .filter(Boolean);
    if (!cartItemUuids.length) {
      toast.error(t("somethingWentWrong"), {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    setPlacingOrder(true);
    try {
      const { order, error } = await createOrder(savedToken, {
        cartItemUuids,
        paymentMethod: "credit_card",
        currency: String(displayCurrency || "QAR").toLowerCase(),
        couponCode: appliedCouponCode ?? undefined,
      });
      if (!order?.uuid) {
        trackPaymentAttempt({
          paymentMethod: "credit_card",
          value: grandTotal,
          currency: displayCurrency,
          errorCode: "create_order_failed",
          errorStage: "create_order",
        });
        toast.error(resolveApiErrorMessage(error, t("placeOrderFailed")), {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }

      const payUrl = getOrderPayUrl(order);
      if (payUrl || order.paymentTransaction) {
        trackPaymentAttempt({
          orderId: order.uuid,
          gatewayTransactionReference:
            order.paymentTransaction?.transactionId ?? order.paymentTransaction?.id,
          paymentMethod: order.paymentTransaction?.provider ?? "credit_card",
          value: toSafeNumber(order.total?.amount ?? grandTotal),
          currency: order.total?.currencyCode ?? displayCurrency,
        });
      }
      if (payUrl) {
        const userId = Cookies.get("id");
        if (userId) invalidateUserCartCache(userId);
        dispatchCartCountInvalidated();
        writeCheckoutCartItemUuids(null);
        window.location.assign(payUrl);
        return;
      }
      const loc = pathname?.split("/")[1] || "en";
      const params = new URLSearchParams();
      params.set("orderId", order.uuid);
      params.set("orderNumber", `#${order.uuid.slice(0, 8)}`);
      if (order.eta?.trim()) params.set("estDelivery", order.eta.trim());
      const userId = Cookies.get("id");
      if (userId) invalidateUserCartCache(userId);
      dispatchCartCountInvalidated();
      writeCheckoutCartItemUuids(null);
      router.push(`/${loc}/checkout/confirmation?${params.toString()}`);
    } catch {
      trackPaymentAttempt({
        paymentMethod: "credit_card",
        value: grandTotal,
        currency: displayCurrency,
        errorCode: "create_order_exception",
        errorStage: "create_order",
      });
      toast.error(t("placeOrderFailed"), {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setPlacingOrder(false);
    }
  }, [
    savedToken,
    preview,
    appliedCouponCode,
    displayCurrency,
    grandTotal,
    pathname,
    router,
    t,
    skipCashPaymentSelected,
    skipCashSavedCardTokenId,
    skipCashSessionId,
    skipCashOrder,
    skipCashCreateError,
    skipCashCreatingSession,
    createSkipCashSession,
  ]);

  const handleSkipCashModalSubmit = useCallback(async () => {
    if (!savedToken) return;

    if (!skipCashSessionId || !skipCashOrder) {
      setPlacingOrder(true);
      const started = await createSkipCashSession();
      setPlacingOrder(false);
      if (!started) return;
      return;
    }

    const ctrl = skipCashCardFormRef.current;
    if (!ctrl?.isReady()) {
      toast.info(t("loadingSkipCashPayment"), {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    setPlacingOrder(true);
    ctrl.submit();
  }, [savedToken, skipCashSessionId, skipCashOrder, t, createSkipCashSession]);

  useEffect(() => {
    if (
      skipCashPaymentSelected &&
      !skipCashSavedCardTokenId &&
      skipCashModalOpen &&
      !skipCashSessionId &&
      !skipCashOrder &&
      !skipCashCreatingSession &&
      !skipCashCreateError
    ) {
      void createSkipCashSession();
    }
  }, [
    skipCashPaymentSelected,
    skipCashSavedCardTokenId,
    skipCashModalOpen,
    skipCashSessionId,
    skipCashOrder,
    skipCashCreatingSession,
    skipCashCreateError,
    createSkipCashSession,
  ]);

  const handleSkipCashComplete = useCallback(
    async (result: {
      status: "paid" | "failed";
      paymentId: string | null;
      orderId?: string | null;
      tokenId?: string | null;
    }) => {
      if (!savedToken || !skipCashOrder?.uuid) return;

      if (result.status !== "paid") {
        setPlacingOrder(false);
        trackPaymentAttempt({
          orderId: skipCashOrder.uuid,
          paymentMethod: "credit_card",
          value: grandTotal,
          currency: displayCurrency,
          errorCode: "skipcash_payment_failed",
          errorStage: "skipcash",
        });
        toast.error(t("placeOrderFailed"), { position: "top-center", autoClose: 4000 });
        return;
      }

      const paymentId = result.paymentId ? String(result.paymentId).trim() : "";
      if (!paymentId) {
        setPlacingOrder(false);
        trackPaymentAttempt({
          orderId: skipCashOrder.uuid,
          paymentMethod: "credit_card",
          value: grandTotal,
          currency: displayCurrency,
          errorCode: "skipcash_missing_payment_id",
          errorStage: "skipcash",
        });
        toast.error(t("placeOrderFailed"), { position: "top-center", autoClose: 4000 });
        return;
      }

      const tokenIdToSave = result.tokenId
        ? String(result.tokenId).trim()
        : skipCashSavedCardTokenId
          ? String(skipCashSavedCardTokenId).trim()
          : undefined;

      const apiRes = await submitSkipCashPaymentResult(savedToken, {
        amount: String(grandTotal),
        currency: String(displayCurrency || "QAR"),
        orderUUID: skipCashOrder.uuid,
        paymentStatus: "paid",
        paymentId,
        ...(tokenIdToSave ? { tokenId: tokenIdToSave } : {}),
      });

      if (!apiRes.ok) {
        setPlacingOrder(false);
        trackPaymentAttempt({
          orderId: skipCashOrder.uuid,
          paymentMethod: "credit_card",
          value: grandTotal,
          currency: displayCurrency,
          errorCode: "skipcash_save_card_failed",
          errorStage: "skipcash",
        });
        toast.error(apiRes.error || t("placeOrderFailed"), {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }

      trackPaymentAttempt({
        orderId: skipCashOrder.uuid,
        gatewayTransactionReference: paymentId,
        paymentMethod: "credit_card",
        value: grandTotal,
        currency: displayCurrency,
      });

      const loc = pathname?.split("/")[1] || "en";
      const params = new URLSearchParams();
      params.set("orderId", skipCashOrder.uuid);
      params.set("orderNumber", `#${skipCashOrder.uuid.slice(0, 8)}`);
      if (skipCashOrder.eta?.trim()) params.set("estDelivery", skipCashOrder.eta.trim());
      const userId = Cookies.get("id");
      if (userId) invalidateUserCartCache(userId);
      dispatchCartCountInvalidated();
      writeCheckoutCartItemUuids(null);
      router.push(`/${loc}/checkout/confirmation?${params.toString()}`);
    },
    [
      savedToken,
      skipCashOrder,
      skipCashSavedCardTokenId,
      grandTotal,
      displayCurrency,
      t,
      pathname,
      router,
    ],
  );

  const handleSkipCashError = useCallback(
    (err: Error) => {
      setPlacingOrder(false);
      if (skipCashOrder?.uuid) {
        trackPaymentAttempt({
          orderId: skipCashOrder.uuid,
          paymentMethod: "credit_card",
          value: grandTotal,
          currency: displayCurrency,
          errorCode: "skipcash_sdk_error",
          errorStage: "skipcash",
        });
      }
      toast.error(err.message || t("placeOrderFailed"), {
        position: "top-center",
        autoClose: 4000,
      });
    },
    [skipCashOrder, grandTotal, displayCurrency, t],
  );

  if (!savedToken) {
    return (
      <RootLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
          <p className="font-sans font-semibold text-xl">
            {t("pleaseSignInOrCreateAccount")}
          </p>
          <Link
            href="/auth/login"
            className="font-sans bg-[#CB262E] text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            {t("logIn")}
          </Link>
        </div>
      </RootLayout>
    );
  }

  if (previewLoading) {
    return (
      <RootLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="font-sans">{t("loading")}</p>
        </div>
      </RootLayout>
    );
  }

  if (previewErrorMessage || !preview) {
    return (
      <RootLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
          <p className="font-sans font-semibold text-xl text-center max-w-md">
            {resolveApiErrorMessage(previewErrorMessage, t("somethingWentWrong"))}
          </p>
          <button
            type="button"
            onClick={() => void loadPreview()}
            className="font-sans bg-[#CB262E] text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            {t("refresh")}
          </button>
        </div>
      </RootLayout>
    );
  }

  if (!checkoutLines.length) {
    return (
      <RootLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
          <p className="font-sans font-semibold text-xl">{t("yourCartIsEmpty")}</p>
          <Link
            href="/cart"
            className="font-sans bg-[#CB262E] text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            {t("cart")}
          </Link>
        </div>
      </RootLayout>
    );
  }

  if (!userLoading && isGuestSession()) {
    return (
      <RootLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="font-sans">{t("loading")}</p>
        </div>
      </RootLayout>
    );
  }

  const skipCashFormContent =
    skipCashPaymentSelected && !skipCashSavedCardTokenId ? (
      skipCashCreateError ? (
        <div className="font-sans text-sm text-red-600">{skipCashCreateError}</div>
      ) : skipCashSessionId ? (
        <SkipCashCardForm
          ref={skipCashCardFormRef}
          sessionId={skipCashSessionId}
          tokenizeCard={Boolean(checkoutSession.skipcashTokenizeCard)}
          onComplete={handleSkipCashComplete}
          onError={handleSkipCashError}
        />
      ) : (
        <div className="font-sans text-sm text-black/60">
          {t("loadingSkipCashPayment")}
        </div>
      )
    ) : undefined;

  return (
    <RootLayout>
      <OrderReviewCenterContent
        cart={checkoutLines}
        cartSummary={cartSummary}
        shippingCost={shippingCost}
        subtotal={subtotal}
        discount={discount}
        grandTotal={grandTotal}
        currencyCode={displayCurrency}
        appliedCouponCode={appliedCouponCode}
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        onApplyCoupon={handleApplyCoupon}
        applyingCoupon={applyingCoupon}
        onPlaceOrder={handlePlaceOrder}
        primaryActionLabel={t("makePayment") || "Make payment"}
        placingOrder={
          placingOrder || (skipCashPaymentSelected ? skipCashCreatingSession : false)
        }
        reviewData={reviewData}
        paymentDialogOpen={
          skipCashPaymentSelected && !skipCashSavedCardTokenId && skipCashModalOpen
        }
        onClosePaymentDialog={() => setSkipCashModalOpen(false)}
        onSubmitPaymentDialog={handleSkipCashModalSubmit}
        paymentDialogSubmitting={placingOrder}
        paymentFormReady={Boolean(
          skipCashSessionId && skipCashOrder && !skipCashCreateError,
        )}
        skipCashCardForm={skipCashModalOpen ? skipCashFormContent : undefined}
      />
    </RootLayout>
  );
}

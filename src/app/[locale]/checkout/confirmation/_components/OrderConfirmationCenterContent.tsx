"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Roadmap from "@/componentsedit/Roadmap";
import SimilarProductsSection from "@/app/[locale]/shop/[slug]/_components/SimilarProductsSection";
import { toast } from "@/componentsedit/toast";
import {
  CHECKOUT_FLOW_PAGE_SHELL_CLASS,
  PAGE_CONTENT_INNER_CLASS,
} from "@/lib/layout/pageContentLayout";
import { canRetryOrderPayment } from "@/lib/order/canRetryOrderPayment";
import {
  buildRetryPaymentRequestBody,
  retryOrderPayment,
} from "@/services/orders/retryOrderPayment";
import { getOrderPayUrl } from "@/services/orders/createOrder";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { gqlMoneyToNumber } from "@/services/graphql/money";
import { absoluteLocaleUrl } from "@/lib/seo/siteUrl";
import { fetchCustomerSavedCards, type GqlCustomerSavedCard } from "@/services/graphql";
import { PaymentMethodIconByType } from "@/componentsedit/PaymentMethodIcons";
import { readCheckoutReviewSession } from "@/lib/checkout/checkoutReviewSession";
import SkipCashCardForm, {
  type SkipCashCardFormHandle,
} from "@/app/[locale]/checkout/order-review/_components/SkipCashCardForm";
import { submitSkipCashPaymentResult } from "@/services/skipcash/skipcashApi";

function extractSkipCashSessionId(order: any): string | null {
  if (!order || typeof order !== "object") return null;
  const candidateKeys = [
    "sessionId",
    "sessionID",
    "session_id",
    "paymentSessionId",
    "paymentSessionID",
    "paymentSession_id",
    "checkoutSessionId",
    "checkoutSessionID",
    "checkoutSession_id",
  ];
  const seen = new Set<unknown>();
  const stack: unknown[] = [order];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const [key, value] of Object.entries(cur as Record<string, unknown>)) {
      if (candidateKeys.includes(key)) {
        const s = typeof value === "string" ? value.trim() : "";
        if (s) return s;
      }
      if (value && typeof value === "object") stack.push(value);
    }
  }
  return null;
}

type OrderConfirmationCenterContentProps = {
  orderNumber?: string;
  estDelivery?: string;
  trackOrderHref?: string;
  order?: {
    uuid?: string;
    status?: string;
    subTotal?: { amount?: number; minorAmount?: number; currencyCode?: string };
    shippingCost?: { amount?: number; minorAmount?: number; currencyCode?: string };
    discount?: { amount?: number; minorAmount?: number; currencyCode?: string };
    total?: { amount?: number; minorAmount?: number; currencyCode?: string };
    paymentTransaction?: {
      id?: string;
      provider?: string;
      transactionId?: string;
    };
  };
};

const ShoppingBagIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white shrink-0"
  >
    <path
      d="M6 10l2-6h16l2 6v16H6V10z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 10V6a5 5 0 0110 0v4"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PRIMARY_OUTLINE_BTN_CLASS =
  "box-border flex flex-row justify-center items-center w-full max-w-[1122px] h-[50px] border border-[#CB262E] rounded-[5px] font-sans font-semibold text-[#CB262E] capitalize hover:opacity-90 transition-opacity disabled:opacity-60 disabled:pointer-events-none";

function ProcessingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:180ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:360ms]" />
      </span>
    </span>
  );
}

function normalizeSavedCardBrand(brand?: string | null): string {
  const value = String(brand ?? "")
    .trim()
    .toLowerCase();

  if (!value) return "visa";

  if (
    [
      "mastercard",
      "master-card",
      "master_card",
      "master card",
      "mc",
      "paywithcard",
      "skipcash",
      "credit card",
      "creditcard",
      "debit card",
      "debitcard",
    ].includes(value) ||
    value.includes("master")
  ) {
    return "mastercard";
  }

  if (
    value.includes("visa") ||
    ["visaelectron", "visa-electron", "visa electron"].includes(value)
  ) {
    return "visa";
  }

  if (value.includes("amex") || ["american express", "americanexpress"].includes(value)) {
    return "amex";
  }

  return value;
}

export default function OrderConfirmationCenterContent({
  orderNumber,
  estDelivery,
  trackOrderHref,
  order,
}: OrderConfirmationCenterContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const checkoutSession = readCheckoutReviewSession();
  const checkoutMethodType = String(checkoutSession.paymentMethodType ?? "mastercard");
  const [retrying] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [retrySelection, setRetrySelection] = useState<"saved-card" | "new-card" | null>(
    null,
  );
  const [retryFormVisible, setRetryFormVisible] = useState(false);
  const [savedRetryCards, setSavedRetryCards] = useState<GqlCustomerSavedCard[]>([]);
  const [selectedSavedRetryCardTokenId, setSelectedSavedRetryCardTokenId] = useState<
    string | null
  >(null);
  const [retrySessionId, setRetrySessionId] = useState<string | null>(null);
  const [retrySessionOrderUuid, setRetrySessionOrderUuid] = useState<string | null>(null);
  const retryCardFormRef = useRef<SkipCashCardFormHandle | null>(null);
  const [retryDialogSubmitting, setRetryDialogSubmitting] = useState(false);

  const orderNumberDisplay = orderNumber?.trim() || t("orderReferenceUnavailable");
  const estDeliveryDisplay = estDelivery?.trim() || t("deliveryEtaUnavailable");

  const currency =
    order?.total?.currencyCode?.toUpperCase?.() ||
    order?.subTotal?.currencyCode?.toUpperCase?.() ||
    "";
  const sub = gqlMoneyToNumber(order?.subTotal) ?? NaN;
  const ship = gqlMoneyToNumber(order?.shippingCost) ?? NaN;
  const disc = gqlMoneyToNumber(order?.discount) ?? NaN;
  const total = gqlMoneyToNumber(order?.total) ?? NaN;

  const orderUuid = String(order?.uuid ?? "").trim();
  const showRetryPayment = Boolean(orderUuid) && canRetryOrderPayment(order?.status);

  const loadRetrySavedCards = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const res = await fetchCustomerSavedCards(token);
      const rows = Array.isArray(res.getCustomerSavedCards)
        ? res.getCustomerSavedCards.filter((card) => card.isActive !== false)
        : [];
      setSavedRetryCards(rows);
      if (rows.length > 0 && !selectedSavedRetryCardTokenId) {
        setSelectedSavedRetryCardTokenId(String(rows[0]?.tokenId ?? ""));
      }
    } catch {
      setSavedRetryCards([]);
    }
  }, [selectedSavedRetryCardTokenId]);

  useEffect(() => {
    if (!retryDialogOpen) return;
    void loadRetrySavedCards();
  }, [loadRetrySavedCards, retryDialogOpen]);

  const handleRetryPayment = useCallback(() => {
    if (!orderUuid) return;
    setRetrySelection(null);
    setRetryFormVisible(false);
    setSelectedSavedRetryCardTokenId(null);
    setRetrySessionId(null);
    setRetrySessionOrderUuid(null);
    setRetryDialogOpen(true);
  }, [orderUuid]);

  const handleRetryDialogSubmit = useCallback(async () => {
    if (!orderUuid) return;
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("pleaseLogin") || t("retryPaymentFailed"), {
        position: "top-center",
        autoClose: 4000,
      });
      return;
    }

    if (retrySelection === "saved-card") {
      if (!selectedSavedRetryCardTokenId) {
        toast.error(t("pleaseSelectSavedCard") || "Please select a saved card", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      setRetryDialogSubmitting(true);
      try {
        const payload = buildRetryPaymentRequestBody({
          fallbackPaymentMethod: "credit_card",
          redirectUrl: absoluteLocaleUrl(locale, "/checkout/confirmation"),
          session: {
            paymentMethodType: "visa",
            skipcashSavedCardTokenId: selectedSavedRetryCardTokenId,
          },
        });
        const { order: retried, error } = await retryOrderPayment(
          token,
          orderUuid,
          payload,
        );
        if (!retried?.uuid) {
          toast.error(String(error ?? "").trim() || t("retryPaymentFailed"), {
            position: "top-center",
            autoClose: 4000,
          });
          return;
        }

        const payUrl = getOrderPayUrl(retried);
        if (payUrl) {
          window.location.assign(payUrl);
          return;
        }

        const redirect = new URL(absoluteLocaleUrl(locale, "/checkout/confirmation"));
        redirect.searchParams.set("orderId", retried.uuid);
        redirect.searchParams.set("orderNumber", `#${retried.uuid.slice(0, 8)}`);
        if (retried.eta?.trim())
          redirect.searchParams.set("estDelivery", retried.eta.trim());
        window.location.assign(redirect.toString());
      } catch (e) {
        const msg =
          (e instanceof Error && e.message.trim() ? e.message : null) ||
          t("retryPaymentFailed");
        toast.error(msg, { position: "top-center", autoClose: 4000 });
      } finally {
        setRetryDialogSubmitting(false);
      }
      return;
    }

    if (retrySelection === "new-card") {
      setRetryDialogSubmitting(true);
      try {
        const payload = buildRetryPaymentRequestBody({
          fallbackPaymentMethod: "credit_card",
          session: {
            paymentMethodType: "visa",
            skipcashTokenizeCard: false,
          },
        });
        const { order: retried, error } = await retryOrderPayment(
          token,
          orderUuid,
          payload,
        );
        if (!retried?.uuid) {
          toast.error(String(error ?? "").trim() || t("retryPaymentFailed"), {
            position: "top-center",
            autoClose: 4000,
          });
          setRetryDialogSubmitting(false);
          return;
        }
        const sessionId = extractSkipCashSessionId(retried);
        if (!sessionId) {
          toast.error(t("retryPaymentFailed"), {
            position: "top-center",
            autoClose: 4000,
          });
          setRetryDialogSubmitting(false);
          return;
        }
        setRetryFormVisible(true);
        setRetrySessionOrderUuid(retried.uuid);
        setRetrySessionId(sessionId);
        setRetryDialogSubmitting(false);
      } catch (e) {
        const msg =
          (e instanceof Error && e.message.trim() ? e.message : null) ||
          t("retryPaymentFailed");
        toast.error(msg, { position: "top-center", autoClose: 4000 });
        setRetryDialogSubmitting(false);
      }
      return;
    }

    toast.error(t("pleaseSelectPaymentMethod") || "Please select a payment method", {
      position: "top-center",
      autoClose: 3000,
    });
  }, [locale, orderUuid, retrySelection, selectedSavedRetryCardTokenId, t]);

  const handleRetrySkipCashComplete = useCallback(
    async (result: {
      status: "paid" | "failed";
      paymentId: string | null;
      orderId?: string | null;
      tokenId?: string | null;
    }) => {
      setRetryDialogSubmitting(false);
      const token = Cookies.get("token");
      if (!token || !retrySessionOrderUuid) return;
      if (result.status !== "paid") {
        toast.error(t("retryPaymentFailed"), { position: "top-center", autoClose: 4000 });
        return;
      }
      const paymentId = result.paymentId ? String(result.paymentId).trim() : "";
      if (!paymentId) {
        toast.error(t("retryPaymentFailed"), { position: "top-center", autoClose: 4000 });
        return;
      }
      const apiRes = await submitSkipCashPaymentResult(token, {
        amount: String(Number.isFinite(total) ? total : 0),
        currency: String(currency || "QAR").toUpperCase(),
        orderUUID: retrySessionOrderUuid,
        paymentStatus: "paid",
        paymentId,
        ...(result.tokenId ? { tokenId: String(result.tokenId).trim() } : {}),
      });
      if (!apiRes.ok) {
        toast.error(apiRes.error || t("retryPaymentFailed"), {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }
      const redirect = new URL(absoluteLocaleUrl(locale, "/checkout/confirmation"));
      redirect.searchParams.set("orderId", retrySessionOrderUuid);
      redirect.searchParams.set("orderNumber", `#${retrySessionOrderUuid.slice(0, 8)}`);
      window.location.assign(redirect.toString());
    },
    [currency, locale, retrySessionOrderUuid, t, total],
  );

  const handleRetryPrimaryAction = useCallback(() => {
    if (retrySelection === "new-card") {
      if (!retryFormVisible || !retrySessionId) {
        void handleRetryDialogSubmit();
        return;
      }

      const ctrl = retryCardFormRef.current;
      if (!ctrl?.isReady()) {
        toast.info(t("loadingSkipCashPayment"), {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }

      setRetryDialogSubmitting(true);
      ctrl.submit();
      return;
    }

    void handleRetryDialogSubmit();
  }, [handleRetryDialogSubmit, retryFormVisible, retrySelection, retrySessionId, t]);

  const handleRetryCardError = useCallback(
    (err: Error) => {
      setRetryDialogSubmitting(false);
      toast.error(err.message || t("retryPaymentFailed"), {
        position: "top-center",
        autoClose: 4000,
      });
    },
    [t],
  );

  const breadcrumbItems = [
    { label: t("home"), href: "/" },
    { label: t("cart"), href: "/cart" },
    { label: t("checkout"), href: "/checkout" },
    { label: t("orderReview"), href: "/checkout/order-review" },
    { label: t("orderPlaced") },
  ].filter((i) => i.label);

  return (
    <div className={`${CHECKOUT_FLOW_PAGE_SHELL_CLASS} pt-6 pb-12 bg-white`}>
      <div className={PAGE_CONTENT_INNER_CLASS}>
        <div className="flex flex-col gap-6 mb-8">
          <Roadmap items={breadcrumbItems} />
        </div>

        <div className="flex flex-col items-start gap-6 w-full">
          <h1
            className="font-sans font-medium text-[#000000]"
            style={{ fontSize: 20, lineHeight: "30px" }}
          >
            {t("orderPlaced")}
          </h1>

          <div className="mx-auto box-border flex w-full flex-col items-center gap-6 rounded-[10px] border border-black/15 bg-white px-6 py-[18px]">
            <div className="w-[50px] h-[50px] rounded-full bg-[#CB262E] flex items-center justify-center flex-shrink-0">
              <ShoppingBagIcon />
            </div>
            <div className="flex flex-col items-center gap-2 max-w-[315px]">
              <p
                className="font-sans font-medium text-[#000000] text-center capitalize"
                style={{ fontSize: 16, lineHeight: "24px" }}
              >
                {t("paymentConfirmed")}
              </p>
              <p
                className="font-sans font-normal text-[#000000] text-center capitalize"
                style={{ fontSize: 12, lineHeight: "18px" }}
              >
                {t("orderConfirmationDescription")}
              </p>
            </div>
            <div className="flex flex-row items-start justify-center gap-6 flex-wrap">
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                <span
                  className="font-sans font-medium text-[#000000] capitalize"
                  style={{ fontSize: 12, lineHeight: "18px" }}
                >
                  {t("orderNumber")}
                </span>
                <span
                  className="font-sans font-semibold text-[#000000] capitalize"
                  style={{ fontSize: 16, lineHeight: "24px" }}
                >
                  {orderNumberDisplay}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                <span
                  className="font-sans font-medium text-[#000000] capitalize"
                  style={{ fontSize: 12, lineHeight: "18px" }}
                >
                  {t("estDelivery")}
                </span>
                <span
                  className="font-sans font-semibold text-[#000000] capitalize"
                  style={{ fontSize: 16, lineHeight: "24px" }}
                >
                  {estDeliveryDisplay}
                </span>
              </div>
              {order?.status ? (
                <div className="flex flex-col gap-0.5 min-w-[120px]">
                  <span
                    className="font-sans font-medium text-[#000000] capitalize"
                    style={{ fontSize: 12, lineHeight: "18px" }}
                  >
                    {t("status")}
                  </span>
                  <span
                    className="font-sans font-semibold text-[#000000] capitalize"
                    style={{ fontSize: 16, lineHeight: "24px" }}
                  >
                    {String(order.status).replaceAll("_", " ")}
                  </span>
                </div>
              ) : null}
            </div>

            {Number.isFinite(total) ? (
              <div className="w-full max-w-[1122px] flex flex-col gap-2 rounded-[8px] border border-black/10 bg-[#F6F6F6] px-4 py-3">
                {Number.isFinite(sub) ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-sm text-black/70">
                      {t("subtotal")}
                    </span>
                    <span className="font-sans text-sm text-black">
                      {formatAmountWithCurrency(sub, currency || "QAR", locale)}
                    </span>
                  </div>
                ) : null}
                {Number.isFinite(ship) ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-sm text-black/70">
                      {t("shippingFee")}
                    </span>
                    <span className="font-sans text-sm text-black">
                      {formatAmountWithCurrency(ship, currency || "QAR", locale)}
                    </span>
                  </div>
                ) : null}
                {Number.isFinite(disc) ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-sm text-black/70">
                      {t("discount")}
                    </span>
                    <span className="font-sans text-sm text-black">
                      {formatAmountWithCurrency(disc, currency || "QAR", locale)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-2">
                  <span className="font-sans font-semibold text-black">
                    {t("grandTotal")}
                  </span>
                  <span className="font-sans font-semibold text-black">
                    {formatAmountWithCurrency(total, currency || "QAR", locale)}
                  </span>
                </div>
              </div>
            ) : null}
            {showRetryPayment ? (
              <button
                type="button"
                onClick={() => void handleRetryPayment()}
                disabled={retrying}
                className={PRIMARY_OUTLINE_BTN_CLASS}
                style={{ fontSize: 16, lineHeight: "24px", padding: "20px 34px" }}
              >
                {retrying ? t("submitting") : t("retryPayment")}
              </button>
            ) : trackOrderHref ? (
              <Link
                href={trackOrderHref}
                className={PRIMARY_OUTLINE_BTN_CLASS}
                style={{ fontSize: 16, lineHeight: "24px", padding: "20px 34px" }}
              >
                {t("trackYourOrder")}
              </Link>
            ) : (
              <div
                className={PRIMARY_OUTLINE_BTN_CLASS}
                style={{ fontSize: 16, lineHeight: "24px", padding: "20px 34px" }}
              >
                {t("trackYourOrder")}
              </div>
            )}
          </div>

          <Link
            href="/"
            className="mx-auto flex w-full flex-row items-center justify-center rounded-[5px] bg-[#CB262E] font-sans font-semibold capitalize text-white transition-opacity hover:opacity-90"
            style={{ height: 56, fontSize: 16, lineHeight: "24px", padding: "16px 34px" }}
          >
            {t("backToHomepage")}
          </Link>
        </div>

        {retryDialogOpen ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setRetryDialogOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-6">
              <div className="w-full bg-white shadow-[0_-12px_32px_rgba(0,0,0,0.14)] rounded-t-[20px] md:rounded-[18px] md:max-w-[520px] md:shadow-[0_18px_40px_rgba(0,0,0,0.2)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                  <div className="font-sans font-semibold text-black text-base">
                    {t("retryPayment")}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRetryDialogOpen(false)}
                    className="text-2xl leading-none text-black/70"
                  >
                    ×
                  </button>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => setRetrySelection("saved-card")}
                    className={`box-border flex items-center justify-between w-full rounded-[5px] border px-4 py-3 ${
                      retrySelection === "saved-card"
                        ? "border-[#CB262E] bg-[#FFF5F5]"
                        : "border-black/15 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PaymentMethodIconByType type="visa" />
                      <span className="font-sans font-medium text-black">
                        {t("savedCards")}
                      </span>
                    </div>
                    <span className="font-sans text-xs text-black/60">
                      {savedRetryCards.length} {t("savedCards")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRetrySelection("new-card")}
                    className={`box-border flex items-center justify-between w-full rounded-[5px] border px-4 py-3 ${
                      retrySelection === "new-card"
                        ? "border-[#CB262E] bg-[#FFF5F5]"
                        : "border-black/15 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PaymentMethodIconByType type={checkoutMethodType} />
                      <span className="font-sans font-medium text-black">
                        {checkoutMethodType === "debit"
                          ? t("paymentMethodDebit") || "Debit card"
                          : t("creditCard") || "Credit card"}
                      </span>
                    </div>
                  </button>

                  {retrySelection === "saved-card" && savedRetryCards.length > 0 ? (
                    <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
                      {savedRetryCards.map((card) => {
                        const tokenId = card.tokenId ? String(card.tokenId) : "";
                        if (!tokenId) return null;
                        const isSelected = selectedSavedRetryCardTokenId === tokenId;
                        const iconType = normalizeSavedCardBrand(card.cardBrand);
                        return (
                          <button
                            key={card.uuid}
                            type="button"
                            onClick={() => setSelectedSavedRetryCardTokenId(tokenId)}
                            className={`box-border flex items-center justify-between w-full rounded-[5px] border px-4 py-3 ${
                              isSelected
                                ? "border-[#CB262E] bg-[#FFF5F5]"
                                : "border-black/15 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <PaymentMethodIconByType type={iconType} />
                              <span className="font-sans text-sm text-black">
                                {String(card.cardBrand ?? "CARD").toUpperCase()} ••••{" "}
                                {card.last4 ?? "—"}
                              </span>
                            </div>
                            {card.isDefault ? (
                              <span className="font-sans text-[10px] uppercase text-[#CB262E]">
                                {t("defaultAddressBadge")}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {retrySelection === "new-card" && retryFormVisible && retrySessionId ? (
                    <SkipCashCardForm
                      ref={retryCardFormRef}
                      sessionId={retrySessionId}
                      tokenizeCard={true}
                      onComplete={handleRetrySkipCashComplete}
                      onError={handleRetryCardError}
                    />
                  ) : null}
                </div>

                <div className="border-t border-black/10 p-5">
                  <button
                    type="button"
                    onClick={() => void handleRetryPrimaryAction()}
                    disabled={retryDialogSubmitting || !retrySelection}
                    className="w-full h-12 rounded-[5px] bg-[#CB262E] text-white font-sans font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {retryDialogSubmitting ? (
                      <ProcessingButtonLabel
                        label={t("paymentProcessing") || "Payment is being processed"}
                      />
                    ) : (
                      t("makePayment") || "Make payment"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="mt-12 w-full">
          <SimilarProductsSection />
        </div>
      </div>
    </div>
  );
}

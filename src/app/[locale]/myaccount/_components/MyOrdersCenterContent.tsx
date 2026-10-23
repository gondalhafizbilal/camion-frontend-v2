"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useUser } from "@/componentsedit/context/UserContext";
import {
  fetchCurrentCustomerOrders,
  fetchCustomerSavedCards,
  gqlMoneyToNumberOrZero,
  type GqlCustomerSavedCard,
} from "@/services/graphql";
import ReturnRequestModal from "@/app/[locale]/track/_components/ReturnRequestModal";
import OrderStatusBadge from "@/componentsedit/order/OrderStatusBadge";
import { resolveOrderListStatusBucket } from "@/lib/order/orderStatusBadge";
import { resolveOrderDisplayStatus } from "@/lib/order/orderDisplayStatus";
import { canRetryOrderPayment } from "@/lib/order/canRetryOrderPayment";
import {
  buildRetryPaymentRequestBody,
  retryOrderPayment,
} from "@/services/orders/retryOrderPayment";
import { getOrderPayUrl } from "@/services/orders/createOrder";
import type { MyOrdersListItem } from "@/types/checkoutDisplay";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { absoluteLocaleUrl } from "@/lib/seo/siteUrl";
import { PaymentMethodIconByType } from "@/componentsedit/PaymentMethodIcons";
import SkipCashCardForm, {
  type SkipCashCardFormHandle,
} from "@/app/[locale]/checkout/order-review/_components/SkipCashCardForm";
import { submitSkipCashPaymentResult } from "@/services/skipcash/skipcashApi";

function extractSkipCashSessionId(order: any): string | null {
  if (!order || typeof order !== "object") return null;
  const keys = [
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
      if (keys.includes(key)) {
        const text = typeof value === "string" ? value.trim() : "";
        if (text) return text;
      }
      if (value && typeof value === "object") stack.push(value);
    }
  }
  return null;
}

type IntlT = ReturnType<typeof useTranslations>;

const ORDER_FILTER_KEYS = ["all", "delivered", "inprocess", "confirmed"] as const;

function orderFilterLabel(key: (typeof ORDER_FILTER_KEYS)[number], t: IntlT): string {
  if (key === "all") return t("ordersFilterAll");
  if (key === "delivered") return t("ordersFilterDelivered");
  if (key === "inprocess") return t("ordersFilterInProcess");
  return t("ordersFilterCompleted");
}

function normalizeStatus(s: string | undefined) {
  return resolveOrderListStatusBucket(s);
}

function canRequestReturnFromStatus(statusDisplay: string | undefined): boolean {
  const x = String(statusDisplay || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return x.includes("delivered");
}

function StatCard({ count, label }: { count: number; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center flex-shrink-0 min-w-0 box-border bg-white w-full min-h-[72px] sm:min-h-[82px] px-1 py-2 sm:px-2 sm:py-3"
      style={{
        border: "1px solid rgba(0,0,0,0.15)",
        borderRadius: 5,
        gap: 6,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          background: "#CB262E",
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 16,
          lineHeight: "24px",
        }}
      >
        {count}
      </div>
      <span
        className="text-[9px] leading-[13px] sm:text-[10px] sm:leading-[18px] text-center break-words max-w-full"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 600,
          textTransform: "capitalize",
          color: "#000000",
        }}
      >
        {label}
      </span>
    </div>
  );
}

const ACTION_BTN_CLASS =
  "flex items-center justify-center hover:opacity-90 w-full sm:w-[147px] h-10 bg-[#CB262E] rounded-[5px] font-sans font-semibold text-sm leading-6 capitalize text-white px-4 disabled:opacity-60 disabled:pointer-events-none";

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

function OrderRow({
  order,
  t,
  currency,
  locale,
  onRequestReturn,
  onRetryPayment,
  retrying,
}: {
  order: MyOrdersListItem;
  t: IntlT;
  currency: string;
  locale: string;
  onRequestReturn: () => void;
  onRetryPayment: () => void;
  retrying: boolean;
}) {
  const canRequestReturn = canRequestReturnFromStatus(order.statusDisplay);
  const showRetryPayment = canRetryOrderPayment(
    typeof order.status === "string" ? order.status : order.statusDisplay,
  );

  const placementMs =
    order.createdAt != null && order.createdAt !== ""
      ? new Date(order.createdAt).getTime()
      : NaN;
  const dateStr = Number.isFinite(placementMs)
    ? new Date(placementMs).toLocaleString(locale === "ar" ? "ar" : "en", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const grandTotalNum = Number(order.grandTotal);
  const grand =
    grandTotalNum > 0
      ? grandTotalNum
      : Number(order.total ?? 0) -
        Number(order.discount ?? 0) +
        Number(order.shippingCost ?? 0);

  return (
    <div className="relative w-full max-w-[710px] box-border bg-white min-h-0 sm:min-h-[138px] border border-[#D9D9D9] rounded-[5px] p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("orderPrefix")}
            {order.wcOrderId ?? order.id}
          </span>
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("orderPlacedAtLabel")} {dateStr}
          </span>
        </div>
        <OrderStatusBadge statusDisplay={order.statusDisplay} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-4 max-w-md sm:max-w-none">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("orderLineItemCountLabel")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 16,
              lineHeight: "24px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {String(itemCount).padStart(3, "0")}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("orderTotalShort")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 16,
              lineHeight: "24px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {formatAmountWithCurrency(grand, currency, locale)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-stretch sm:justify-end gap-3 mt-4">
        {showRetryPayment ? (
          <button
            type="button"
            onClick={onRetryPayment}
            disabled={retrying}
            className={ACTION_BTN_CLASS}
          >
            {retrying ? t("submitting") : t("retryPayment")}
          </button>
        ) : (
          <Link
            href={order.id ? `/myaccount/orders/${order.id}/track` : "#"}
            className={ACTION_BTN_CLASS}
          >
            {t("trackOrder")}
          </Link>
        )}
        <Link
          href={order.id ? `/myaccount/orders/${order.id}` : "#"}
          className={ACTION_BTN_CLASS}
        >
          {t("details")}
        </Link>
        {canRequestReturn && (
          <button type="button" onClick={onRequestReturn} className={ACTION_BTN_CLASS}>
            {t("requestReturn") || "Request Return"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyOrdersCenterContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { loading: userLoading } = useUser();
  const token = Cookies.get("token");
  const [orders, setOrders] = useState<MyOrdersListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState<string>("QAR");
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderUuid, setReturnOrderUuid] = useState<string>("");
  const [returnOrderItems, setReturnOrderItems] = useState<unknown[]>([]);
  const [retryingOrderId] = useState<string | null>(null);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [retryDialogOrderId, setRetryDialogOrderId] = useState<string>("");
  const [retrySelection, setRetrySelection] = useState<
    "saved-card" | "new-card-credit" | "new-card-debit" | null
  >(null);
  const [retryFormVisible, setRetryFormVisible] = useState(false);
  const [savedRetryCards, setSavedRetryCards] = useState<GqlCustomerSavedCard[]>([]);
  const [selectedSavedRetryCardTokenId, setSelectedSavedRetryCardTokenId] = useState<
    string | null
  >(null);
  const [retrySessionId, setRetrySessionId] = useState<string | null>(null);
  const [retrySessionOrderUuid, setRetrySessionOrderUuid] = useState<string | null>(null);
  const retryCardFormRef = useRef<SkipCashCardFormHandle | null>(null);
  const [retryDialogSubmitting, setRetryDialogSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const language = locale === "ar" ? "ar" : "en";
      const data = await fetchCurrentCustomerOrders(
        { currency: "QAR", language },
        token ?? null,
      );
      const list = Array.isArray(data?.getCurrentCustomerOrders)
        ? data.getCurrentCustomerOrders
        : [];

      const mapped: MyOrdersListItem[] = list.map((o) => ({
        id: o.uuid,
        wcOrderId: o.uuid,
        status: o.status ?? undefined,
        statusDisplay: resolveOrderDisplayStatus(o),
        items: o.orderItems ?? [],
        grandTotal: gqlMoneyToNumberOrZero(o.total),
        total: gqlMoneyToNumberOrZero(o.total),
        discount: gqlMoneyToNumberOrZero(o.discount),
        shippingCost: gqlMoneyToNumberOrZero(o.shippingCost),
        createdAt:
          o.orderPlacementDate != null && String(o.orderPlacementDate).trim() !== ""
            ? o.orderPlacementDate
            : undefined,
      }));

      setOrders(mapped);
      const code =
        list[0]?.total?.currencyCode ||
        list[0]?.subTotal?.currencyCode ||
        list[0]?.shippingCost?.currencyCode ||
        "QAR";
      setCurrency(String(code).toUpperCase());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, locale]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const loadRetrySavedCards = useCallback(async () => {
    const auth = Cookies.get("token");
    if (!auth) return;
    try {
      const res = await fetchCustomerSavedCards(auth);
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

  const handleRetryPayment = useCallback((orderId: string) => {
    const uuid = String(orderId || "").trim();
    if (!uuid) return;
    setRetryDialogOrderId(uuid);
    setRetrySelection(null);
    setRetryFormVisible(false);
    setSelectedSavedRetryCardTokenId(null);
    setRetrySessionId(null);
    setRetrySessionOrderUuid(null);
    setRetryDialogOpen(true);
  }, []);

  const handleRetryDialogSubmit = useCallback(async () => {
    const uuid = String(retryDialogOrderId || "").trim();
    const auth = Cookies.get("token");
    if (!uuid || !auth) {
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
        const { order, error } = await retryOrderPayment(auth, uuid, payload);
        if (!order?.uuid) {
          toast.error(String(error ?? "").trim() || t("retryPaymentFailed"), {
            position: "top-center",
            autoClose: 4000,
          });
          return;
        }

        const payUrl = getOrderPayUrl(order);
        if (payUrl) {
          window.location.assign(payUrl);
          return;
        }

        window.location.assign(
          `${absoluteLocaleUrl(locale, "/checkout/confirmation")}?orderId=${encodeURIComponent(order.uuid)}`,
        );
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

    if (retrySelection === "new-card-credit" || retrySelection === "new-card-debit") {
      setRetryDialogSubmitting(true);
      try {
        const payload = buildRetryPaymentRequestBody({
          fallbackPaymentMethod: "credit_card",
          session: {
            paymentMethodType: "visa",
            skipcashTokenizeCard: false,
          },
        });
        const { order, error } = await retryOrderPayment(auth, uuid, payload);
        if (!order?.uuid) {
          toast.error(String(error ?? "").trim() || t("retryPaymentFailed"), {
            position: "top-center",
            autoClose: 4000,
          });
          setRetryDialogSubmitting(false);
          return;
        }
        const sessionId = extractSkipCashSessionId(order);
        if (!sessionId) {
          toast.error(t("retryPaymentFailed"), {
            position: "top-center",
            autoClose: 4000,
          });
          setRetryDialogSubmitting(false);
          return;
        }
        setRetryFormVisible(true);
        setRetrySessionOrderUuid(order.uuid);
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
  }, [locale, retryDialogOrderId, retrySelection, selectedSavedRetryCardTokenId, t]);

  const handleRetrySkipCashComplete = useCallback(
    async (result: {
      status: "paid" | "failed";
      paymentId: string | null;
      orderId?: string | null;
      tokenId?: string | null;
    }) => {
      setRetryDialogSubmitting(false);
      const auth = Cookies.get("token");
      if (!auth || !retrySessionOrderUuid) return;
      if (result.status !== "paid") {
        toast.error(t("retryPaymentFailed"), { position: "top-center", autoClose: 4000 });
        return;
      }
      const paymentId = result.paymentId ? String(result.paymentId).trim() : "";
      if (!paymentId) {
        toast.error(t("retryPaymentFailed"), { position: "top-center", autoClose: 4000 });
        return;
      }
      const apiRes = await submitSkipCashPaymentResult(auth, {
        amount: String(
          Number.isFinite(
            Number(orders.find((o) => o.id === retryDialogOrderId)?.grandTotal),
          )
            ? Number(orders.find((o) => o.id === retryDialogOrderId)?.grandTotal)
            : 0,
        ),
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
      const url = new URL(absoluteLocaleUrl(locale, "/checkout/confirmation"));
      url.searchParams.set("orderId", retrySessionOrderUuid);
      url.searchParams.set("orderNumber", `#${retrySessionOrderUuid.slice(0, 8)}`);
      window.location.assign(url.toString());
    },
    [currency, locale, orders, retryDialogOrderId, retrySessionOrderUuid, t],
  );

  const handleRetryPrimaryAction = useCallback(() => {
    if (retrySelection === "new-card-credit" || retrySelection === "new-card-debit") {
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

  const stats = useMemo(() => {
    let toShip = 0;
    let shipped = 0;
    let toReview = 0;
    orders.forEach((o) => {
      const s = normalizeStatus(o.statusDisplay);
      if (s === "delivered") {
        shipped += 1;
        toReview += 1;
      } else if (s === "inprocess") {
        toShip += 1;
      }
    });
    return { toShip, shipped, toReview };
  }, [orders]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => {
      const s = normalizeStatus(o.statusDisplay);
      if (filter === "confirmed") return s === "confirmed";
      if (filter === "delivered") return s === "delivered";
      if (filter === "inprocess") return s === "inprocess";
      return true;
    });
  }, [orders, filter]);

  const totalPages = useMemo(() => {
    const n = Math.ceil(filtered.length / PER_PAGE);
    return Math.max(1, n);
  }, [filtered.length]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  return (
    <section className="w-full bg-white shadow-[0px_1px_13px_rgba(0,0,0,0.05)] rounded-[4px] min-h-0 lg:min-h-[600px] p-4 sm:p-6 md:p-8 lg:px-10 lg:py-10">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-[710px] mb-6 sm:mb-8">
        <StatCard count={stats.toShip} label={t("orderDashboardToShip")} />
        <StatCard count={stats.shipped} label={t("orderDashboardShipped")} />
        <StatCard count={stats.toReview} label={t("orderDashboardToReview")} />
      </div>

      <div
        className="flex flex-row items-start gap-4 overflow-x-auto scrollbar-hide pb-2 mb-6"
        style={{ maxWidth: 710, gap: 16 }}
      >
        {ORDER_FILTER_KEYS.map((fKey) => {
          const active = filter === fKey;
          return (
            <button
              key={fKey}
              type="button"
              onClick={() => setFilter(fKey)}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                minWidth: fKey === "all" ? 68 : fKey === "confirmed" ? 92 : 83,
                height: 30,
                padding: 12,
                gap: 4,
                background: active ? "#CB262E" : "#FFFFFF",
                border: active ? "none" : "1px solid rgba(0,0,0,0.15)",
                borderRadius: 5,
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 12,
                lineHeight: "24px",
                textTransform: "capitalize",
                color: active ? "#FFFFFF" : "#000000",
              }}
            >
              {orderFilterLabel(fKey, t)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3" style={{ maxWidth: 710 }}>
        {loading || userLoading ? (
          <p
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontSize: 14,
              color: "#666",
            }}
          >
            {t("loadingOrders")}
          </p>
        ) : filtered.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontSize: 14,
              color: "#666",
            }}
          >
            {t("noOrdersFound")}
          </p>
        ) : (
          pagedOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              t={t}
              currency={currency}
              locale={locale}
              retrying={retryingOrderId === String(order.id ?? "")}
              onRetryPayment={() => handleRetryPayment(String(order.id ?? ""))}
              onRequestReturn={() => {
                setReturnOrderUuid(String(order.id ?? "").trim());
                setReturnOrderItems(Array.isArray(order.items) ? order.items : []);
                setReturnModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {!loading && !userLoading && filtered.length > 0 ? (
        <div
          className="mt-6 flex w-full max-w-[710px] flex-row items-center justify-between gap-3"
          aria-label={t("ordersPaginationAria")}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="min-h-[40px] rounded-[5px] border border-black/15 bg-white px-4 font-sans text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("prev") || "Prev"}
          </button>
          <span
            className="font-sans text-sm text-black/70"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {(t("page") || "Page") + ` ${page} / ${totalPages}`}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="min-h-[40px] rounded-[5px] border border-black/15 bg-white px-4 font-sans text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("next") || "Next"}
          </button>
        </div>
      ) : null}

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
                  onClick={() => setRetrySelection("new-card-credit")}
                  className={`box-border flex items-center justify-between w-full rounded-[5px] border px-4 py-3 ${
                    retrySelection === "new-card-credit"
                      ? "border-[#CB262E] bg-[#FFF5F5]"
                      : "border-black/15 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PaymentMethodIconByType type="mastercard" />
                    <span className="font-sans font-medium text-black">
                      {t("creditCard") || "Credit card"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRetrySelection("new-card-debit")}
                  className={`box-border flex items-center justify-between w-full rounded-[5px] border px-4 py-3 ${
                    retrySelection === "new-card-debit"
                      ? "border-[#CB262E] bg-[#FFF5F5]"
                      : "border-black/15 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PaymentMethodIconByType type="debit" />
                    <span className="font-sans font-medium text-black">
                      {t("paymentMethodDebit") || "Debit card"}
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

                {(retrySelection === "new-card-credit" ||
                  retrySelection === "new-card-debit") &&
                retryFormVisible &&
                retrySessionId ? (
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

      <ReturnRequestModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        orderUuid={returnOrderUuid}
        orderItems={returnOrderItems}
      />
    </section>
  );
}

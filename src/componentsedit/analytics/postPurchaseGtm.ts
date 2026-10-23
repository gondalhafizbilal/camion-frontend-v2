import { normalizeKnownOrderStatus } from "@/lib/order/orderDisplayStatus";
import { gqlMoneyToNumber } from "@/services/graphql/money";
import { pushGtmEvent } from "./gtmDataLayer";

type MoneyInput = {
  amount?: number | string | null;
  minorAmount?: number | string | null;
  currencyCode?: string | null;
} | null;

export type PaymentEventOrder = {
  orderId?: string | null;
  status?: string | null;
  total?: MoneyInput;
  gatewayTransactionReference?: string | null;
  paymentMethod?: string | null;
};

type PaymentAttemptParams = Omit<PaymentEventOrder, "status" | "total"> & {
  value?: number | null;
  currency?: string | null;
  errorCode?: string | null;
  errorStage?: string | null;
};

const DEDUPE_STORAGE_KEY = "camion_gtm_post_purchase_events_v1";

function clean(value: unknown): string | undefined {
  const result = String(value ?? "").trim();
  return result || undefined;
}

function readDedupeKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DEDUPE_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === "string") : [];
  } catch {
    return [];
  }
}

function markDedupeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const keys = [...new Set([...readDedupeKeys(), key])].slice(-300);
    window.localStorage.setItem(DEDUPE_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* ignore unavailable storage */
  }
}

function pushOnce(event: string, orderId: string, status: string, params: Record<string, unknown>): void {
  const statusScoped = event.startsWith("payment_");
  const key = statusScoped ? `${event}:${orderId}:${status}` : `${event}:${orderId}`;
  if (readDedupeKeys().includes(key)) return;
  markDedupeKey(key);
  pushGtmEvent(event, params);
}

function paymentParams(order: PaymentEventOrder): Record<string, unknown> {
  const value = gqlMoneyToNumber(order.total);
  return {
    order_id: clean(order.orderId),
    gateway_transaction_reference: clean(order.gatewayTransactionReference),
    payment_method: clean(order.paymentMethod),
    value: value != null && value >= 0 ? value : undefined,
    currency: clean(order.total?.currencyCode)?.toUpperCase(),
  };
}

/** Records a payment-session attempt or a pre-PSP failure without claiming PSP failure. */
export function trackPaymentAttempt(params: PaymentAttemptParams): void {
  pushGtmEvent("payment_attempt", {
    order_id: clean(params.orderId),
    gateway_transaction_reference: clean(params.gatewayTransactionReference),
    payment_method: clean(params.paymentMethod),
    value: params.value != null && Number.isFinite(params.value) ? params.value : undefined,
    currency: clean(params.currency)?.toUpperCase(),
    error_code: clean(params.errorCode),
    error_stage: clean(params.errorStage),
  });
}

/** Emits confirmation outcomes only for explicit normalized order statuses. */
export function trackConfirmationPaymentOutcomes(order: PaymentEventOrder): void {
  const orderId = clean(order.orderId);
  const status = normalizeKnownOrderStatus(order.status);
  if (!orderId || !status) return;

  const params = { ...paymentParams(order), status };
  if (status === "pending" || status === "payment_pending") {
    pushOnce("payment_pending", orderId, status, params);
    return;
  }

  if (status === "payment_failed" || status === "payment_rejected" || status === "payment_expired") {
    pushOnce("payment_failed", orderId, status, {
      ...params,
      error_code: status,
      error_stage: "payment_provider",
    });
    return;
  }

  if (status === "payment_cancelled" || status === "cancelled") {
    pushOnce("payment_cancelled", orderId, status, params);
    return;
  }

  if (status === "payment_successful" || status === "confirmed") {
    pushOnce("payment_success_client", orderId, status, params);
    pushOnce("order_confirmed", orderId, status, params);
  }
}

export function trackOrderCancelled(orderId: string): void {
  const id = clean(orderId);
  if (!id) return;
  pushOnce("order_cancelled", id, "cancelled", { order_id: id });
}

export function trackRefundRequested(params: {
  orderId: string;
  returnRequestId: string;
  productId?: string;
}): void {
  pushGtmEvent("refund_requested", {
    order_id: clean(params.orderId),
    return_request_id: clean(params.returnRequestId),
    product_id: clean(params.productId),
  });
}

export function trackReviewSubmitted(productId: string, rating: number): void {
  const id = clean(productId);
  if (!id || !Number.isFinite(rating)) return;
  pushGtmEvent("review_submitted", { product_id: id, rating });
}

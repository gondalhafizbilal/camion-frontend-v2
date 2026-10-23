import type { GqlCustomerOrder, GqlOrderTracking } from "@/services/graphql/types/order";

/** Furthest fulfillment stage from WMS (`tracking.stage`). */
export type FulfillmentStage = "order" | "inbound" | "outbound";

export type KnownOrderStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "delivered"
  | "payment_pending"
  | "payment_successful"
  | "payment_rejected"
  | "payment_failed"
  | "payment_cancelled"
  | "payment_expired";

export type TrackingProgress = {
  completedMilestone: number;
  isDelivered: boolean;
  isCancelled: boolean;
  knownStatus: KnownOrderStatus | null;
  rawStatusFallback: string;
  fulfillmentStage: FulfillmentStage | null;
};

export function normalizeKnownOrderStatus(
  statusRaw: string | undefined | null,
): KnownOrderStatus | null {
  const s = String(statusRaw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s—–-]+/g, "_")
    .replace(/_+/g, "_");
  if (!s) return null;
  switch (s) {
    case "pending":
    case "confirmed":
    case "cancelled":
    case "delivered":
    case "payment_pending":
    case "payment_successful":
    case "payment_rejected":
    case "payment_failed":
    case "payment_cancelled":
    case "payment_expired":
      return s;
    case "payment_canceled":
      return "payment_cancelled";
    default:
      return null;
  }
}

export function normalizeFulfillmentStage(
  stage: string | undefined | null,
): FulfillmentStage | null {
  const s = String(stage ?? "")
    .trim()
    .toLowerCase();
  if (s === "order" || s === "inbound" || s === "outbound") return s;
  return null;
}

/** @deprecated Use {@link normalizeFulfillmentStage} === `"outbound"`. */
export function isOutboundTrackingStage(stage: string | undefined | null): boolean {
  return normalizeFulfillmentStage(stage) === "outbound";
}

function normalizeStatusToken(statusRaw: string | undefined | null): string {
  return String(statusRaw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s—–-]+/g, "_")
    .replace(/_+/g, "_");
}

/**
 * Which label to show in UI:
 * - `inbound` / `outbound`: WMS `tracking.status` (customer-friendly label from API).
 * - `order`: payment / placement `order.status`; falls back to `tracking.status` (e.g. "Order Confirmed").
 */
export function resolveOrderDisplayStatus(order: {
  status?: string | null;
  tracking?: GqlOrderTracking | null;
}): string {
  const stage = normalizeFulfillmentStage(order.tracking?.stage);
  const trackingStatus = String(order.tracking?.status ?? "").trim();
  const orderStatus = String(order.status ?? "").trim();

  if (stage === "inbound" || stage === "outbound") {
    return trackingStatus || orderStatus;
  }

  if (stage === "order") {
    if (orderStatus && normalizeKnownOrderStatus(orderStatus)) {
      return orderStatus;
    }
    return trackingStatus || orderStatus;
  }

  return orderStatus || trackingStatus;
}

export function orderTrackingContext(order: GqlCustomerOrder) {
  const stage = normalizeFulfillmentStage(order.tracking?.stage);
  const displayStatus = resolveOrderDisplayStatus(order);
  const waybillNo = String(order.tracking?.waybillNo ?? "").trim() || null;
  return { stage, displayStatus, waybillNo };
}

function baseProgress(
  partial: Omit<TrackingProgress, "fulfillmentStage"> & {
    fulfillmentStage: FulfillmentStage | null;
  },
): TrackingProgress {
  return partial;
}

/** `order` stage — payment / placement (`order.status`). */
function trackingProgressFromOrderStage(
  statusRaw: string | undefined | null,
): TrackingProgress {
  const known = normalizeKnownOrderStatus(statusRaw);
  const raw = String(statusRaw ?? "").trim() || "—";
  const token = normalizeStatusToken(statusRaw);

  if (known === "cancelled" || known === "payment_rejected" || known === "payment_failed" || known === "payment_cancelled") {
    return baseProgress({
      completedMilestone: -1,
      isDelivered: false,
      isCancelled: true,
      knownStatus: known,
      rawStatusFallback: raw,
      fulfillmentStage: "order",
    });
  }
  if (known === "delivered") {
    return baseProgress({
      completedMilestone: 4,
      isDelivered: true,
      isCancelled: false,
      knownStatus: known,
      rawStatusFallback: raw,
      fulfillmentStage: "order",
    });
  }
  if (known === "payment_successful" || known === "confirmed") {
    return baseProgress({
      completedMilestone: token.includes("order_confirmed") ? 0 : 1,
      isDelivered: false,
      isCancelled: false,
      knownStatus: known,
      rawStatusFallback: raw,
      fulfillmentStage: "order",
    });
  }
  if (known === "payment_pending" || known === "pending") {
    return baseProgress({
      completedMilestone: 0,
      isDelivered: false,
      isCancelled: false,
      knownStatus: known,
      rawStatusFallback: raw,
      fulfillmentStage: "order",
    });
  }
  if (token.includes("order_confirmed")) {
    return baseProgress({
      completedMilestone: 0,
      isDelivered: false,
      isCancelled: false,
      knownStatus: "confirmed",
      rawStatusFallback: raw,
      fulfillmentStage: "order",
    });
  }
  return baseProgress({
    completedMilestone: 0,
    isDelivered: false,
    isCancelled: false,
    knownStatus: null,
    rawStatusFallback: raw,
    fulfillmentStage: "order",
  });
}

/**
 * `inbound` stage — procurement / warehouse processing labels.
 * @see status labels: Procurement in Progress … Processing Complete, Order Issue
 */
function trackingProgressWhenInbound(statusToken: string, raw: string): TrackingProgress {
  if (statusToken.includes("order_issue") || statusToken.includes("contact_support")) {
    return baseProgress({
      completedMilestone: 1,
      isDelivered: false,
      isCancelled: false,
      knownStatus: null,
      rawStatusFallback: raw,
      fulfillmentStage: "inbound",
    });
  }
  if (
    statusToken.includes("ready_to_ship") ||
    statusToken.includes("processing_complete")
  ) {
    return baseProgress({
      completedMilestone: 2,
      isDelivered: false,
      isCancelled: false,
      knownStatus: null,
      rawStatusFallback: raw,
      fulfillmentStage: "inbound",
    });
  }
  if (
    statusToken.includes("goods_arrived") ||
    statusToken.includes("goods_being_processed")
  ) {
    return baseProgress({
      completedMilestone: 1,
      isDelivered: false,
      isCancelled: false,
      knownStatus: null,
      rawStatusFallback: raw,
      fulfillmentStage: "inbound",
    });
  }
  return baseProgress({
    completedMilestone: 1,
    isDelivered: false,
    isCancelled: false,
    knownStatus: null,
    rawStatusFallback: raw,
    fulfillmentStage: "inbound",
  });
}

/**
 * `outbound` stage — shipment to customer labels.
 * @see status labels: Preparing Your Shipment … Shipped, Shipment Cancelled
 */
function trackingProgressWhenOutbound(statusToken: string, raw: string): TrackingProgress {
  if (statusToken.includes("shipment_cancelled") || statusToken.includes("cancel")) {
    return baseProgress({
      completedMilestone: -1,
      isDelivered: false,
      isCancelled: true,
      knownStatus: "cancelled",
      rawStatusFallback: raw,
      fulfillmentStage: "outbound",
    });
  }
  if (statusToken.includes("delivered")) {
    return baseProgress({
      completedMilestone: 4,
      isDelivered: true,
      isCancelled: false,
      knownStatus: "delivered",
      rawStatusFallback: raw,
      fulfillmentStage: "outbound",
    });
  }
  if (
    statusToken.includes("shipped") ||
    statusToken.includes("shipment_in_progress") ||
    statusToken.includes("shipment_ready") ||
    statusToken.includes("shipment_delayed")
  ) {
    return baseProgress({
      completedMilestone: 3,
      isDelivered: false,
      isCancelled: false,
      knownStatus: null,
      rawStatusFallback: raw,
      fulfillmentStage: "outbound",
    });
  }
  if (statusToken.includes("preparing_your_shipment") || statusToken.includes("preparing")) {
    return baseProgress({
      completedMilestone: 2,
      isDelivered: false,
      isCancelled: false,
      knownStatus: null,
      rawStatusFallback: raw,
      fulfillmentStage: "outbound",
    });
  }
  return baseProgress({
    completedMilestone: 2,
    isDelivered: false,
    isCancelled: false,
    knownStatus: null,
    rawStatusFallback: raw,
    fulfillmentStage: "outbound",
  });
}

/** Legacy path when `tracking.stage` is absent — infer from display status only. */
export function trackingProgressFromDisplayStatus(
  statusRaw: string | undefined | null,
  options?: { outbound?: boolean },
): TrackingProgress {
  const raw = String(statusRaw ?? "").trim() || "—";
  const token = normalizeStatusToken(statusRaw);
  if (options?.outbound) {
    return trackingProgressWhenOutbound(token, raw);
  }
  return trackingProgressFromOrderStage(statusRaw);
}

export function trackingProgressFromOrder(order: GqlCustomerOrder): TrackingProgress {
  const { stage, displayStatus } = orderTrackingContext(order);
  const token = normalizeStatusToken(displayStatus);
  const raw = displayStatus || "—";

  switch (stage) {
    case "inbound":
      return trackingProgressWhenInbound(token, raw);
    case "outbound":
      return trackingProgressWhenOutbound(token, raw);
    case "order":
      return trackingProgressFromOrderStage(String(order.status ?? "").trim() || displayStatus);
    default:
      return trackingProgressFromOrderStage(String(order.status ?? "").trim() || displayStatus);
  }
}

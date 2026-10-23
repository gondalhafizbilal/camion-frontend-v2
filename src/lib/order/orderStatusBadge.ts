import { normalizeKnownOrderStatus } from "./orderDisplayStatus";
import { statusLabelToToken } from "./translateOrderDisplayStatus";

export type OrderStatusBadgeVariant =
  | "delivered"
  | "confirmed"
  | "cancelled"
  | "payment_pending"
  | "payment_rejected"
  | "in_transit"
  | "processing"
  | "warning";

export type OrderStatusBadgeStyle = {
  variant: OrderStatusBadgeVariant;
  background: string;
  color: string;
};

const BADGE_STYLES: Record<
  OrderStatusBadgeVariant,
  Pick<OrderStatusBadgeStyle, "background" | "color">
> = {
  delivered: { background: "#E3FFD5", color: "#3D743A" },
  confirmed: { background: "#E3FFD5", color: "#3D743A" },
  cancelled: { background: "#FFE5E5", color: "#CB262E" },
  payment_pending: { background: "#FFF8E5", color: "#B8860B" },
  payment_rejected: { background: "#FFE5E5", color: "#CB262E" },
  in_transit: { background: "#E8F4FF", color: "#1D5BA8" },
  processing: { background: "#FFF4E5", color: "#B8860B" },
  warning: { background: "#FFF0E5", color: "#C45C00" },
};

export function resolveOrderStatusBadgeVariant(
  statusDisplay: string | undefined | null,
): OrderStatusBadgeVariant {
  const known = normalizeKnownOrderStatus(statusDisplay);
  const token = statusLabelToToken(statusDisplay);

  if (known === "delivered") return "delivered";
  if (known === "cancelled" || known === "payment_cancelled") return "cancelled";
  if (known === "payment_rejected" || known === "payment_failed") return "payment_rejected";
  if (known === "payment_pending") return "payment_pending";
  if (known === "payment_expired") return "warning";
  if (known === "confirmed" || known === "payment_successful") return "confirmed";

  if (token.includes("cancel") || token.includes("reject") || token.includes("payment_failed")) return "cancelled";
  if (token.includes("deliver")) return "delivered";
  if (token.includes("payment_pending")) return "payment_pending";
  if (token.includes("payment_expired")) return "warning";

  if (
    token.includes("shipped") ||
    token.includes("shipment_in_progress") ||
    token.includes("shipment_ready") ||
    token.includes("preparing_your_shipment") ||
    token.includes("in_transit") ||
    token.includes("dispatch")
  ) {
    return "in_transit";
  }

  if (token.includes("issue") || token.includes("delayed")) return "warning";

  if (
    token.includes("confirmed") ||
    token.includes("payment_successful") ||
    token.includes("processing_complete") ||
    token.includes("ready_to_ship")
  ) {
    return "confirmed";
  }

  return "processing";
}

export function getOrderStatusBadgeStyle(
  statusDisplay: string | undefined | null,
): OrderStatusBadgeStyle {
  const variant = resolveOrderStatusBadgeVariant(statusDisplay);
  return { variant, ...BADGE_STYLES[variant] };
}

/** Bucket for My Orders filters and dashboard stats. */
export type OrderListStatusBucket = "confirmed" | "delivered" | "cancelled" | "inprocess";

export function resolveOrderListStatusBucket(
  statusDisplay: string | undefined | null,
): OrderListStatusBucket {
  const variant = resolveOrderStatusBadgeVariant(statusDisplay);
  if (variant === "delivered") return "delivered";
  if (variant === "cancelled" || variant === "payment_rejected") return "cancelled";
  if (variant === "confirmed") return "confirmed";
  return "inprocess";
}

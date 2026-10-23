import { normalizeKnownOrderStatus } from "@/lib/order/orderDisplayStatus";

const CANCELLABLE_ORDER_STATUSES = new Set([
  "pending",
  "payment_pending",
  "payment_rejected",
]);

/** Cancel is allowed while the order is pending, awaiting payment, or payment was rejected. */
export function canCancelOrder(orderStatus: string | undefined | null): boolean {
  const known = normalizeKnownOrderStatus(orderStatus);
  return known != null && CANCELLABLE_ORDER_STATUSES.has(known);
}

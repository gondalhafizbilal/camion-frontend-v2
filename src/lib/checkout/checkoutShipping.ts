import type { OrderPreviewResponse } from "@/services/orders/fetchOrderPreview";

/** Shipping fee from order preview or user profile; `null` when not yet known. */
export function resolveCheckoutShippingFee(
  orderPreview: OrderPreviewResponse | null | undefined,
  user: unknown,
): number | null {
  if (
    orderPreview?.shippingTotal != null &&
    Number.isFinite(Number(orderPreview.shippingTotal))
  ) {
    return Number(orderPreview.shippingTotal);
  }
  const addr = (user as { address?: { shipping_option?: { cost?: unknown } } } | null)
    ?.address;
  const raw = addr?.shipping_option?.cost;
  if (raw != null && Number.isFinite(Number(raw))) {
    return Number(raw) || 0;
  }
  return null;
}

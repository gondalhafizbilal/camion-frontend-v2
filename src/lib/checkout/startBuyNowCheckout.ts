import { writeCheckoutCartItemUuids } from "@/lib/checkout/checkoutReviewSession";

/**
 * Starts instant checkout for a single cart line (order preview V2).
 * Call after the line exists in the cart (`POST /v1/cart-items`).
 */
export function startBuyNowCheckout(cartItemUuid: string): boolean {
  const uuid = String(cartItemUuid ?? "").trim();
  if (!uuid) return false;
  writeCheckoutCartItemUuids([uuid]);
  return true;
}

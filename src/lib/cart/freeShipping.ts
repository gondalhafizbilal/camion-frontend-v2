import { getMinimumOrderProgress, type MinimumOrderProgress } from "@/lib/cart/minimumOrder";

export type FreeShippingProgress = MinimumOrderProgress;

/** UI shows free-shipping progress only when the settings API returned a valid threshold. */
export function shouldShowFreeShippingBar(
  ready: boolean,
  thresholdAmount: number | null,
): boolean {
  return ready && thresholdAmount != null && thresholdAmount > 0;
}

export function getFreeShippingProgress(
  cartSubtotal: number,
  threshold: number,
): FreeShippingProgress {
  return getMinimumOrderProgress(cartSubtotal, threshold);
}

export function hasAchievedFreeShipping(
  cartSubtotal: number,
  ready: boolean,
  thresholdAmount: number | null,
): boolean {
  if (!shouldShowFreeShippingBar(ready, thresholdAmount)) return false;
  return getFreeShippingProgress(cartSubtotal, thresholdAmount!).achieved;
}

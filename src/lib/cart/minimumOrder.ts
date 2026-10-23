export type MinimumOrderProgress = {
  current: number;
  minimum: number;
  /** 0–100 */
  progressPercent: number;
  remaining: number;
  achieved: boolean;
};

/** UI may enforce minimum only when the settings API returned a valid amount. */
export function shouldEnforceMinimumOrder(
  ready: boolean,
  minimumAmount: number | null,
): boolean {
  return ready && minimumAmount != null && minimumAmount > 0;
}

/** When not enforced (API down/null/error), allow checkout — order APIs enforce server-side. */
export function canProceedToCheckout(
  cartSubtotal: number,
  ready: boolean,
  minimumAmount: number | null,
): boolean {
  if (!shouldEnforceMinimumOrder(ready, minimumAmount)) return true;
  return getMinimumOrderProgress(cartSubtotal, minimumAmount!).achieved;
}

export function getMinimumOrderProgress(
  cartSubtotal: number,
  minimum: number,
): MinimumOrderProgress {
  const current = Math.max(0, Number(cartSubtotal) || 0);
  const min = Math.max(0, Number(minimum) || 0);
  const progressPercent =
    min > 0 ? Math.min(100, Math.round((current / min) * 1000) / 10) : 100;
  const remaining = Math.max(0, min - current);
  return {
    current,
    minimum: min,
    progressPercent,
    remaining,
    achieved: min > 0 ? current >= min : true,
  };
}

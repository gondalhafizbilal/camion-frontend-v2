/**
 * Discount labels like "-30%" must stay LTR in Arabic layouts.
 * Without isolation, RTL bidi pushes the hyphen to the end ("30%-").
 */
export function formatDiscountPercentLabel(percent: number): string {
  const n = Math.round(Number(percent));
  if (!Number.isFinite(n) || n <= 0) return "";
  return `-${n}%`;
}

/** Class / attribute helpers for discount percent text nodes. */
export const DISCOUNT_PERCENT_DIR = "ltr" as const;

/** Maximum units allowed per cart line (UI + API requests). */
export const MAX_CART_QUANTITY = 99;

/** Clamp to a valid cart quantity in `[1, MAX_CART_QUANTITY]`. */
export function clampCartQuantity(quantity: unknown): number {
  const n = Math.floor(Number(quantity));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(MAX_CART_QUANTITY, n);
}

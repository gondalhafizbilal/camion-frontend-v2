/** Persists payment choice + optional selected cart lines across checkout → place order. */

export const CHECKOUT_REVIEW_SESSION_KEY = "checkout_review";

export type CheckoutReviewSession = {
  /** API value for order placement (e.g. `"CARD"`). */
  paymentMethod?: string;
  /** UI / icon key (mastercard, applepay, …). */
  paymentMethodType?: string;
  maskedCardNumber?: string;
  /** Applied coupon code to carry into order review. */
  couponCode?: string;
  /** SkipCash: saved card tokenId (when user chose a saved card). */
  skipcashSavedCardTokenId?: string | null;
  /** SkipCash: whether to tokenize the card during this checkout. */
  skipcashTokenizeCard?: boolean;
  /**
   * Selected cart line UUIDs for partial checkout (order preview V2).
   * Omit / empty → entire cart (order preview V1).
   */
  cartItemUuids?: string[];
};

export function readCheckoutReviewSession(): CheckoutReviewSession {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CHECKOUT_REVIEW_SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CheckoutReviewSession;
  } catch {
    return {};
  }
}

/** Merges into existing session so callers do not wipe unrelated fields. */
export function writeCheckoutReviewSession(patch: CheckoutReviewSession): void {
  if (typeof window === "undefined") return;
  try {
    const prev = readCheckoutReviewSession();
    const next: CheckoutReviewSession = { ...prev, ...patch };
    if ("cartItemUuids" in patch) {
      const uuids = normalizeCartItemUuids(patch.cartItemUuids);
      if (uuids?.length) next.cartItemUuids = uuids;
      else delete next.cartItemUuids;
    }
    sessionStorage.setItem(CHECKOUT_REVIEW_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function normalizeCartItemUuids(
  raw: unknown,
): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const u = typeof entry === "string" ? entry.trim() : "";
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out.length ? out : undefined;
}

/** Selected cart line UUIDs for V2 preview; `undefined` means full-cart / V1. */
export function readCheckoutCartItemUuids(): string[] | undefined {
  return normalizeCartItemUuids(readCheckoutReviewSession().cartItemUuids);
}

/** Persist selection for checkout. Pass `null`/empty to clear (full-cart V1). */
export function writeCheckoutCartItemUuids(uuids: string[] | null | undefined): void {
  writeCheckoutReviewSession({
    cartItemUuids: normalizeCartItemUuids(uuids) ?? [],
  });
}

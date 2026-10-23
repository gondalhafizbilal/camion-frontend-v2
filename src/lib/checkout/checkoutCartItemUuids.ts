import type { CheckoutCartLine } from "@/types/checkoutDisplay";
import { normalizeCartItemUuids } from "@/lib/checkout/checkoutReviewSession";

/** Cart line UUID used by order preview V2 / place order (`cartItemUuids`). */
export function getCheckoutLineUuid(line: CheckoutCartLine): string {
  const fromExplicit =
    typeof line.cartItemUuid === "string" ? line.cartItemUuid.trim() : "";
  if (fromExplicit) return fromExplicit;
  const fromId = String(line.id ?? "").trim();
  if (fromId) return fromId;
  return String(line.key ?? "").trim();
}

export function collectCheckoutLineUuids(lines: CheckoutCartLine[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const uuid = getCheckoutLineUuid(line);
    if (!uuid || seen.has(uuid)) continue;
    seen.add(uuid);
    out.push(uuid);
  }
  return out;
}

/**
 * When `uuids` is null/empty → full cart (caller uses V1 preview).
 * Otherwise → lines matching those cart item UUIDs.
 */
export function filterCheckoutLinesByUuids(
  lines: CheckoutCartLine[] | undefined,
  uuids: string[] | null | undefined,
): CheckoutCartLine[] {
  const list = Array.isArray(lines) ? lines : [];
  const wanted = (uuids ?? []).map((u) => String(u).trim()).filter(Boolean);
  if (!wanted.length) return list;
  const set = new Set(wanted);
  return list.filter((line) => {
    const id = getCheckoutLineUuid(line);
    return Boolean(id && set.has(id));
  });
}

/** True when selection is a proper subset (use V2 preview). */
export function isPartialCartCheckoutSelection(
  allLineUuids: string[],
  selectedUuids: string[],
): boolean {
  if (!selectedUuids.length) return false;
  if (selectedUuids.length >= allLineUuids.length) return false;
  const all = new Set(allLineUuids);
  return selectedUuids.every((u) => all.has(u));
}

export type ResolvedCheckoutCartSelection = {
  /** Lines to show in checkout / summary. */
  checkoutLines: CheckoutCartLine[];
  /**
   * UUIDs for order preview V2. `undefined` → full-cart V1
   * (no selection, stale selection cleared, or selection covers entire cart).
   */
  cartItemUuids: string[] | undefined;
  /** True when stored UUIDs matched nothing; session should be cleared. */
  staleSelection: boolean;
};

/**
 * Safe checkout selection vs live cart.
 * Never empties checkout when the cart still has lines — falls back to full cart / V1.
 */
export function resolveCheckoutCartSelection(
  lines: CheckoutCartLine[] | undefined,
  storedUuids: string[] | null | undefined,
): ResolvedCheckoutCartSelection {
  const list = Array.isArray(lines) ? lines : [];
  const allUuids = collectCheckoutLineUuids(list);
  const wanted = normalizeCartItemUuids(storedUuids);

  if (!wanted?.length || list.length === 0) {
    return {
      checkoutLines: list,
      cartItemUuids: undefined,
      staleSelection: false,
    };
  }

  const matched = filterCheckoutLinesByUuids(list, wanted);
  if (matched.length === 0) {
    return {
      checkoutLines: list,
      cartItemUuids: undefined,
      staleSelection: true,
    };
  }

  const validUuids = collectCheckoutLineUuids(matched);
  // Whole cart selected → keep prior full-cart (V1) path.
  if (!isPartialCartCheckoutSelection(allUuids, validUuids)) {
    return {
      checkoutLines: list,
      cartItemUuids: undefined,
      staleSelection: false,
    };
  }

  return {
    checkoutLines: matched,
    cartItemUuids: validUuids,
    staleSelection: false,
  };
}

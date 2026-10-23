/** Max rows for product list GraphQL fields (API may ignore `itemsPerPage`). */
export const PRODUCT_LIST_MAX_ITEMS_PER_PAGE = 24;

/**
 * Clamp requested page size for outgoing variables and `slice()` after response.
 */
export function clampProductListItemsPerPage(
  requested: number | null | undefined,
  fallback: number = PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
): number {
  const raw = requested ?? fallback;
  const parsed = Number(raw);
  const bounded = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  return Math.min(PRODUCT_LIST_MAX_ITEMS_PER_PAGE, Math.max(1, bounded));
}

/**
 * Whether another page may exist after a fetch.
 * APIs sometimes return fewer rows than requested (e.g. 23 of 24) — keep load-more on page 1.
 */
export function hasMoreProductListPages(
  fetchedCount: number,
  pageSize: number,
  isFirstPage: boolean,
): boolean {
  if (fetchedCount <= 0) return false;
  if (fetchedCount >= pageSize) return true;
  return isFirstPage;
}

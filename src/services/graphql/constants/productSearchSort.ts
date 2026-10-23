export const PRODUCT_SEARCH_SORT = {
  /** Default product list ordering. */
  BEST_MATCH: "best-match",
  /** Price ascending (low to high). */
  PRICE_LOW_TO_HIGH: "price:low-to-high",
  /** Price descending (high to low). */
  PRICE_HIGH_TO_LOW: "price:high-to-low",
  /** Best sellers. */
  BEST_SELLERS: "best-sellers",
  /** Most favorited products. */
  MOST_FAVORITED: "most-favorited",
  /** Newly added products. */
  NEW_ARRIVALS: "new-arrivals",
  /** Most rated products. */
  MOST_RATED: "most-rated",
} as const;

export type ProductSearchSort =
  (typeof PRODUCT_SEARCH_SORT)[keyof typeof PRODUCT_SEARCH_SORT];

/** `getPopularProducts` sort values (distinct from catalog/search sorts). */
export const PRODUCT_POPULAR_SORT = {
  /** Default — most viewed products. */
  MOST_VIEWED: "most-viewed",
  BEST_SELLERS: "best-sellers",
  MOST_FAVORITED: "most-favorited",
  MOST_RATED: "most-rated",
} as const;

export type ProductPopularSort =
  (typeof PRODUCT_POPULAR_SORT)[keyof typeof PRODUCT_POPULAR_SORT];

export type ProductListSortValue = ProductSearchSort | ProductPopularSort;

export const PRODUCT_POPULAR_SORT_OPTIONS: readonly ProductPopularSort[] = [
  PRODUCT_POPULAR_SORT.MOST_VIEWED,
  PRODUCT_POPULAR_SORT.BEST_SELLERS,
  PRODUCT_POPULAR_SORT.MOST_FAVORITED,
  PRODUCT_POPULAR_SORT.MOST_RATED,
];

/** Allowed `sort` values for `searchProducts`, `getProducts`, and `getProductsByCategory`. */
export const PRODUCT_SEARCH_LIST_SORT_OPTIONS: readonly ProductSearchSort[] = [
  PRODUCT_SEARCH_SORT.BEST_MATCH,
  PRODUCT_SEARCH_SORT.PRICE_LOW_TO_HIGH,
  PRODUCT_SEARCH_SORT.PRICE_HIGH_TO_LOW,
  PRODUCT_SEARCH_SORT.BEST_SELLERS,
  PRODUCT_SEARCH_SORT.MOST_FAVORITED,
  PRODUCT_SEARCH_SORT.NEW_ARRIVALS,
  PRODUCT_SEARCH_SORT.MOST_RATED,
];

/** `getProducts` / `getProductsByCategory` — full catalog sort options. */
export const PRODUCT_CATALOG_SORT_OPTIONS: readonly ProductSearchSort[] = [
  PRODUCT_SEARCH_SORT.BEST_MATCH,
  PRODUCT_SEARCH_SORT.PRICE_LOW_TO_HIGH,
  PRODUCT_SEARCH_SORT.PRICE_HIGH_TO_LOW,
  PRODUCT_SEARCH_SORT.BEST_SELLERS,
  PRODUCT_SEARCH_SORT.MOST_FAVORITED,
  PRODUCT_SEARCH_SORT.NEW_ARRIVALS,
  PRODUCT_SEARCH_SORT.MOST_RATED,
];

/** @deprecated Use {@link PRODUCT_CATALOG_SORT_OPTIONS} or {@link PRODUCT_SEARCH_LIST_SORT_OPTIONS}. */
export const PRODUCT_LIST_SORT_OPTIONS = PRODUCT_CATALOG_SORT_OPTIONS;

export type ProductListSortMode = "search" | "catalog" | "popular";

export function getProductListSortOptions(
  mode: ProductListSortMode,
): readonly ProductListSortValue[] {
  if (mode === "search") return PRODUCT_SEARCH_LIST_SORT_OPTIONS;
  if (mode === "popular") return PRODUCT_POPULAR_SORT_OPTIONS;
  return PRODUCT_CATALOG_SORT_OPTIONS;
}

export function isPopularSortValue(
  value: string,
): value is ProductPopularSort {
  return (PRODUCT_POPULAR_SORT_OPTIONS as readonly string[]).includes(value);
}

export function isProductListSortValue(
  value: string,
  mode: ProductListSortMode = "catalog",
): value is ProductListSortValue {
  return (getProductListSortOptions(mode) as readonly string[]).includes(value);
}

/** Maps URL or UI tokens to GraphQL `sort` for `getPopularProducts`. */
export function normalizePopularSortToGraphql(
  raw: string | null | undefined,
): ProductPopularSort | string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return PRODUCT_POPULAR_SORT.MOST_VIEWED;

  const s = trimmed.toLowerCase().replace(/_/g, "-");
  if (
    s === "most-viewed" ||
    s === "mostviewed" ||
    s === "views" ||
    s === "popular" ||
    s === "default"
  ) {
    return PRODUCT_POPULAR_SORT.MOST_VIEWED;
  }
  if (
    s === "best-sellers" ||
    s === "best-seller" ||
    s === "bestsellers" ||
    s === "bestseller"
  ) {
    return PRODUCT_POPULAR_SORT.BEST_SELLERS;
  }
  if (
    s === "most-favorited" ||
    s === "most-favourited" ||
    s === "favorited" ||
    s === "favourited"
  ) {
    return PRODUCT_POPULAR_SORT.MOST_FAVORITED;
  }
  if (s === "most-rated" || s === "top-rated" || s === "rating") {
    return PRODUCT_POPULAR_SORT.MOST_RATED;
  }
  return trimmed;
}

export function resolvePopularSortSelectValue(
  raw: string | null | undefined,
): ProductPopularSort {
  const normalized = normalizePopularSortToGraphql(raw);
  return isPopularSortValue(normalized)
    ? normalized
    : PRODUCT_POPULAR_SORT.MOST_VIEWED;
}

/** Maps URL or UI tokens to a known GraphQL `sort` for the given listing mode. */
export function resolveSortSelectValue(
  raw: string | null | undefined,
  mode: ProductListSortMode = "catalog",
): ProductListSortValue {
  if (mode === "popular") {
    return resolvePopularSortSelectValue(raw);
  }
  const normalized = normalizeListingSortToGraphql(raw);
  return isProductListSortValue(normalized, mode)
    ? normalized
    : PRODUCT_SEARCH_SORT.BEST_MATCH;
}

/** @deprecated Use {@link resolveSortSelectValue} with `mode: "catalog"`. */
export function resolveProductListSortSelectValue(
  raw: string | null | undefined,
): ProductSearchSort {
  const normalized = normalizeListingSortToGraphql(raw);
  if (isProductListSortValue(normalized, "catalog")) {
    return normalized as ProductSearchSort;
  }
  return PRODUCT_SEARCH_SORT.BEST_MATCH;
}

/**
 * Maps URL or UI sort tokens to GraphQL `sort`. Unknown non-empty strings are returned as-is
 * so backend-specific values still work.
 */
export function normalizeListingSortToGraphql(
  raw: string | null | undefined,
): ProductSearchSort | string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return PRODUCT_SEARCH_SORT.BEST_MATCH;

  const s = trimmed.toLowerCase().replace(/_/g, "-");
  if (
    s === "price-low-to-high" ||
    s === "low-to-high" ||
    s === "price-asc" ||
    s === "asc" ||
    s === "price-low"
  ) {
    return PRODUCT_SEARCH_SORT.PRICE_LOW_TO_HIGH;
  }
  if (
    s === "price-high-to-low" ||
    s === "high-to-low" ||
    s === "price-desc" ||
    s === "desc" ||
    s === "price-high"
  ) {
    return PRODUCT_SEARCH_SORT.PRICE_HIGH_TO_LOW;
  }
  if (s === "best-match" || s === "best" || s === "relevance") {
    return PRODUCT_SEARCH_SORT.BEST_MATCH;
  }
  if (
    s === "best-sellers" ||
    s === "best-seller" ||
    s === "bestsellers" ||
    s === "bestseller"
  ) {
    return PRODUCT_SEARCH_SORT.BEST_SELLERS;
  }
  if (
    s === "most-favorited" ||
    s === "most-favourited" ||
    s === "favorited" ||
    s === "favourited"
  ) {
    return PRODUCT_SEARCH_SORT.MOST_FAVORITED;
  }
  if (s === "new-arrivals" || s === "new-arrival" || s === "newest") {
    return PRODUCT_SEARCH_SORT.NEW_ARRIVALS;
  }
  if (s === "most-rated" || s === "top-rated" || s === "rating") {
    return PRODUCT_SEARCH_SORT.MOST_RATED;
  }
  return trimmed;
}

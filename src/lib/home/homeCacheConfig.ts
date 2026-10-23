/**
 * Home page cache TTLs (seconds). Override via env in production after load tests.
 *
 * - `HOME_GRAPHQL_REVALIDATE_SECONDS` — shared catalog payload (`unstable_cache` + Data Cache)
 * - `HOME_PAGE_ISR_REVALIDATE_SECONDS` — Next.js ISR for `/[locale]` HTML
 * - `HOME_CATALOG_TOKEN_REVALIDATE_SECONDS` — guest/catalog bearer for SSR
 */

function parsePositiveInt(env: string | undefined, fallback: number): number {
  const n = Number(env);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

/** Default 5 minutes — catalog content rarely needs sub-minute freshness on the home page. */
export const HOME_GRAPHQL_REVALIDATE_SECONDS = parsePositiveInt(
  process.env.HOME_GRAPHQL_REVALIDATE_SECONDS,
  300,
);

/** Product detail SSR (`/shop/[slug]`). Defaults to home catalog TTL. */
export const PRODUCT_DETAIL_REVALIDATE_SECONDS = parsePositiveInt(
  process.env.PRODUCT_DETAIL_REVALIDATE_SECONDS,
  HOME_GRAPHQL_REVALIDATE_SECONDS,
);

export const HOME_PAGE_ISR_REVALIDATE_SECONDS = parsePositiveInt(
  process.env.HOME_PAGE_ISR_REVALIDATE_SECONDS,
  HOME_GRAPHQL_REVALIDATE_SECONDS,
);

export const HOME_CATALOG_TOKEN_REVALIDATE_SECONDS = parsePositiveInt(
  process.env.HOME_CATALOG_TOKEN_REVALIDATE_SECONDS,
  900,
);

/** CDN / shared cache for anonymous home HTML (`s-maxage` + SWR). */
export const HOME_HTML_S_MAXAGE_SECONDS = parsePositiveInt(
  process.env.HOME_HTML_S_MAXAGE_SECONDS,
  HOME_PAGE_ISR_REVALIDATE_SECONDS,
);

export const HOME_HTML_STALE_WHILE_REVALIDATE_SECONDS = parsePositiveInt(
  process.env.HOME_HTML_STALE_WHILE_REVALIDATE_SECONDS,
  HOME_HTML_S_MAXAGE_SECONDS * 2,
);

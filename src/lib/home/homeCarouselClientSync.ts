import { CATALOG_SSR_CURRENCY } from "@/lib/catalog/catalogSsr";

export function normalizeCatalogCurrencyCode(currency: string | undefined): string {
  return String(currency || "QAR").toLowerCase();
}

export function localeCurrencyCacheKey(
  locale: string,
  currency: string | undefined,
): string {
  return `${locale}:${normalizeCatalogCurrencyCode(currency)}`;
}

/**
 * Home carousels are SSR-seeded in QAR only. Skip the first client fetch only when
 * the visitor is still on that currency (and SSR had products to show).
 */
export function canUseHomeCarouselSsrSeed(options: {
  initialProductCount: number;
  currency: string | undefined;
  /** Featured campaign: cached SSR already resolved to an empty list. */
  ssrEmptyResolved?: boolean;
  /** Recently viewed is per-visitor — never use SSR seed. */
  forceClientFetch?: boolean;
}): boolean {
  if (options.forceClientFetch) return false;

  const cur = normalizeCatalogCurrencyCode(options.currency);
  if (options.ssrEmptyResolved && cur === CATALOG_SSR_CURRENCY) return true;
  if (options.initialProductCount === 0) return false;
  return cur === CATALOG_SSR_CURRENCY;
}

/** Single catalog entity (e.g. PDP) SSR-seeded in QAR only. */
export function canUseCatalogSsrSeed(
  hasSsrData: boolean,
  currency: string | undefined,
): boolean {
  return canUseHomeCarouselSsrSeed({
    initialProductCount: hasSsrData ? 1 : 0,
    currency,
  });
}

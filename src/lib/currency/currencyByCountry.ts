import type { GqlCurrency } from "@/services/graphql/types/currency";

export const DEFAULT_CURRENCY = "QAR";

/**
 * Primary ISO 3166-1 alpha-2 country per `getCurrencies.alphaCode`.
 * Keys mirror the live GraphQL catalog.
 */
export const CURRENCY_PRIMARY_COUNTRY: Record<string, string> = {
  BHD: "bh",
  KWD: "kw",
  OMR: "om",
  QAR: "qa",
  SAR: "sa",
  AED: "ae",
  USD: "us",
};

function normalizeCountryCode(value: string | null | undefined): string | null {
  const code = String(value ?? "")
    .trim()
    .toLowerCase();
  return /^[a-z]{2}$/.test(code) ? code : null;
}

function normalizeCurrencyCode(value: string | null | undefined): string | null {
  const code = String(value ?? "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

/** Map ISO country code → catalog currency when the country is supported. */
export function buildCountryToCurrencyMap(
  currencies: GqlCurrency[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of currencies) {
    const currencyCode = normalizeCurrencyCode(row.alphaCode);
    if (!currencyCode) continue;
    const countryCode = normalizeCountryCode(CURRENCY_PRIMARY_COUNTRY[currencyCode]);
    if (!countryCode) continue;
    map.set(countryCode, currencyCode);
  }
  return map;
}

export function getCurrencyCountryCode(currencyCode: string): string {
  const upper = normalizeCurrencyCode(currencyCode) ?? "";
  return CURRENCY_PRIMARY_COUNTRY[upper] ?? "us";
}

export function resolveCurrencyForCountryCode(
  countryCode: string | null | undefined,
  currencies: GqlCurrency[],
): string | null {
  const normalizedCountry = normalizeCountryCode(countryCode);
  if (!normalizedCountry) return null;
  return buildCountryToCurrencyMap(currencies).get(normalizedCountry) ?? null;
}

export function pickDefaultCurrency(
  catalogCodes: readonly string[],
  currencies: GqlCurrency[],
  countryCode?: string | null,
): string {
  const fromGeo = resolveCurrencyForCountryCode(countryCode, currencies);
  if (fromGeo && catalogCodes.includes(fromGeo)) return fromGeo;
  if (catalogCodes.includes(DEFAULT_CURRENCY)) return DEFAULT_CURRENCY;
  return catalogCodes[0] ?? DEFAULT_CURRENCY;
}

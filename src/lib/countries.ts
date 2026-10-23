import countries from "i18n-iso-countries";

// These JSON files ship with the package.
// They are needed to get localized country names.
import en from "i18n-iso-countries/langs/en.json";
import ar from "i18n-iso-countries/langs/ar.json";

export type CountryOption = { code: string; name: string };

let localesRegistered = false;

function ensureLocalesRegistered() {
  if (localesRegistered) return;
  countries.registerLocale(en);
  countries.registerLocale(ar);
  localesRegistered = true;
}

function normalizeCountriesLocale(locale: string): "en" | "ar" {
  const l = String(locale || "").toLowerCase();
  if (l.startsWith("ar")) return "ar";
  return "en";
}

const cache = new Map<string, CountryOption[]>();

/**
 * Returns a stable, alphabetized list of countries for a locale.
 * `value` should generally be the display name, since the referral API expects a nationality-like string.
 */
export function getCountryOptions(locale: string): CountryOption[] {
  ensureLocalesRegistered();
  const l = normalizeCountriesLocale(locale);
  const cached = cache.get(l);
  if (cached) return cached;

  const names = countries.getNames(l, { select: "official" }) as Record<
    string,
    string
  >;

  const opts = Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .filter((o) => o.name && typeof o.name === "string")
    .sort((a, b) => a.name.localeCompare(b.name, l));

  cache.set(l, opts);
  return opts;
}


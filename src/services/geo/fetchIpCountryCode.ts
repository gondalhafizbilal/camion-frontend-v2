import { cacheRead, cacheWrite } from "@/lib/storageTtlCache";

const GEO_COUNTRY_CACHE_KEY = "camion_geo_country_v1";
const GEO_COUNTRY_CACHE_VERSION = 1;
const GEO_COUNTRY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type GeoCountryResponse = {
  countryCode?: string | null;
};

/** Resolve visitor ISO country code via same-origin ipquery proxy. */
export async function fetchCachedIpCountryCode(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cached = cacheRead<{ countryCode: string }>(
    window.sessionStorage,
    GEO_COUNTRY_CACHE_KEY,
    { version: GEO_COUNTRY_CACHE_VERSION },
  );
  const cachedCode = String(cached.value?.countryCode ?? "")
    .trim()
    .toUpperCase();
  if (/^[A-Z]{2}$/.test(cachedCode)) return cachedCode;

  try {
    const res = await fetch("/api/geo/country", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as GeoCountryResponse | null;
    const countryCode = String(data?.countryCode ?? "")
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) return null;

    cacheWrite(
      window.sessionStorage,
      GEO_COUNTRY_CACHE_KEY,
      { countryCode },
      { version: GEO_COUNTRY_CACHE_VERSION, ttlMs: GEO_COUNTRY_CACHE_TTL_MS },
    );
    return countryCode;
  } catch {
    return null;
  }
}

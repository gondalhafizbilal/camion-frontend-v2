"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@/i18n/navigation";
import type { GqlCurrency } from "@/services/graphql/types/currency";
import {
  CURRENCY_PRIMARY_COUNTRY,
  DEFAULT_CURRENCY,
  getCurrencyCountryCode,
  pickDefaultCurrency,
} from "@/lib/currency/currencyByCountry";
import {
  CURRENCY_STORAGE_KEY,
  persistCurrencyPreference,
  readStoredCurrencyCode,
  scheduleCurrencyRouteRefresh,
} from "@/lib/currency/currencyStorage";
import { runWhenIdle } from "@/lib/storageTtlCache";
import { fetchCachedIpCountryCode } from "@/services/geo/fetchIpCountryCode";
import { useSiteCatalog } from "./SiteCatalogContext";

/** Fallback when `getCurrencies` is empty or fails (matches live GraphQL catalog). */
export const SUPPORTED_CURRENCIES = [
  "BHD",
  "KWD",
  "OMR",
  "QAR",
  "SAR",
  "AED",
  "USD",
] as const;

export type CurrencyCode = string;

/** @deprecated Use {@link CURRENCY_PRIMARY_COUNTRY} from `@/lib/currency/currencyByCountry`. */
export const CURRENCY_COUNTRY_MAP: Record<
  (typeof SUPPORTED_CURRENCIES)[number],
  string
> = {
  BHD: CURRENCY_PRIMARY_COUNTRY.BHD,
  KWD: CURRENCY_PRIMARY_COUNTRY.KWD,
  OMR: CURRENCY_PRIMARY_COUNTRY.OMR,
  QAR: CURRENCY_PRIMARY_COUNTRY.QAR,
  SAR: CURRENCY_PRIMARY_COUNTRY.SAR,
  AED: CURRENCY_PRIMARY_COUNTRY.AED,
  USD: CURRENCY_PRIMARY_COUNTRY.USD,
};

export { getCurrencyCountryCode };

/** @deprecated Import {@link CURRENCY_STORAGE_KEY} from `@/lib/currency/currencyStorage`. */
export const STORAGE_KEY = CURRENCY_STORAGE_KEY;

function looksLikeIso4217(code: string | null | undefined): code is string {
  const u = String(code ?? "")
    .toUpperCase()
    .trim();
  return /^[A-Z]{3}$/.test(u);
}

/** Allowed ISO codes: `getCurrencies` only. When the API returns nothing, only `QAR` is valid. */
function catalogCodesFromApi(rows: GqlCurrency[]): readonly string[] {
  const list = codesFromCatalog(rows);
  return list.length > 0 ? list : ([DEFAULT_CURRENCY] as const);
}

function codesFromCatalog(rows: GqlCurrency[]): string[] {
  const set = new Set<string>();
  for (const c of rows) {
    const code = String(c.alphaCode ?? "")
      .toUpperCase()
      .trim();
    if (code) set.add(code);
  }
  return [...set];
}

export type CurrencyOption = { code: string; label: string };

export type CurrencyContextValue = {
  currency: string;
  setCurrency: (next: string) => void;
  supportedCurrencies: readonly string[];
  currencyOptions: readonly CurrencyOption[];
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialCurrency,
}: {
  children: ReactNode;
  initialCurrency?: string;
}) {
  const router = useRouter();
  const { currencies, loading: catalogLoading } = useSiteCatalog();

  const catalogCodes = useMemo(
    () => catalogCodesFromApi(currencies),
    [currencies],
  );

  const currencyOptions = useMemo<readonly CurrencyOption[]>(() => {
    const nameByCode = new Map<string, string>();
    for (const c of currencies) {
      const code = String(c.alphaCode ?? "")
        .toUpperCase()
        .trim();
      if (!code) continue;
      const name = String(c.name ?? "").trim();
      nameByCode.set(code, name || code);
    }
    return catalogCodes.map((code) => ({
      code,
      label: nameByCode.get(code) ?? code,
    }));
  }, [currencies, catalogCodes]);

  const pickDefault = useCallback(
    (catalog: readonly string[]) => pickDefaultCurrency(catalog, currencies),
    [currencies],
  );

  /** First paint: SSR cookie when present, else QAR until catalog + sync run. */
  const [currency, setCurrencyState] = useState<string>(() => {
    const raw = initialCurrency?.toUpperCase()?.trim();
    return raw || DEFAULT_CURRENCY;
  });

  const activeCurrencyRef = useRef(currency);
  activeCurrencyRef.current = currency;

  /**
   * Apply currency for the session: React state + localStorage + cookie.
   * GraphQL client queries read `useCurrency()`; SSR reads the cookie on refresh.
   */
  const commitCurrency = useCallback(
    (next: string, options?: { refreshRoute?: boolean }) => {
      const code = String(next || "").toUpperCase().trim();
      if (!looksLikeIso4217(code) || !catalogCodes.includes(code)) return;

      const changed = activeCurrencyRef.current !== code;
      activeCurrencyRef.current = code;
      setCurrencyState(code);
      persistCurrencyPreference(code);

      if (changed && options?.refreshRoute) {
        scheduleCurrencyRouteRefresh(() => router.refresh());
      }
    },
    [catalogCodes, router],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readStoredCurrencyCode();
    const fromServer = initialCurrency?.toUpperCase()?.trim();
    const catalog = catalogCodes;

    if (catalogLoading) {
      if (looksLikeIso4217(stored)) {
        setCurrencyState(stored.toUpperCase());
        activeCurrencyRef.current = stored.toUpperCase();
        return;
      }
      if (looksLikeIso4217(fromServer)) {
        setCurrencyState(fromServer);
        activeCurrencyRef.current = fromServer;
        return;
      }
      return;
    }

    if (looksLikeIso4217(stored) && catalog.includes(stored)) {
      setCurrencyState(stored.toUpperCase());
      activeCurrencyRef.current = stored.toUpperCase();
      return;
    }

    if (looksLikeIso4217(stored) && !catalog.includes(stored)) {
      commitCurrency(pickDefault(catalog));
      return;
    }

    if (fromServer && catalog.includes(fromServer)) {
      commitCurrency(fromServer);
      return;
    }

    setCurrencyState((cur) => {
      const u = String(cur || "").toUpperCase().trim();
      const next = catalog.includes(u) ? u : pickDefault(catalog);
      activeCurrencyRef.current = next;
      return next;
    });
  }, [catalogLoading, catalogCodes, initialCurrency, pickDefault, commitCurrency]);

  useEffect(() => {
    if (typeof window === "undefined" || catalogLoading) return;

    const stored = readStoredCurrencyCode();
    const fromServer = initialCurrency?.toUpperCase()?.trim();
    if (looksLikeIso4217(stored) && catalogCodes.includes(stored)) return;
    if (fromServer && catalogCodes.includes(fromServer)) return;

    let cancelled = false;

    const resolveFromGeo = async () => {
      const countryCode = await fetchCachedIpCountryCode();
      if (cancelled) return;

      const next = pickDefaultCurrency(catalogCodes, currencies, countryCode);
      const latestStored = readStoredCurrencyCode();
      if (looksLikeIso4217(latestStored) && catalogCodes.includes(latestStored)) {
        setCurrencyState(latestStored.toUpperCase());
        activeCurrencyRef.current = latestStored.toUpperCase();
        return;
      }

      commitCurrency(next, { refreshRoute: true });
    };

    const cancelIdle = runWhenIdle(() => void resolveFromGeo(), 600);
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [catalogLoading, catalogCodes, currencies, initialCurrency, commitCurrency]);

  const setCurrency = useCallback(
    (next: string) => {
      commitCurrency(next, { refreshRoute: true });
    },
    [commitCurrency],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      supportedCurrencies: catalogCodes,
      currencyOptions,
    }),
    [currency, setCurrency, catalogCodes, currencyOptions],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}

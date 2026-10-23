"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { routing } from "@/i18n/routing";
import { fetchLanguages, fetchCurrencies } from "@/services/graphql";
import type { GqlLanguage } from "@/services/graphql/types/language";
import type { GqlCurrency } from "@/services/graphql/types/currency";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import { cacheRead, cacheWrite, runWhenIdle } from "@/lib/storageTtlCache";

export type SiteCatalogContextValue = {
  languages: GqlLanguage[];
  currencies: GqlCurrency[];
  loading: boolean;
};

const SiteCatalogContext = createContext<SiteCatalogContextValue | null>(null);

const SITE_CATALOG_CACHE_VERSION = 1;
const SITE_CATALOG_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const SITE_CATALOG_CACHE_KEY = "camion_site_catalog_v1";

type CachedSiteCatalog = {
  languages: GqlLanguage[];
  currencies: GqlCurrency[];
};

function sortLanguagesByRoutingLocales(rows: GqlLanguage[]): GqlLanguage[] {
  const order = routing.locales.map((l) => l.toLowerCase());
  return [...rows].sort(
    (a, b) =>
      order.indexOf(String(a.shortCode ?? "").toLowerCase()) -
      order.indexOf(String(b.shortCode ?? "").toLowerCase()),
  );
}

function filterLanguagesForAppLocales(raw: GqlLanguage[]): GqlLanguage[] {
  const allowed = new Set(routing.locales.map((l) => l.toLowerCase()));
  const rows = (raw ?? []).filter((lang) => {
    const sc = String(lang.shortCode ?? "").toLowerCase();
    return sc && allowed.has(sc);
  });
  return sortLanguagesByRoutingLocales(rows);
}

export function SiteCatalogProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<GqlLanguage[]>([]);
  const [currencies, setCurrencies] = useState<GqlCurrency[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = Cookies.get("token") ?? null;
    try {
      const [langRes, curRes] = await Promise.all([
        fetchLanguages(token),
        fetchCurrencies(token),
      ]);
      const nextLangs = filterLanguagesForAppLocales(langRes.getLanguages ?? []);
      const nextCurrencies = (curRes.getCurrencies ?? []).filter((c) =>
        String(c.alphaCode ?? "").trim(),
      );
      setLanguages(nextLangs);
      setCurrencies(nextCurrencies);
      if (typeof window !== "undefined") {
        cacheWrite<CachedSiteCatalog>(
          window.localStorage,
          SITE_CATALOG_CACHE_KEY,
          { languages: nextLangs, currencies: nextCurrencies },
          { version: SITE_CATALOG_CACHE_VERSION, ttlMs: SITE_CATALOG_CACHE_TTL_MS },
        );
      }
    } catch (e) {
      console.error("SiteCatalogProvider: load failed", e);
      setLanguages([]);
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fast path: hydrate from cache for instant header/settings options.
    const cached = cacheRead<CachedSiteCatalog>(window.localStorage, SITE_CATALOG_CACHE_KEY, {
      version: SITE_CATALOG_CACHE_VERSION,
    });
    if (cached.value) {
      setLanguages(filterLanguagesForAppLocales(cached.value.languages ?? []));
      setCurrencies(
        (cached.value.currencies ?? []).filter((c) => String(c.alphaCode ?? "").trim()),
      );
      setLoading(false);
    }

    // Refresh in the background when idle (stale-while-revalidate).
    const cancel = runWhenIdle(() => void load(), 1200);
    return cancel;
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSession = () => {
      // Session token changed (guest/customer). Refresh but don't block UI.
      runWhenIdle(() => void load(), 800);
    };
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    return () =>
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  }, [load]);

  const value = useMemo<SiteCatalogContextValue>(
    () => ({ languages, currencies, loading }),
    [languages, currencies, loading],
  );

  return (
    <SiteCatalogContext.Provider value={value}>
      {children}
    </SiteCatalogContext.Provider>
  );
}

export function useSiteCatalog(): SiteCatalogContextValue {
  const ctx = useContext(SiteCatalogContext);
  if (!ctx) {
    throw new Error("useSiteCatalog must be used within SiteCatalogProvider");
  }
  return ctx;
}

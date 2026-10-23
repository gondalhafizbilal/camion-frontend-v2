"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useLocale } from "next-intl";
import Cookies from "js-cookie";
import { fetchCategories } from "@/services/graphql/operations/categories";
import type {
  GqlCategory,
  GqlCategoryChild,
  GqlCategoryGrandchild,
} from "@/services/graphql/types/category";
import {
  CAMION_SESSION_UPDATED_EVENT,
  ensureGuestSessionIfNeeded,
  waitForClientAuthToken,
} from "@/services/auth/guestRegister";
import { cacheRead, cacheWrite, runWhenIdle } from "@/lib/storageTtlCache";

/** Flat / legacy shape for filters, nav pills, and `categories.jsx` image fallbacks. */
export type CategoryRecord = {
  id?: string | number;
  uuid?: string;
  name?: string;
  slug?: string;
  thumbnailUrl?: string | null;
  image?: { thumbnail?: string; src?: string };
  children?: CategoryRecord[];
  [key: string]: unknown;
};

function mapGrandchild(g: GqlCategoryGrandchild): CategoryRecord {
  const thumb = g.thumbnailUrl ?? undefined;
  return {
    id: g.uuid,
    uuid: g.uuid,
    slug: g.slug,
    name: g.name ?? undefined,
    thumbnailUrl: g.thumbnailUrl,
    image: thumb ? { thumbnail: thumb, src: thumb } : undefined,
  };
}

function mapChild(c: GqlCategoryChild): CategoryRecord {
  const thumb = c.thumbnailUrl ?? undefined;
  return {
    id: c.uuid,
    uuid: c.uuid,
    slug: c.slug,
    name: c.name ?? undefined,
    thumbnailUrl: c.thumbnailUrl,
    image: thumb ? { thumbnail: thumb, src: thumb } : undefined,
    children: c.children?.map(mapGrandchild) ?? [],
  };
}

function mapRootToRecord(c: GqlCategory): CategoryRecord {
  const thumb = c.thumbnailUrl ?? undefined;
  return {
    id: c.uuid,
    uuid: c.uuid,
    slug: c.slug,
    name: c.name ?? undefined,
    thumbnailUrl: c.thumbnailUrl,
    image: thumb ? { thumbnail: thumb, src: thumb } : undefined,
    children: c.children?.map(mapChild) ?? [],
  };
}

/** Pre-order flatten for filter dropdowns (every slug in the tree). */
function flattenCategoryRecords(records: CategoryRecord[]): CategoryRecord[] {
  const out: CategoryRecord[] = [];
  const visit = (r: CategoryRecord) => {
    const { children, ...rest } = r;
    out.push({ ...rest, children: [] });
    for (const c of children ?? []) visit(c);
  };
  for (const r of records) visit(r);
  return out;
}

type CategoriesContextValue = {
  /** Top-level `getCategories` nodes (full tree). */
  roots: GqlCategory[];
  /** Top-level rows only (nav pills, shop-by carousel). */
  categories: CategoryRecord[];
  /** All categories in tree order (shop filter, etc.). */
  flatCategories: CategoryRecord[];
  setCategories: Dispatch<SetStateAction<CategoryRecord[]>>;
  loading: boolean;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

type LocaleCache = {
  roots: GqlCategory[];
  records: CategoryRecord[];
  flat: CategoryRecord[];
};

const cacheByLocale: Record<string, LocaleCache> = {};
const fetchPromises: Partial<Record<string, Promise<LocaleCache>>> = {};

const CATEGORIES_CACHE_VERSION = 2;
const CATEGORIES_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const CATEGORIES_FETCH_ATTEMPTS = 3;
const CATEGORIES_FETCH_RETRY_MS = 500;

function categoriesCacheKey(locale: string): string {
  return `camion_categories_tree_v1_${locale}`;
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [sessionNonce, setSessionNonce] = useState(0);
  const seeded = cacheByLocale[locale];
  const [roots, setRoots] = useState<GqlCategory[]>(seeded?.roots ?? []);
  const [categories, setCategories] = useState<CategoryRecord[]>(seeded?.records ?? []);
  const [flatCategories, setFlatCategories] = useState<CategoryRecord[]>(
    seeded?.flat ?? [],
  );
  const [loading, setLoading] = useState(!seeded);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cacheByLocale[locale]) return;

    const cached = cacheRead<LocaleCache>(window.localStorage, categoriesCacheKey(locale), {
      version: CATEGORIES_CACHE_VERSION,
    });
    if (!cached.value) return;
    const rootsLen = cached.value.roots?.length ?? 0;
    if (rootsLen === 0) return;

    cacheByLocale[locale] = cached.value;
    setRoots(cached.value.roots ?? []);
    setCategories(cached.value.records ?? []);
    setFlatCategories(cached.value.flat ?? []);
    setLoading(false);

    if (cached.expired) {
      runWhenIdle(() => setSessionNonce((n) => n + 1), 800);
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSession = () => {
      // Token changed (guest/customer). Re-fetch categories with fresh Authorization.
      delete cacheByLocale[locale];
      delete fetchPromises[locale];
      try {
        window.localStorage.removeItem(categoriesCacheKey(locale));
      } catch {
        /* ignore */
      }
      setSessionNonce((n) => n + 1);
    };
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  }, [locale]);

  useEffect(() => {
    let mounted = true;
    const hit = cacheByLocale[locale];
    if (hit) {
      setRoots(hit.roots);
      setCategories(hit.records);
      setFlatCategories(hit.flat);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (!fetchPromises[locale]) {
      fetchPromises[locale] = (async () => {
        void ensureGuestSessionIfNeeded();
        await waitForClientAuthToken({ maxWaitMs: 4_000, pollIntervalMs: 80 });
        let lastList: GqlCategory[] = [];

        for (let attempt = 1; attempt <= CATEGORIES_FETCH_ATTEMPTS; attempt++) {
          const token = Cookies.get("token") ?? null;
          try {
            const data = await fetchCategories(
              { language: locale, pageNumber: 1, itemsPerPage: 200 },
              token,
            );
            lastList = data.getCategories ?? [];
            if (lastList.length > 0) break;
            if (attempt < CATEGORIES_FETCH_ATTEMPTS) {
              await new Promise((r) => setTimeout(r, CATEGORIES_FETCH_RETRY_MS));
            }
          } catch (e) {
            console.error("CategoriesProvider: GraphQL fetch error", e);
            if (attempt < CATEGORIES_FETCH_ATTEMPTS) {
              await new Promise((r) => setTimeout(r, CATEGORIES_FETCH_RETRY_MS));
            }
          }
        }

        const list = lastList;
        const records = list.map(mapRootToRecord);
        const flat = flattenCategoryRecords(records);
        const payload = { roots: list, records, flat };
        /** Never cache an empty tree in memory — it masked post–guest-register refetches and matched “missing until refresh”. */
        if (list.length > 0) {
          cacheByLocale[locale] = payload;
          if (typeof window !== "undefined") {
            cacheWrite<LocaleCache>(
              window.localStorage,
              categoriesCacheKey(locale),
              payload,
              { version: CATEGORIES_CACHE_VERSION, ttlMs: CATEGORIES_CACHE_TTL_MS },
            );
          }
        }

        return payload;
      })().finally(() => {
        delete fetchPromises[locale];
      });
    }

    void fetchPromises[locale]!.then((payload) => {
      if (!mounted) return;
      setRoots(payload.roots);
      setCategories(payload.records);
      setFlatCategories(payload.flat);
      setLoading(false);
    }).catch((e) => {
      console.error("CategoriesProvider: unexpected fetch failure", e);
      if (!mounted) return;
      const empty = {
        roots: [] as GqlCategory[],
        records: [] as CategoryRecord[],
        flat: [] as CategoryRecord[],
      };
      setRoots(empty.roots);
      setCategories(empty.records);
      setFlatCategories(empty.flat);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [locale, sessionNonce]);

  return (
    <CategoriesContext.Provider
      value={{
        roots,
        categories,
        flatCategories,
        setCategories,
        loading,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return ctx;
}

export default CategoriesContext;

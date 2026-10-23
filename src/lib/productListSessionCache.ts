import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import { cacheRead, cacheRemove, cacheWrite } from "@/lib/storageTtlCache";

const CACHE_VERSION = 1;
/** Session list + scroll restore TTL (tab session). */
const CACHE_TTL_MS = 15 * 60 * 1000;

export type ProductListSessionSnapshot = {
  products: CarouselProduct[];
  page: number;
  hasMore: boolean;
  scrollY: number;
  locale: string;
  currency: string;
  queryKey: string;
  /** Optional filter fingerprint (e.g. category sort). */
  filtersKey?: string;
};

function normalizeCurrency(currency: string): string {
  return String(currency || "QAR").toLowerCase();
}

function hashQueryKey(queryKey: string): string {
  const q = String(queryKey || "").trim();
  if (!q) return "";
  let h = 5381;
  for (let i = 0; i < q.length; i++) {
    h = (h * 33) ^ q.charCodeAt(i);
  }
  return `q${(h >>> 0).toString(36)}`;
}

export function buildProductListSessionStorageKey(
  listId: string,
  locale: string,
  currency: string,
  queryKey = "",
): string {
  const q = hashQueryKey(queryKey);
  return `camion_plist_v${CACHE_VERSION}:${listId}:${locale}:${normalizeCurrency(currency)}${q ? `:${q}` : ""}`;
}

function isValidSnapshot(
  snap: ProductListSessionSnapshot | null | undefined,
  locale: string,
  currency: string,
  queryKey: string,
): snap is ProductListSessionSnapshot {
  if (!snap) return false;
  if (snap.locale !== locale) return false;
  if (normalizeCurrency(snap.currency) !== normalizeCurrency(currency)) return false;
  if (snap.queryKey !== queryKey) return false;
  if (!Array.isArray(snap.products) || snap.products.length === 0) return false;
  if (!Number.isFinite(snap.page) || snap.page < 1) return false;
  return true;
}

export function readProductListSession(
  listId: string,
  locale: string,
  currency: string,
  queryKey = "",
): ProductListSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  const key = buildProductListSessionStorageKey(listId, locale, currency, queryKey);
  const { value, expired } = cacheRead<ProductListSessionSnapshot>(
    window.sessionStorage,
    key,
    { version: CACHE_VERSION },
  );
  if (!value || expired) return null;
  return isValidSnapshot(value, locale, currency, queryKey) ? value : null;
}

export function writeProductListSession(
  listId: string,
  locale: string,
  currency: string,
  queryKey: string,
  snapshot: Omit<ProductListSessionSnapshot, "locale" | "currency" | "queryKey">,
): void {
  if (typeof window === "undefined") return;
  const key = buildProductListSessionStorageKey(listId, locale, currency, queryKey);
  const payload: ProductListSessionSnapshot = {
    ...snapshot,
    locale,
    currency: normalizeCurrency(currency),
    queryKey,
    scrollY: Math.max(0, Math.floor(snapshot.scrollY)),
    page: Math.max(1, Math.floor(snapshot.page)),
  };
  cacheWrite(window.sessionStorage, key, payload, {
    version: CACHE_VERSION,
    ttlMs: CACHE_TTL_MS,
  });
}

export function updateProductListSessionScrollY(
  listId: string,
  locale: string,
  currency: string,
  queryKey = "",
): void {
  if (typeof window === "undefined") return;
  const key = buildProductListSessionStorageKey(listId, locale, currency, queryKey);
  const { value, expired } = cacheRead<ProductListSessionSnapshot>(
    window.sessionStorage,
    key,
    { version: CACHE_VERSION },
  );
  if (!value || expired) return;
  if (!isValidSnapshot(value, locale, currency, queryKey)) return;
  writeProductListSession(listId, locale, currency, queryKey, {
    products: value.products,
    page: value.page,
    hasMore: value.hasMore,
    scrollY: window.scrollY,
    filtersKey: value.filtersKey,
  });
}

export function clearProductListSession(
  listId: string,
  locale: string,
  currency: string,
  queryKey = "",
): void {
  if (typeof window === "undefined") return;
  const key = buildProductListSessionStorageKey(listId, locale, currency, queryKey);
  cacheRemove(window.sessionStorage, key);
}

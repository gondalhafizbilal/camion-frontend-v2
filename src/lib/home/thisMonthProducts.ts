import Cookies from "js-cookie";
import {
  ensureGuestSessionIfNeeded,
  waitForClientAuthToken,
} from "@/services/auth/guestRegister";
import {
  fetchPopularProducts,
  fetchRecentlyViewedProducts,
} from "@/services/graphql";
import type { GqlProduct } from "@/services/graphql/types/product";

/** “This month” prefers recently viewed; falls back to popular when empty. */
export function resolveThisMonthProducts(
  recent: GqlProduct[] | null | undefined,
  popular: GqlProduct[] | null | undefined,
): GqlProduct[] {
  const recentList = recent ?? [];
  if (recentList.length > 0) return recentList;
  return popular ?? [];
}

export type FetchThisMonthProductsVariables = {
  language: string;
  currency: string;
  pageNumber?: number;
  itemsPerPage?: number;
};

async function resolveCatalogAuthToken(
  authToken?: string | null,
): Promise<string | null> {
  const explicit = authToken?.trim();
  if (explicit) return explicit;
  if (typeof window === "undefined") return null;
  void ensureGuestSessionIfNeeded();
  return (
    (await waitForClientAuthToken({ maxWaitMs: 4_000, pollIntervalMs: 80 })) ??
    Cookies.get("token")?.trim() ??
    null
  );
}

/** Client / standalone fetch: `getRecentlyViewedProducts`, then `getPopularProducts` if empty. */
export async function fetchThisMonthProducts(
  variables: FetchThisMonthProductsVariables,
  authToken?: string | null,
): Promise<GqlProduct[]> {
  const pageNumber = variables.pageNumber ?? 1;
  const itemsPerPage = variables.itemsPerPage ?? 10;
  const { language, currency } = variables;
  const token = await resolveCatalogAuthToken(authToken);

  let recent: GqlProduct[] = [];
  try {
    const { getRecentlyViewedProducts } = await fetchRecentlyViewedProducts(
      { language, currency, pageNumber, itemsPerPage },
      token,
    );
    recent = getRecentlyViewedProducts ?? [];
  } catch {
    /* use popular fallback below */
  }
  if (recent.length > 0) return recent;

  const { getPopularProducts } = await fetchPopularProducts(
    { language, currency, pageNumber, itemsPerPage },
    token,
  );
  return getPopularProducts ?? [];
}

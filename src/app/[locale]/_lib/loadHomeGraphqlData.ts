import { getCatalogGraphqlToken } from "@/services/auth/guestRegisterServer";
import { STORIES_ENABLED } from "@/lib/features/storiesEnabled";
import {
  fetchAllBanners,
  fetchHomePage,
  type GqlBanner,
  type GqlProduct,
  type GqlStory,
} from "@/services/graphql";
import { unstable_cache } from "next/cache";
import { PRODUCT_LIST_MAX_ITEMS_PER_PAGE } from "@/services/graphql/constants/productListPageSize";
import { HOME_GRAPHQL_REVALIDATE_SECONDS } from "@/lib/home/homeCacheConfig";
import {
  PRODUCT_POPULAR_SORT,
  PRODUCT_SEARCH_SORT,
} from "@/services/graphql/constants/productSearchSort";

export type HomeGraphqlPayload = {
  stories: GqlStory[];
  banners: GqlBanner[];
  featuredCampaignProducts: GqlProduct[];
  popularProducts: GqlProduct[];
  featuredProducts: GqlProduct[];
  /** Recently viewed for “This month”; popular products when recent is empty. */
  thisMonthProducts: GqlProduct[];
  /** First page of catalog grid — loaded client-side on home to keep SSR fast. */
  allProducts: GqlProduct[];
};

/** True when every home list is empty (usually a failed or unauthenticated HomePage, not a “real” empty catalog). */
export function isHomeGraphqlPayloadEmpty(p: HomeGraphqlPayload): boolean {
  return (
    (p.banners?.length ?? 0) +
      (p.popularProducts?.length ?? 0) +
      (p.featuredProducts?.length ?? 0) +
      (p.thisMonthProducts?.length ?? 0) ===
    0
  );
}

/** Bumped when {@link HomeGraphqlPayload} shape or query selection changes. */
const HOME_GRAPHQL_CACHE_KEY_VERSION = "v7-all-banners-pagination";

// const HOME_STORIES_ITEMS_PER_PAGE = 12;
const HOME_CAROUSEL_ITEMS_PER_PAGE = 10;

/** Ensures every list exists (partial GraphQL / legacy cached payloads). */
export function normalizeHomeGraphqlPayload(
  raw: Partial<HomeGraphqlPayload> | null | undefined,
): HomeGraphqlPayload {
  return {
    stories: raw?.stories ?? [],
    banners: raw?.banners ?? [],
    featuredCampaignProducts: raw?.featuredCampaignProducts ?? [],
    popularProducts: raw?.popularProducts ?? [],
    featuredProducts: raw?.featuredProducts ?? [],
    thisMonthProducts: raw?.thisMonthProducts ?? [],
    allProducts: raw?.allProducts ?? [],
  };
}

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error(`[home graphql] ${label}:`, e);
    return fallback;
  }
}

function homeVars(language: string, currencyCode: string) {
  return {
    language,
    currency: currencyCode,
    // storiesPageNumber: 1,
    // storiesItemsPerPage: HOME_STORIES_ITEMS_PER_PAGE,
    popularPageNumber: 1,
    popularItemsPerPage: HOME_CAROUSEL_ITEMS_PER_PAGE,
    popularSort: PRODUCT_POPULAR_SORT.MOST_VIEWED,
    featuredPageNumber: 1,
    featuredItemsPerPage: HOME_CAROUSEL_ITEMS_PER_PAGE,
    featuredCampaignPageNumber: 1,
    featuredCampaignItemsPerPage: HOME_CAROUSEL_ITEMS_PER_PAGE,
    featuredCampaignSort: PRODUCT_SEARCH_SORT.BEST_MATCH,
  } as const;
}

async function fetchHomePayloadOnce(
  locale: string,
  currencyCode: string,
  token: string | null,
): Promise<HomeGraphqlPayload> {
  const language = locale === "ar" ? "ar" : "en";
  const [res, banners] = await Promise.all([
    safe(
      "homePage (aggregated)",
      () => fetchHomePage(homeVars(language, currencyCode), token),
      {
        stories: [] as GqlStory[],
        popularProducts: [] as GqlProduct[],
        featuredProducts: [] as GqlProduct[],
        featuredCampaignProducts: [] as GqlProduct[],
      },
    ),
    safe(
      "getBanners (all pages)",
      () => fetchAllBanners({ language, authToken: token }),
      [] as GqlBanner[],
    ),
  ]);

  const popular = res.popularProducts ?? [];

  return normalizeHomeGraphqlPayload({
    stories: STORIES_ENABLED ? res.stories : [],
    banners,
    featuredCampaignProducts: res.featuredCampaignProducts,
    popularProducts: popular,
    featuredProducts: res.featuredProducts,
    /** Per-visitor recently viewed — loaded client-side only (see ThisMonthSection). */
    thisMonthProducts: [],
    allProducts: [],
  });
}

const readCachedHomeGraphqlData = unstable_cache(
  async (locale: string, currencyCode: string) => {
    const token = await getCatalogGraphqlToken();
    const payload = await fetchHomePayloadOnce(locale, currencyCode, token);
    return normalizeHomeGraphqlPayload(payload);
  },
  ["home-graphql", HOME_GRAPHQL_CACHE_KEY_VERSION],
  {
    revalidate: HOME_GRAPHQL_REVALIDATE_SECONDS,
    tags: ["home", "home-graphql"],
  },
);

/**
 * Home GraphQL for SSR. Shared catalog token + `unstable_cache` (default 5m per locale/currency).
 * Avoids slow per-request guest-register retry loops that previously blocked the server under load.
 */
export async function loadHomeGraphqlData(
  locale: string,
  currency = "QAR",
): Promise<HomeGraphqlPayload> {
  const currencyCode = String(currency || "QAR").toLowerCase();
  return readCachedHomeGraphqlData(locale, currencyCode);
}

/** @internal — page size hints for client “all products” section (not part of aggregated HomePage query). */
export const HOME_ALL_PRODUCTS_CLIENT_PAGE_SIZE = PRODUCT_LIST_MAX_ITEMS_PER_PAGE;

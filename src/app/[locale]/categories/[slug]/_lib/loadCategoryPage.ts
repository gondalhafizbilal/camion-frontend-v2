import { unstable_cache } from "next/cache";
import { getCatalogGraphqlToken } from "@/services/auth/guestRegisterServer";
import {
  fetchCategories,
  fetchProductsByCategory,
  PRODUCT_SEARCH_SORT,
} from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import { CATALOG_SSR_CURRENCY } from "@/lib/catalog/catalogSsr";
import { findCategoryBySlug } from "@/lib/catalog/categoryTree";
import {
  PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
  hasMoreProductListPages,
} from "@/services/graphql/constants/productListPageSize";
import { PRODUCT_DETAIL_REVALIDATE_SECONDS } from "@/lib/home/homeCacheConfig";

export type CategoryPagePayload = {
  categoryName: string;
  categorySlug: string;
  products: CarouselProduct[];
  hasMore: boolean;
};

async function fetchCategoryPageOnce(
  locale: string,
  slug: string,
): Promise<CategoryPagePayload | null> {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;

  try {
    const token = await getCatalogGraphqlToken();
    const language = locale === "ar" ? "ar" : "en";

    let categoryName = decodeURIComponent(normalizedSlug).replace(/-/g, " ");
    try {
      const { getCategories } = await fetchCategories(
        { language, pageNumber: 1, itemsPerPage: 200 },
        token,
      );
      const match = findCategoryBySlug(getCategories, normalizedSlug);
      if (match?.name) categoryName = match.name;
    } catch (e) {
      console.warn("[category-page] categories lookup failed:", e);
    }

    let products: CarouselProduct[] = [];
    let hasMore = false;
    try {
      const { getProductsByCategory } = await fetchProductsByCategory(
        {
          slug: normalizedSlug,
          language,
          currency: CATALOG_SSR_CURRENCY,
          sort: PRODUCT_SEARCH_SORT.BEST_MATCH,
          pageNumber: 1,
          itemsPerPage: PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
        },
        token,
      );
      products = (getProductsByCategory ?? []).map(gqlProductToCarouselProduct);
      hasMore = hasMoreProductListPages(
        products.length,
        PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
        true,
      );
    } catch (e) {
      console.warn("[category-page] products fetch failed:", e);
    }

    return {
      categoryName,
      categorySlug: normalizedSlug,
      products,
      hasMore,
    };
  } catch (e) {
    console.warn("[category-page] SSR load failed:", e);
    return null;
  }
}

const readCachedCategoryPage = unstable_cache(
  async (locale: string, slug: string) => fetchCategoryPageOnce(locale, slug),
  ["category-page-graphql", "v1"],
  {
    revalidate: PRODUCT_DETAIL_REVALIDATE_SECONDS,
    tags: ["catalog-category", "category-page"],
  },
);

/** SSR category name + first product page for indexable HTML. Never throws. */
export async function loadCategoryPageGraphql(
  locale: string,
  slug: string,
): Promise<CategoryPagePayload | null> {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;
  try {
    return await readCachedCategoryPage(locale, normalizedSlug);
  } catch (e) {
    console.warn("[category-page] cache read failed:", e);
    return null;
  }
}

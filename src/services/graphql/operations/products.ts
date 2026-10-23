import { PRODUCT_DETAIL_REVALIDATE_SECONDS } from "@/lib/home/homeCacheConfig";
import { graphqlRequest } from "../client";
import { clampProductListItemsPerPage } from "../constants/productListPageSize";
import {
  PRODUCT_POPULAR_SORT,
  PRODUCT_SEARCH_SORT,
} from "../constants/productSearchSort";
import {
  ADD_BUNDLE_TO_CART,
  GET_BUNDLES_FOR_PRODUCT,
  GET_FEATURED_PRODUCTS,
  GET_POPULAR_PRODUCTS,
  GET_PRODUCT,
  GET_PRODUCTS,
  GET_PRODUCTS_IN_FEATURED_CAMPAIGN,
  GET_PRODUCTS_BY_CATEGORY,
  GET_PRODUCTS_BY_CATEGORIES,
  GET_RECENTLY_VIEWED_PRODUCTS,
  GET_RECOMMENDED_PRODUCTS,
  GET_RELATED_PRODUCTS,
  SEARCH_PRODUCTS,
  type AddBundleToCartVariables,
  type GetBundlesForProductVariables,
  type GetFeaturedProductsVariables,
  type GetPopularProductsVariables,
  type GetProductVariables,
  type GetProductsVariables,
  type GetProductsInFeaturedCampaignVariables,
  type GetProductsByCategoryVariables,
  type GetProductsByCategoriesVariables,
  type GetRecentlyViewedProductsVariables,
  type GetRecommendedProductsVariables,
  type GetRelatedProductsVariables,
  type SearchProductsVariables,
} from "../queries/products";
import type {
  AddBundleToCartData,
  GetBundlesForProductData,
  GetFeaturedProductsData,
  GetPopularProductsData,
  GetProductData,
  GetProductsByCategoryData,
  GetProductsByCategoriesData,
  GetProductsData,
  GetProductsInFeaturedCampaignData,
  GetRecentlyViewedProductsData,
  GetRecommendedProductsData,
  GetRelatedProductsData,
  SearchProductsData,
} from "../types/responses";

const DEFAULT_PRODUCTS_BY_CATEGORY_PAGE = 1;
/** Default `itemsPerPage` for all catalog/product list operations when omitted. */
const DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE = 5;
const emptyPopular: GetPopularProductsData = { getPopularProducts: [] };
const emptySearch: SearchProductsData = { searchProducts: [] };
const emptyBundles: GetBundlesForProductData = { getBundlesForProduct: [] };

export async function fetchBundlesForProduct(
  variables: GetBundlesForProductVariables,
  authToken?: string | null,
): Promise<GetBundlesForProductData> {
  const data =
    (await graphqlRequest<GetBundlesForProductData>(
      {
        query: GET_BUNDLES_FOR_PRODUCT,
        operationName: "GetBundlesForProduct",
        variables: {
          productUUID: variables.productUUID,
          currency: variables.currency,
          countryCode: variables.countryCode ?? null,
          language: variables.language,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyBundles;

  return {
    getBundlesForProduct: data.getBundlesForProduct ?? [],
  };
}

export async function addBundleToCart(
  variables: AddBundleToCartVariables,
  authToken?: string | null,
): Promise<AddBundleToCartData> {
  const data = (await graphqlRequest<AddBundleToCartData>(
    {
      query: ADD_BUNDLE_TO_CART,
      operationName: "AddBundleToCart",
      variables: {
        bundleUuid: variables.bundleUuid,
        currency: variables.currency,
        countryCode: variables.countryCode ?? null,
        items: variables.items ?? [],
        quantity: variables.quantity,
      } as Record<string, unknown>,
    },
    { authToken },
  )) ?? { addBundleToCart: null };

  return {
    addBundleToCart: data.addBundleToCart ?? null,
  };
}

export async function fetchPopularProducts(
  variables: GetPopularProductsVariables,
  authToken?: string | null,
): Promise<GetPopularProductsData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const sort = variables.sort ?? PRODUCT_POPULAR_SORT.MOST_VIEWED;
  const data =
    (await graphqlRequest<GetPopularProductsData>(
      {
        query: GET_POPULAR_PRODUCTS,
        operationName: "GetPopularProducts",
        variables: {
          language: variables.language,
          currency: variables.currency,
          sort,
          pageNumber,
          itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyPopular;
  const list = data.getPopularProducts ?? [];
  return { getPopularProducts: list.slice(0, itemsPerPage) };
}

export async function fetchSearchProducts(
  variables: SearchProductsVariables,
  authToken?: string | null,
): Promise<SearchProductsData> {
  const sort = variables.sort ?? PRODUCT_SEARCH_SORT.BEST_MATCH;
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const data =
    (await graphqlRequest<SearchProductsData>(
      {
        query: SEARCH_PRODUCTS,
        operationName: "SearchProducts",
        variables: {
          query: variables.query,
          language: variables.language,
          currency: variables.currency,
          sort,
          pageNumber,
          itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptySearch;
  const list = data.searchProducts ?? [];
  return { searchProducts: list.slice(0, itemsPerPage) };
}

const emptyRecommended: GetRecommendedProductsData = {
  getRecommendedProducts: [],
};

export async function fetchRecommendedProducts(
  variables: GetRecommendedProductsVariables,
  authToken?: string | null,
): Promise<GetRecommendedProductsData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const data =
    (await graphqlRequest<GetRecommendedProductsData>(
      {
        query: GET_RECOMMENDED_PRODUCTS,
        operationName: "GetRecommendedProducts",
        variables: {
          slug: variables.slug,
          language: variables.language,
          currency: variables.currency,
          pageNumber,
          itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyRecommended;
  const list = data.getRecommendedProducts ?? [];
  return { getRecommendedProducts: list.slice(0, itemsPerPage) };
}

const emptyRelated: GetRelatedProductsData = { getRelatedProducts: [] };

export async function fetchRelatedProducts(
  variables: GetRelatedProductsVariables,
  authToken?: string | null,
): Promise<GetRelatedProductsData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const data =
    (await graphqlRequest<GetRelatedProductsData>(
      {
        query: GET_RELATED_PRODUCTS,
        operationName: "GetRelatedProducts",
        variables: {
          slug: variables.slug,
          language: variables.language,
          currency: variables.currency,
          pageNumber,
          itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyRelated;
  const list = data.getRelatedProducts ?? [];
  return { getRelatedProducts: list.slice(0, itemsPerPage) };
}

const emptyFeatured: GetFeaturedProductsData = { getFeaturedProducts: [] };

export async function fetchFeaturedProducts(
  variables: GetFeaturedProductsVariables,
  authToken?: string | null,
): Promise<GetFeaturedProductsData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const data =
    (await graphqlRequest<GetFeaturedProductsData>(
      {
        query: GET_FEATURED_PRODUCTS,
        operationName: "GetFeaturedProducts",
        variables: {
          language: variables.language,
          currency: variables.currency,
          sort: variables.sort,
          pageNumber,
          itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyFeatured;
  const list = data.getFeaturedProducts ?? [];
  return { getFeaturedProducts: list.slice(0, itemsPerPage) };
}

const emptyRecentlyViewed: GetRecentlyViewedProductsData = {
  getRecentlyViewedProducts: [],
};

export async function fetchRecentlyViewedProducts(
  variables: GetRecentlyViewedProductsVariables,
  authToken?: string | null,
): Promise<GetRecentlyViewedProductsData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const data =
    (await graphqlRequest<GetRecentlyViewedProductsData>(
      {
        query: GET_RECENTLY_VIEWED_PRODUCTS,
        operationName: "GetRecentlyViewedProducts",
        variables: {
          language: variables.language,
          currency: variables.currency,
          pageNumber,
          itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyRecentlyViewed;
  const list = data.getRecentlyViewedProducts ?? [];
  return { getRecentlyViewedProducts: list.slice(0, itemsPerPage) };
}

const emptyProduct: GetProductData = { getProduct: null };

export async function fetchProduct(
  variables: GetProductVariables,
  authToken?: string | null,
): Promise<GetProductData> {
  const isServer = typeof window === "undefined";
  const slug = String(variables.slug ?? "").trim();
  return (
    (await graphqlRequest<GetProductData>(
      {
        query: GET_PRODUCT,
        operationName: "GetProduct",
        variables: variables as Record<string, unknown>,
      },
      {
        authToken,
        ...(isServer
          ? {
              nextCache: {
                revalidate: PRODUCT_DETAIL_REVALIDATE_SECONDS,
                tags: [
                  "catalog-product",
                  "shop-product",
                  ...(slug ? [`product-${slug}`] : []),
                ],
              },
            }
          : {}),
      },
    )) ?? emptyProduct
  );
}

/**
 * Typical variables: `{ "slug": "iphones", "language": "en", "currency": "qar", "pageNumber": 1, "itemsPerPage": 5 }`.
 * When `pageNumber` / `itemsPerPage` are omitted, defaults are **1** and **5**. Response length is capped like other product lists.
 */
export async function fetchProductsByCategory(
  variables: GetProductsByCategoryVariables,
  authToken?: string | null,
): Promise<GetProductsByCategoryData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const sort = variables.sort ?? PRODUCT_SEARCH_SORT.BEST_MATCH;
  const data = (await graphqlRequest<GetProductsByCategoryData>(
    {
      query: GET_PRODUCTS_BY_CATEGORY,
      operationName: "GetProductsByCategory",
      variables: {
        slug: variables.slug,
        language: variables.language,
        currency: variables.currency,
        sort,
        pageNumber,
        itemsPerPage,
      } as Record<string, unknown>,
    },
    { authToken },
  )) ?? { getProductsByCategory: [] };
  const list = data.getProductsByCategory ?? [];
  return { getProductsByCategory: list.slice(0, itemsPerPage) };
}

/**
 * Same as {@link fetchProductsByCategory} but for multiple category slugs (`getProductsByCategories`).
 */
export async function fetchProductsByCategories(
  variables: GetProductsByCategoriesVariables,
  authToken?: string | null,
): Promise<GetProductsByCategoriesData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const sort = variables.sort ?? PRODUCT_SEARCH_SORT.BEST_MATCH;
  const data = (await graphqlRequest<GetProductsByCategoriesData>(
    {
      query: GET_PRODUCTS_BY_CATEGORIES,
      operationName: "GetProductsByCategories",
      variables: {
        slugs: variables.slugs,
        language: variables.language,
        currency: variables.currency,
        sort,
        pageNumber,
        itemsPerPage,
      } as Record<string, unknown>,
    },
    { authToken },
  )) ?? { getProductsByCategories: [] };
  const list = data.getProductsByCategories ?? [];
  return { getProductsByCategories: list.slice(0, itemsPerPage) };
}

/**
 * Paginated catalog `getProducts`. When `pageNumber` / `itemsPerPage` are omitted, defaults are **1** and **5**.
 * Outgoing `itemsPerPage` is capped at {@link PRODUCT_LIST_MAX_ITEMS_PER_PAGE}; the result list is sliced to the same length.
 */
export async function fetchProducts(
  variables: GetProductsVariables = {},
  authToken?: string | null,
): Promise<GetProductsData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const sort = variables.sort ?? PRODUCT_SEARCH_SORT.BEST_MATCH;
  const data = (await graphqlRequest<GetProductsData>(
    {
      query: GET_PRODUCTS,
      operationName: "GetProducts",
      variables: {
        language: variables.language,
        currency: variables.currency,
        sort,
        pageNumber,
        itemsPerPage,
      } as Record<string, unknown>,
    },
    { authToken },
  )) ?? { getProducts: [] };
  const list = data.getProducts ?? [];
  return { getProducts: list.slice(0, itemsPerPage) };
}

const emptyFeaturedCampaign: GetProductsInFeaturedCampaignData = {
  getProductsInFeaturedCampaign: [],
};

/**
 * Products in the site's featured campaign (`getProductsInFeaturedCampaign`).
 * Sort options match {@link PRODUCT_CATALOG_SORT_OPTIONS}; defaults to `best-match`.
 */
export async function fetchProductsInFeaturedCampaign(
  variables: GetProductsInFeaturedCampaignVariables = {},
  authToken?: string | null,
): Promise<GetProductsInFeaturedCampaignData> {
  const pageNumber = variables.pageNumber ?? DEFAULT_PRODUCTS_BY_CATEGORY_PAGE;
  const itemsPerPage = clampProductListItemsPerPage(
    variables.itemsPerPage,
    DEFAULT_PRODUCTS_BY_CATEGORY_PAGE_SIZE,
  );
  const sort = variables.sort ?? PRODUCT_SEARCH_SORT.BEST_MATCH;
  const data =
    (await graphqlRequest<GetProductsInFeaturedCampaignData>(
      {
        query: GET_PRODUCTS_IN_FEATURED_CAMPAIGN,
        operationName: "GetProductsInFeaturedCampaign",
        variables: {
          language: variables.language,
          currency: variables.currency,
          sort,
          pageNumber,
          itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyFeaturedCampaign;
  const list = data.getProductsInFeaturedCampaign ?? [];
  return { getProductsInFeaturedCampaign: list.slice(0, itemsPerPage) };
}

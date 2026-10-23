import { clampProductListItemsPerPage } from "./constants/productListPageSize";
import { PRODUCT_POPULAR_SORT } from "./constants/productSearchSort";
import { graphqlRequest } from "./client";
import { gqlProductToCarouselProduct } from "./mappers/gqlProductToCarousel";
import {
  GET_POPULAR_PRODUCTS,
  GET_RECOMMENDED_PRODUCTS,
  GET_RELATED_PRODUCTS,
} from "./queries/products";
import type {
  GetPopularProductsData,
  GetRecommendedProductsData,
  GetRelatedProductsData,
} from "./types/responses";

type ListOpts = {
  language: string;
  currency: string;
  pageNumber?: number;
  itemsPerPage?: number;
};

function currencyCode(c: string) {
  return String(c || "qar").toLowerCase();
}

export async function loadPopularCarouselProducts(
  opts: ListOpts,
  authToken?: string | null,
) {
  const itemsPerPage = clampProductListItemsPerPage(opts.itemsPerPage);
  const data = (await graphqlRequest<GetPopularProductsData>(
    {
      query: GET_POPULAR_PRODUCTS,
      operationName: "GetPopularProducts",
      variables: {
        language: opts.language,
        currency: currencyCode(opts.currency),
        sort: PRODUCT_POPULAR_SORT.MOST_VIEWED,
        pageNumber: opts.pageNumber ?? 1,
        itemsPerPage,
      },
    },
    { authToken: authToken ?? undefined },
  )) ?? { getPopularProducts: [] };
  const list = (data.getPopularProducts ?? []).slice(0, itemsPerPage);
  return list.map(gqlProductToCarouselProduct);
}

type SlugListOpts = ListOpts & {
  slug: string;
  excludeSlug?: string | null;
};

export async function loadRecommendedCarouselProducts(
  opts: SlugListOpts,
  authToken?: string | null,
) {
  const itemsPerPage = clampProductListItemsPerPage(opts.itemsPerPage);
  const data = (await graphqlRequest<GetRecommendedProductsData>(
    {
      query: GET_RECOMMENDED_PRODUCTS,
      operationName: "GetRecommendedProducts",
      variables: {
        slug: opts.slug,
        language: opts.language,
        currency: currencyCode(opts.currency),
        pageNumber: opts.pageNumber ?? 1,
        itemsPerPage,
      },
    },
    { authToken: authToken ?? undefined },
  )) ?? { getRecommendedProducts: [] };
  let list = (data.getRecommendedProducts ?? []).slice(0, itemsPerPage);
  if (opts.excludeSlug) {
    list = list.filter((p) => p.slug !== opts.excludeSlug);
  }
  return list.slice(0, itemsPerPage).map(gqlProductToCarouselProduct);
}

export async function loadRelatedCarouselProducts(
  opts: SlugListOpts,
  authToken?: string | null,
) {
  const itemsPerPage = clampProductListItemsPerPage(opts.itemsPerPage);
  const data = (await graphqlRequest<GetRelatedProductsData>(
    {
      query: GET_RELATED_PRODUCTS,
      operationName: "GetRelatedProducts",
      variables: {
        slug: opts.slug,
        language: opts.language,
        currency: currencyCode(opts.currency),
        pageNumber: opts.pageNumber ?? 1,
        itemsPerPage,
      },
    },
    { authToken: authToken ?? undefined },
  )) ?? { getRelatedProducts: [] };
  let list = (data.getRelatedProducts ?? []).slice(0, itemsPerPage);
  if (opts.excludeSlug) {
    list = list.filter((p) => p.slug !== opts.excludeSlug);
  }
  return list.slice(0, itemsPerPage).map(gqlProductToCarouselProduct);
}

"use client";
import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useCart } from "@/componentsedit/context/CartContext";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  fetchFeaturedProducts,
  fetchPopularProducts,
  fetchProducts,
  fetchProductsByCategory,
  fetchRecommendedProducts,
  fetchRelatedProducts,
  fetchSearchProducts,
  PRODUCT_POPULAR_SORT,
  PRODUCT_SEARCH_SORT,
  resolveSortSelectValue,
  type ProductListSortMode,
  type ProductListSortValue,
} from "@/services/graphql";
import { fetchThisMonthProducts } from "@/lib/home/thisMonthProducts";
import {
  parseShopCollection,
  SHOP_COLLECTION_PRODUCT_QUERY_KEY,
  SHOP_COLLECTION_QUERY_KEY,
  shopCollectionTitleKey,
} from "@/lib/shop/shopCollection";
import { PRODUCT_LIST_MAX_ITEMS_PER_PAGE, hasMoreProductListPages } from "@/services/graphql/constants/productListPageSize";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import ProductGrid, {
  productGridClassName,
} from "@/componentsedit/products/ProductGrid";
import ProductListSortSelect from "@/componentsedit/products/ProductListSortSelect";
import ShopPageListHeading from "./ShopPageListHeading";
import { PAGE_CONTENT_INNER_CLASS } from "@/lib/layout/pageContentLayout";
import { localeCurrencyCacheKey } from "@/lib/home/homeCarouselClientSync";
import { useProductListSessionRestore } from "@/hooks/useProductListSessionRestore";
import {
  trackGtmSearchResults,
  useGtmItemList,
} from "@/componentsedit/analytics/gtmDiscovery";

const SHOP_PRODUCT_LIST_ID = "shop";

/** Shop listing: GraphQL only (`searchProducts` / `getProductsByCategory` / `getProducts`). */
export default function AllProducts() {
  const { addToCart: addToCartContext } = useCart();
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const searchParams = useSearchParams();
  const querySignature = searchParams.toString();
  const pathname = usePathname();
  const router = useRouter();

  const listingQuery = useMemo(() => {
    const sp = new URLSearchParams(querySignature);
    const searchTerm = (sp.get("search") || sp.get("q") || "").trim();
    const category = (sp.get("category") || "").trim();
    const minPrice = (sp.get("minPrice") || "").trim();
    const maxPrice = (sp.get("maxPrice") || "").trim();
    const colour = (sp.get("colour") || "").trim();
    const size = (sp.get("size") || "").trim();
    const gender = (sp.get("gender") || "").trim();
    const sale = (sp.get("sale") || "").trim();
    const sort = (sp.get("sort") || "").trim();
    const collection = parseShopCollection(sp.get(SHOP_COLLECTION_QUERY_KEY));
    const productSlug = (sp.get(SHOP_COLLECTION_PRODUCT_QUERY_KEY) || "").trim();
    const hasQueryFilters = Boolean(
      searchTerm ||
      category ||
      minPrice ||
      maxPrice ||
      colour ||
      size ||
      gender ||
      sale ||
      sort ||
      collection,
    );
    return {
      searchTerm,
      category,
      minPrice,
      maxPrice,
      colour,
      size,
      gender,
      sale,
      sort,
      collection,
      productSlug,
      hasQueryFilters,
    };
  }, [querySignature]);

  const {
    sessionBoot,
    persist,
    clearSession,
    restoreScrollAfterPaint,
    consumeInitialFetchSkip,
  } = useProductListSessionRestore({
    listId: SHOP_PRODUCT_LIST_ID,
    queryKey: querySignature,
    locale,
    currency,
  });

  const [products, setProducts] = useState<CarouselProduct[]>(
    () => sessionBoot?.products ?? [],
  );
  const [loading, setLoading] = useState(() => !sessionBoot);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => sessionBoot?.page ?? 1);
  /** When listing comes from GraphQL, total count is unknown — use next-page heuristic. */
  const [graphqlHasMore, setGraphqlHasMore] = useState(
    () => sessionBoot?.hasMore ?? false,
  );
  const perPage = PRODUCT_LIST_MAX_ITEMS_PER_PAGE;
  const prevQueryRef = useRef<string | null>(null);
  const prevLocaleCurrencyRef = useRef<string | null>(null);

  const sortMode: ProductListSortMode = listingQuery.searchTerm
    ? "search"
    : listingQuery.collection === "popular"
      ? "popular"
      : "catalog";

  const sortSelectValue = useMemo(
    () => resolveSortSelectValue(listingQuery.sort || undefined, sortMode),
    [listingQuery.sort, sortMode],
  );

  const handleSortChange = useCallback(
    (next: ProductListSortValue) => {
      const params = new URLSearchParams(querySignature);
      const isDefault =
        (sortMode === "popular" && next === PRODUCT_POPULAR_SORT.MOST_VIEWED) ||
        (sortMode !== "popular" && next === PRODUCT_SEARCH_SORT.BEST_MATCH);
      if (isDefault) {
        params.delete("sort");
      } else {
        params.set("sort", next);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, querySignature, router, sortMode],
  );

  useLayoutEffect(() => {
    if (prevQueryRef.current === null) {
      prevQueryRef.current = querySignature;
      return;
    }
    if (prevQueryRef.current === querySignature) return;
    prevQueryRef.current = querySignature;
    clearSession();
    setCurrentPage(1);
    setProducts([]);
    setGraphqlHasMore(false);
  }, [querySignature, clearSession]);

  useLayoutEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    if (prevLocaleCurrencyRef.current === null) {
      prevLocaleCurrencyRef.current = key;
      return;
    }
    if (prevLocaleCurrencyRef.current === key) return;
    prevLocaleCurrencyRef.current = key;
    clearSession();
    setCurrentPage(1);
    setProducts([]);
    setGraphqlHasMore(false);
  }, [locale, currency, clearSession]);

  useEffect(() => {
    if (loading || products.length === 0) return;
    persist({ products, page: currentPage, hasMore: graphqlHasMore });
  }, [products, currentPage, graphqlHasMore, loading, persist]);

  useEffect(() => {
    if (!loading && !loadingMore) {
      restoreScrollAfterPaint();
    }
  }, [loading, loadingMore, restoreScrollAfterPaint]);

  useEffect(() => {
    const run = async () => {
      if (consumeInitialFetchSkip()) {
        restoreScrollAfterPaint();
        return;
      }
      const isFirstPage = currentPage === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const { searchTerm, category, sort, collection, productSlug } = listingQuery;

        const ambiguous = Boolean(searchTerm && category);

        const language = locale === "ar" ? "ar" : "en";
        const currencyCode = String(currency || "QAR").toLowerCase();
        const token = Cookies.get("token") ?? null;
        const listVariables = {
          language,
          currency: currencyCode,
          pageNumber: currentPage,
          itemsPerPage: perPage,
        };

        let list: CarouselProduct[] = [];

        if (searchTerm || ambiguous) {
          const q = ambiguous ? `${searchTerm} ${category}`.trim() : searchTerm;
          const searchSort = resolveSortSelectValue(sort || undefined, "search");
          const { searchProducts } = await fetchSearchProducts(
            {
              query: q,
              language,
              currency: currencyCode,
              sort: searchSort,
              pageNumber: currentPage,
              itemsPerPage: perPage,
            },
            token,
          );
          list = (searchProducts ?? []).map(gqlProductToCarouselProduct);
          trackGtmSearchResults(q, list);
        } else if (category) {
          const catalogSort = resolveSortSelectValue(sort || undefined, "catalog");
          const { getProductsByCategory } = await fetchProductsByCategory(
            {
              slug: category,
              language,
              currency: currencyCode,
              sort: catalogSort,
              pageNumber: currentPage,
              itemsPerPage: perPage,
            },
            token,
          );
          list = (getProductsByCategory ?? []).map(gqlProductToCarouselProduct);
        } else if (collection === "popular") {
          const popularSort = resolveSortSelectValue(sort || undefined, "popular");
          const { getPopularProducts } = await fetchPopularProducts(
            {
              ...listVariables,
              sort: popularSort,
            },
            token,
          );
          list = (getPopularProducts ?? []).map(gqlProductToCarouselProduct);
        } else if (collection === "featured") {
          const catalogSort = resolveSortSelectValue(sort || undefined, "catalog");
          const { getFeaturedProducts } = await fetchFeaturedProducts(
            {
              ...listVariables,
              sort: catalogSort,
            },
            token,
          );
          list = (getFeaturedProducts ?? []).map(gqlProductToCarouselProduct);
        } else if (collection === "thisMonth") {
          const monthProducts = await fetchThisMonthProducts(listVariables, token);
          list = monthProducts.map(gqlProductToCarouselProduct);
        } else if (collection === "related") {
          if (productSlug) {
            const { getRelatedProducts } = await fetchRelatedProducts(
              { slug: productSlug, ...listVariables },
              token,
            );
            list = (getRelatedProducts ?? [])
              .filter((p) => p.slug !== productSlug)
              .map(gqlProductToCarouselProduct);
          }
          if (!list.length) {
            const { getPopularProducts } = await fetchPopularProducts(listVariables, token);
            list = (getPopularProducts ?? []).map(gqlProductToCarouselProduct);
          }
        } else if (collection === "recommended") {
          if (productSlug) {
            const { getRecommendedProducts } = await fetchRecommendedProducts(
              { slug: productSlug, ...listVariables },
              token,
            );
            list = (getRecommendedProducts ?? [])
              .filter((p) => p.slug !== productSlug)
              .map(gqlProductToCarouselProduct);
          }
          if (!list.length) {
            const { getPopularProducts } = await fetchPopularProducts(listVariables, token);
            list = (getPopularProducts ?? []).map(gqlProductToCarouselProduct);
          }
        } else {
          const catalogSort = resolveSortSelectValue(sort || undefined, "catalog");
          const { getProducts } = await fetchProducts(
            {
              language,
              currency: currencyCode,
              sort: catalogSort,
              pageNumber: currentPage,
              itemsPerPage: perPage,
            },
            token,
          );
          list = (getProducts ?? []).map(gqlProductToCarouselProduct);
        }

        setProducts((prev) => (isFirstPage ? list : [...prev, ...list]));
        setGraphqlHasMore(
          hasMoreProductListPages(list.length, perPage, isFirstPage),
        );
      } catch (error) {
        console.error("Error fetching products:", error);
        if (isFirstPage) setProducts([]);
        setGraphqlHasMore(false);
      } finally {
        if (isFirstPage) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };
    void run();
  }, [
    currentPage,
    locale,
    currency,
    querySignature,
    listingQuery,
    consumeInitialFetchSkip,
    restoreScrollAfterPaint,
    perPage,
  ]);

  async function handleAddToCart(product: CarouselProduct) {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCartContext(ref, 1);
  }

  const shopPageTitle = useMemo(() => {
    if (listingQuery.searchTerm) return t("shopPageHeadingSearchResults");
    if (listingQuery.collection) {
      return t(shopCollectionTitleKey(listingQuery.collection));
    }
    return t("shop");
  }, [listingQuery.collection, listingQuery.searchTerm, t]);

  const showSortControl =
    !listingQuery.collection ||
    listingQuery.collection === "featured" ||
    listingQuery.collection === "popular";
  const itemList = useMemo(() => {
    if (listingQuery.searchTerm) {
      return {
        itemListId: `search:${listingQuery.searchTerm}`,
        itemListName: `Search: ${listingQuery.searchTerm}`,
      };
    }
    if (listingQuery.category) {
      return {
        itemListId: `shop-category:${listingQuery.category}`,
        itemListName: listingQuery.category,
        category: listingQuery.category,
      };
    }
    const collection = listingQuery.collection || "all";
    return {
      itemListId: `shop:${collection}`,
      itemListName: shopPageTitle,
    };
  }, [
    listingQuery.category,
    listingQuery.collection,
    listingQuery.searchTerm,
    shopPageTitle,
  ]);
  useGtmItemList(products, itemList, !loading);

  return (
    <div className="w-full mt-16 min-h-screen px-4 md:px-10 pb-10 sm:pb-12 lg:pb-14">
      <div className={PAGE_CONTENT_INNER_CLASS}>
        <div className="mt-8 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <ShopPageListHeading title={shopPageTitle} />
          </div>
          {showSortControl ? (
            <ProductListSortSelect
              mode={sortMode}
              value={sortSelectValue}
              onChange={handleSortChange}
            />
          ) : null}
        </div>
        {loading ? (
          // Skeleton Loader
          <div className={`mt-10 ${productGridClassName}`}>
            {Array.from({ length: perPage }).map((_, index) => (
              <div
                key={index}
                className="w-full min-w-0 p-4 border rounded-2xl border-gray-200 shadow animate-pulse md:p-6 dark:border-gray-400"
              >
                <div className="flex items-center justify-center h-48 mb-4 bg-gray-300 rounded dark:bg-gray-400" />
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-400"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="mt-10 text-center font-sans text-sm text-black/70">
            {t("noProductsFound")}
          </p>
        ) : (
          <>
            <div className="flex-1 mt-10 flex w-full flex-col">
              <ProductGrid>
                {products.map((product, index) => {
                  const pid = product.id ?? index;
                  return (
                    <ProductCarouselCard
                      key={`${String(pid)}-${index}`}
                      product={product}
                      onAddToCart={handleAddToCart}
                      itemList={itemList}
                      itemIndex={index}
                    />
                  );
                })}
              </ProductGrid>
            </div>

            {graphqlHasMore ? (
              <div className="mb-2 mt-8 flex justify-center sm:mb-3 sm:mt-10">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={loadingMore}
                  className="min-h-[48px] min-w-[180px] rounded-full border border-[#CB262E] bg-[#CB262E] px-8 py-3 font-sans text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-white hover:text-[#CB262E] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[220px]"
                >
                  {loadingMore ? t("loadingMore") : t("loadMore")}
                </button>
              </div>
            ) : (
              <p className="mb-2 mt-8 text-center font-sans text-sm text-black/45 sm:mb-3 sm:mt-10">
                {t("noMoreProducts")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

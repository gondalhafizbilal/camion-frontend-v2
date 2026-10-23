"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import Cookies from "js-cookie";
import {
  fetchProductsByCategory,
  PRODUCT_SEARCH_SORT,
  type ProductListSortValue,
  type ProductSearchSort,
} from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import { useParams } from "next/navigation";
import { useCart } from "@/componentsedit/context/CartContext";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import ProductGrid, {
  productGridClassName,
} from "@/componentsedit/products/ProductGrid";
import ProductListSortSelect from "@/componentsedit/products/ProductListSortSelect";
import { PRODUCT_LIST_MAX_ITEMS_PER_PAGE, hasMoreProductListPages } from "@/services/graphql/constants/productListPageSize";
import Roadmap from "@/componentsedit/Roadmap";
import type { CategoryNavItem } from "@/types/checkoutDisplay";
import {
  PAGE_CONTENT_INNER_CLASS,
  PAGE_SECTION_X_PADDING_CLASS,
} from "@/lib/layout/pageContentLayout";
import { localeCurrencyCacheKey } from "@/lib/home/homeCarouselClientSync";
import { useProductListSessionRestore } from "@/hooks/useProductListSessionRestore";
import {
  useGtmItemList,
  useGtmViewCategory,
} from "@/componentsedit/analytics/gtmDiscovery";

const CATEGORY_PRODUCT_LIST_ID = "category";

export default function CategoriesProdect({
  categories: _categories = [],
  initialCategoryName,
  initialProducts,
  initialHasMore,
}: {
  categories?: CategoryNavItem[];
  /** Localized category name from SSR (indexable). */
  initialCategoryName?: string;
  /** First product page from SSR for crawlers / fast paint. */
  initialProducts?: CarouselProduct[];
  initialHasMore?: boolean;
} = {}) {
  void _categories;
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const params = useParams();
  const categorySlug = String(params?.slug ?? "");
  const { addToCart: addToCartContext } = useCart();
  const {
    sessionBoot,
    persist,
    clearSession,
    restoreScrollAfterPaint,
    consumeInitialFetchSkip,
  } = useProductListSessionRestore({
    listId: CATEGORY_PRODUCT_LIST_ID,
    queryKey: categorySlug,
    locale,
    currency,
  });
  const ssrProducts = initialProducts ?? [];
  const hasSsrSeed = !sessionBoot && ssrProducts.length > 0;
  const ssrFirstPageConsumedRef = useRef(false);
  const [sort, setSort] = useState<ProductSearchSort>(() => {
    const saved = sessionBoot?.filtersKey;
    if (saved && Object.values(PRODUCT_SEARCH_SORT).includes(saved as ProductSearchSort)) {
      return saved as ProductSearchSort;
    }
    return PRODUCT_SEARCH_SORT.BEST_MATCH;
  });
  const [products, setProducts] = useState<CarouselProduct[]>(
    () => sessionBoot?.products ?? ssrProducts,
  );
  const [loading, setLoading] = useState(() => !(sessionBoot || hasSsrSeed));
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => sessionBoot?.page ?? 1);
  const [hasMore, setHasMore] = useState(
    () => sessionBoot?.hasMore ?? Boolean(initialHasMore && hasSsrSeed),
  );
  const perPage = PRODUCT_LIST_MAX_ITEMS_PER_PAGE;
  const prevSlugRef = useRef<string | null>(null);
  const prevLocaleCurrencyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (prevSlugRef.current === null) {
      prevSlugRef.current = categorySlug;
      return;
    }
    if (prevSlugRef.current === categorySlug) return;
    prevSlugRef.current = categorySlug;
    clearSession();
    // Soft navigations keep this component mounted; always refetch for the new slug
    // (SSR seed applies to the first hard load only).
    ssrFirstPageConsumedRef.current = true;
    setProducts([]);
    setCurrentPage(1);
    setHasMore(false);
    setLoading(true);
    setSort(PRODUCT_SEARCH_SORT.BEST_MATCH);
  }, [categorySlug, clearSession]);

  useLayoutEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    if (prevLocaleCurrencyRef.current === null) {
      prevLocaleCurrencyRef.current = key;
      return;
    }
    if (prevLocaleCurrencyRef.current === key) return;
    prevLocaleCurrencyRef.current = key;
    ssrFirstPageConsumedRef.current = true;
    clearSession();
    setProducts([]);
    setCurrentPage(1);
    setHasMore(false);
  }, [locale, currency, clearSession]);

  function handleSortChange(next: ProductListSortValue) {
    clearSession();
    ssrFirstPageConsumedRef.current = true;
    setCurrentPage(1);
    setProducts([]);
    setHasMore(false);
    setSort(next as ProductSearchSort);
  }

  useEffect(() => {
    if (loading || products.length === 0) return;
    persist({ products, page: currentPage, hasMore, filtersKey: sort });
  }, [products, currentPage, hasMore, sort, loading, persist]);

  useEffect(() => {
    if (!loading && !loadingMore) {
      restoreScrollAfterPaint();
    }
  }, [loading, loadingMore, restoreScrollAfterPaint]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categorySlug) return;
      if (consumeInitialFetchSkip()) {
        restoreScrollAfterPaint();
        return;
      }
      // Keep SSR first page when still on page 1 with default sort (avoids double fetch).
      if (
        currentPage === 1 &&
        sort === PRODUCT_SEARCH_SORT.BEST_MATCH &&
        hasSsrSeed &&
        !ssrFirstPageConsumedRef.current
      ) {
        ssrFirstPageConsumedRef.current = true;
        setLoading(false);
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
        const language = locale === "ar" ? "ar" : "en";
        const currencyCode = String(currency || "QAR").toLowerCase();
        const token = Cookies.get("token") ?? null;
        const { getProductsByCategory } = await fetchProductsByCategory(
          {
            slug: String(categorySlug || ""),
            language,
            currency: currencyCode,
            sort,
            pageNumber: currentPage,
            itemsPerPage: perPage,
          },
          token,
        );
        const list = (getProductsByCategory ?? []).map(
          gqlProductToCarouselProduct,
        );
        setProducts((prev) => (isFirstPage ? list : [...prev, ...list]));
        setHasMore(hasMoreProductListPages(list.length, perPage, isFirstPage));
      } catch (error) {
        console.error("Error fetching products:", error);
        if (isFirstPage) setProducts([]);
        setHasMore(false);
      } finally {
        if (isFirstPage) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };

    if (categorySlug) {
      void fetchProducts();
    }
  }, [
    categorySlug,
    locale,
    currentPage,
    currency,
    sort,
    consumeInitialFetchSkip,
    restoreScrollAfterPaint,
    perPage,
    hasSsrSeed,
  ]);

  async function handleAddToCart(product: CarouselProduct) {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCartContext(ref, 1);
  }

  const categoryLabel =
    initialCategoryName?.trim() ||
    _categories.find((c) => c?.slug === categorySlug)?.name?.trim() ||
    decodeURIComponent(String(categorySlug || "")).replace(/-/g, " ");
  const itemList = {
    itemListId: `category:${categorySlug}`,
    itemListName: categoryLabel,
    category: categoryLabel,
  };
  useGtmViewCategory({
    category: categoryLabel,
    products,
    enabled: !loading,
  });
  useGtmItemList(products, itemList, !loading);

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: categoryLabel },
  ].filter((item) => item.label);

  return (
    <div
      className={`w-full mt-10 pb-10 sm:pb-12 lg:pb-14 sm:mt-16 min-h-screen ${PAGE_SECTION_X_PADDING_CLASS}`}
    >
      <div className={`${PAGE_CONTENT_INNER_CLASS} flex flex-col gap-4`}>
        <h1 className="sr-only">{categoryLabel}</h1>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <Roadmap items={breadcrumbItems} />
          <ProductListSortSelect value={sort} onChange={handleSortChange} />
        </div>

        {loading ? (
          <div className={productGridClassName}>
            {Array.from({ length: 12 }).map((_, index) => (
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
          <div className="min-h-[300px] text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              {t("noProductsFound")}
            </h2>
            <p className="text-gray-500">{t("noProductsMatchingCriteria")}</p>
          </div>
        ) : (
          <>
            <ProductGrid>
              {products.map((product, index) => {
                const pid = product.id ?? "";
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

            {hasMore ? (
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

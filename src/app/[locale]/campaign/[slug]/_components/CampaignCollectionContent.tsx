"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Cookies from "js-cookie";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import {
  fetchProductsInFeaturedCampaign,
  PRODUCT_SEARCH_SORT,
  type ProductListSortValue,
  type ProductSearchSort,
} from "@/services/graphql";
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
import { PRODUCT_LIST_MAX_ITEMS_PER_PAGE, hasMoreProductListPages } from "@/services/graphql/constants/productListPageSize";
import Roadmap from "@/componentsedit/Roadmap";
import {
  campaignSlugMatchesRoute,
  resolveCampaignFromProducts,
} from "@/lib/campaign/campaignCollection";
import { CAMPAIGN_HEADER_GRADIENT } from "@/lib/styles/campaignGradient";
import {
  PAGE_CONTENT_INNER_CLASS,
  PAGE_SECTION_X_PADDING_CLASS,
} from "@/lib/layout/pageContentLayout";
import { localeCurrencyCacheKey } from "@/lib/home/homeCarouselClientSync";
import { useProductListSessionRestore } from "@/hooks/useProductListSessionRestore";
import { useGtmItemList } from "@/componentsedit/analytics/gtmDiscovery";

const CAMPAIGN_PRODUCT_LIST_ID = "campaign";

export default function CampaignCollectionContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const params = useParams();
  const routeSlug = String(params?.slug ?? "");
  const { addToCart: addToCartContext } = useCart();
  const {
    sessionBoot,
    persist,
    clearSession,
    restoreScrollAfterPaint,
    consumeInitialFetchSkip,
  } = useProductListSessionRestore({
    listId: CAMPAIGN_PRODUCT_LIST_ID,
    queryKey: routeSlug,
    locale,
    currency,
  });
  const [sort, setSort] = useState<ProductSearchSort>(() => {
    const saved = sessionBoot?.filtersKey;
    if (saved && Object.values(PRODUCT_SEARCH_SORT).includes(saved as ProductSearchSort)) {
      return saved as ProductSearchSort;
    }
    return PRODUCT_SEARCH_SORT.BEST_MATCH;
  });
  const [products, setProducts] = useState<CarouselProduct[]>(
    () => sessionBoot?.products ?? [],
  );
  const [loading, setLoading] = useState(() => !sessionBoot);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => sessionBoot?.page ?? 1);
  const [hasMore, setHasMore] = useState(() => sessionBoot?.hasMore ?? false);
  const [slugMismatch, setSlugMismatch] = useState(false);
  const perPage = PRODUCT_LIST_MAX_ITEMS_PER_PAGE;
  const prevSlugRef = useRef<string | null>(null);
  const prevLocaleCurrencyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (prevSlugRef.current === null) {
      prevSlugRef.current = routeSlug;
      return;
    }
    if (prevSlugRef.current === routeSlug) return;
    prevSlugRef.current = routeSlug;
    clearSession();
    setProducts([]);
    setCurrentPage(1);
    setHasMore(false);
    setSlugMismatch(false);
    setSort(PRODUCT_SEARCH_SORT.BEST_MATCH);
  }, [routeSlug, clearSession]);

  useLayoutEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    if (prevLocaleCurrencyRef.current === null) {
      prevLocaleCurrencyRef.current = key;
      return;
    }
    if (prevLocaleCurrencyRef.current === key) return;
    prevLocaleCurrencyRef.current = key;
    clearSession();
    setProducts([]);
    setCurrentPage(1);
    setHasMore(false);
  }, [locale, currency, clearSession]);

  function handleSortChange(next: ProductListSortValue) {
    clearSession();
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
    if (!routeSlug) return;

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
        const language = locale === "ar" ? "ar" : "en";
        const currencyCode = String(currency || "QAR").toLowerCase();
        const token = Cookies.get("token") ?? null;
        const { getProductsInFeaturedCampaign } = await fetchProductsInFeaturedCampaign(
          {
            language,
            currency: currencyCode,
            sort,
            pageNumber: currentPage,
            itemsPerPage: perPage,
          },
          token,
        );
        const list = (getProductsInFeaturedCampaign ?? []).map(gqlProductToCarouselProduct);

        if (isFirstPage) {
          const campaign = resolveCampaignFromProducts(list);
          const campaignSlug = campaign?.slug;
          if (
            list.length > 0 &&
            campaignSlug &&
            !campaignSlugMatchesRoute(campaignSlug, routeSlug)
          ) {
            setSlugMismatch(true);
            setProducts([]);
            setHasMore(false);
            return;
          }
        }

        setProducts((prev) => (isFirstPage ? list : [...prev, ...list]));
        setHasMore(hasMoreProductListPages(list.length, perPage, isFirstPage));
      } catch (error) {
        console.error("Error fetching campaign products:", error);
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

    void run();
  }, [
    routeSlug,
    locale,
    currentPage,
    currency,
    sort,
    consumeInitialFetchSkip,
    restoreScrollAfterPaint,
    perPage,
  ]);

  useEffect(() => {
    if (slugMismatch) notFound();
  }, [slugMismatch]);

  const campaign = useMemo(() => resolveCampaignFromProducts(products), [products]);
  const campaignTitle =
    campaign?.name?.trim() ||
    decodeURIComponent(routeSlug).replace(/-/g, " ") ||
    t("featuredCampaign");
  const campaignBrief = campaign?.brief?.trim() || "";
  const itemList = {
    itemListId: `campaign:${routeSlug}`,
    itemListName: campaignTitle,
  };
  useGtmItemList(products, itemList, !loading && !slugMismatch);

  async function handleAddToCart(product: CarouselProduct) {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCartContext(ref, 1);
  }

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: campaignTitle },
  ].filter((item) => item.label);

  return (
    <div
      className={`w-full mt-10 pb-10 sm:pb-12 lg:pb-14 sm:mt-16 min-h-screen ${PAGE_SECTION_X_PADDING_CLASS}`}
    >
      <div className={`${PAGE_CONTENT_INNER_CLASS} flex flex-col gap-4`}>
        <Roadmap items={breadcrumbItems} />

        <div className="rounded-2xl bg-[#F3F4F6] px-4 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-white sm:h-10 sm:w-10"
              style={{ background: CAMPAIGN_HEADER_GRADIENT }}
              aria-hidden
            >
              ⚡
            </span>
            <div className="min-w-0">
              <h1
                className="text-lg font-bold leading-tight text-gray-900 sm:text-xl"
                style={{
                  fontFamily:
                    "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                }}
              >
                {campaignTitle}
              </h1>
              {campaignBrief ? (
                <p className="mt-1 text-sm text-gray-600">{campaignBrief}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex w-full justify-end">
          <ProductListSortSelect mode="catalog" value={sort} onChange={handleSortChange} />
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useTranslations, useLocale } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import {
  ensureGuestSessionIfNeeded,
  waitForClientAuthToken,
} from "@/services/auth/guestRegister";
import { fetchProducts, PRODUCT_SEARCH_SORT } from "@/services/graphql";
import { PRODUCT_LIST_MAX_ITEMS_PER_PAGE, hasMoreProductListPages } from "@/services/graphql/constants/productListPageSize";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import ProductGrid, { productGridClassName } from "@/componentsedit/products/ProductGrid";
import { HOME_CONTENT_INNER_CLASS, HOME_SECTION_X_PADDING_CLASS } from "@/componentsedit/home/homeSectionLayout";
import {
  canUseHomeCarouselSsrSeed,
  localeCurrencyCacheKey,
} from "@/lib/home/homeCarouselClientSync";
import {
  CAROUSEL_CARD_HEIGHT_CLASS,
  PRODUCT_GRID_TILE_SHELL_CLASS,
} from "@/lib/styles/carouselCardLayout";
import { useProductListSessionRestore } from "@/hooks/useProductListSessionRestore";
import { useGtmItemList } from "@/componentsedit/analytics/gtmDiscovery";

const SECTION_GAP = 39.73;
const CLIENT_GRID_RETRY_ATTEMPTS = 3;
const CLIENT_GRID_RETRY_DELAY_MS = 450;
const HOME_ALL_PRODUCTS_LIST_ID = "home-all-products";

function HomeAllProductsSectionInner({
  initialProducts,
}: {
  /** Server `HomePage` → `getProducts` page 1; skips first client fetch when set. */
  initialProducts?: CarouselProduct[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { addToCart } = useCart();
  const {
    sessionBoot,
    persist,
    clearSession,
    restoreScrollAfterPaint,
    consumeInitialFetchSkip,
    consumePageFetchSkip,
  } = useProductListSessionRestore({
    listId: HOME_ALL_PRODUCTS_LIST_ID,
    locale,
    currency,
  });
  const [products, setProducts] = useState<CarouselProduct[]>(
    () => sessionBoot?.products ?? initialProducts ?? [],
  );
  const [loading, setLoading] = useState(
    () => !sessionBoot && !(initialProducts?.length ?? 0),
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(() => sessionBoot?.page ?? 1);
  const [hasMore, setHasMore] = useState(() =>
    sessionBoot
      ? sessionBoot.hasMore
      : hasMoreProductListPages(
          initialProducts?.length ?? 0,
          PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
          true,
        ),
  );
  const ssrSeedRef = useRef<CarouselProduct[]>(initialProducts ?? []);
  const localeCurrencySeenRef = useRef<string | null>(null);

  useEffect(() => {
    ssrSeedRef.current = initialProducts ?? [];
  }, [initialProducts]);

  const fetchProductsPage = useCallback(
    async (pageNumber: number, mode: "replace" | "append") => {
      const language = locale === "ar" ? "ar" : "en";
      const currencyCode = String(currency || "QAR").toLowerCase();
      const maxAttempts = pageNumber === 1 ? CLIENT_GRID_RETRY_ATTEMPTS : 1;
      let last: CarouselProduct[] = [];

      void ensureGuestSessionIfNeeded();
      await waitForClientAuthToken({ maxWaitMs: 4_000, pollIntervalMs: 80 });

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const token = Cookies.get("token") ?? null;
          const { getProducts } = await fetchProducts(
            {
              language,
              currency: currencyCode,
              sort: PRODUCT_SEARCH_SORT.BEST_MATCH,
              pageNumber,
              itemsPerPage: PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
            },
            token,
          );
          last = (getProducts ?? []).map(gqlProductToCarouselProduct);
          if (last.length > 0 || pageNumber > 1) break;
        } catch (e) {
          console.error("HomeAllProductsSection: fetch error", e);
        }
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, CLIENT_GRID_RETRY_DELAY_MS));
        }
      }

      if (last.length > 0) {
        setProducts((prev) => (mode === "append" ? [...prev, ...last] : last));
        setHasMore(
          hasMoreProductListPages(
            last.length,
            PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
            mode === "replace",
          ),
        );
      } else if (mode === "replace") {
        setProducts((prev) =>
          prev.length > 0 ? prev : ssrSeedRef.current.length > 0 ? ssrSeedRef.current : [],
        );
        setHasMore(false);
      } else {
        setHasMore(false);
      }
    },
    [locale, currency],
  );

  useEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    const prev = localeCurrencySeenRef.current;
    if (prev === null) {
      localeCurrencySeenRef.current = key;
      if (consumeInitialFetchSkip()) {
        setLoading(false);
        restoreScrollAfterPaint();
        return;
      }
      if (
        canUseHomeCarouselSsrSeed({
          initialProductCount: initialProducts?.length ?? 0,
          currency,
        })
      ) {
        setProducts(initialProducts ?? []);
        setLoading(false);
        setHasMore(
          hasMoreProductListPages(
            initialProducts?.length ?? 0,
            PRODUCT_LIST_MAX_ITEMS_PER_PAGE,
            true,
          ),
        );
        return;
      }
      setLoading(true);
      void fetchProductsPage(1, "replace").finally(() => setLoading(false));
      return;
    }
    if (prev !== key) {
      localeCurrencySeenRef.current = key;
      clearSession();
      setPage(1);
      setLoading(true);
      void fetchProductsPage(1, "replace").finally(() => setLoading(false));
    }
  }, [
    locale,
    currency,
    initialProducts,
    fetchProductsPage,
    consumeInitialFetchSkip,
    restoreScrollAfterPaint,
    clearSession,
  ]);

  useEffect(() => {
    if (loading || products.length === 0) return;
    persist({ products, page, hasMore });
  }, [products, page, hasMore, loading, persist]);

  useEffect(() => {
    if (!loading && !loadingMore) {
      restoreScrollAfterPaint();
    }
  }, [loading, loadingMore, restoreScrollAfterPaint]);

  useEffect(() => {
    if (page <= 1) return;
    if (consumePageFetchSkip()) return;
    let cancelled = false;
    setLoadingMore(true);
    void fetchProductsPage(page, "append").finally(() => {
      if (!cancelled) setLoadingMore(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page, fetchProductsPage, consumePageFetchSkip]);

  const handleAddToCart = useCallback(
    async (product: CarouselProduct) => {
      const ref = carouselProductToCartRef(product);
      if (ref) await addToCart(ref, 1);
    },
    [addToCart],
  );
  const itemList = {
    itemListId: HOME_ALL_PRODUCTS_LIST_ID,
    itemListName: t("homeAllProducts"),
  };
  useGtmItemList(products, itemList, !loading);

  return (
    <section
      className={`w-full flex justify-center pt-8 pb-2 ${HOME_SECTION_X_PADDING_CLASS}`}
    >
      <div
        className={`${HOME_CONTENT_INNER_CLASS} flex flex-col`}
        style={{ gap: SECTION_GAP }}
      >
        <div className="flex flex-row items-center gap-3 sm:gap-4 min-h-10">
          <span
            className="flex-shrink-0 rounded-[4px] w-4 h-9 sm:w-5 sm:h-10"
            style={{ background: "#CB262E" }}
          />
          <span
            className="text-lg sm:text-xl leading-tight"
            style={{
              fontFamily:
                "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              color: "#000000",
            }}
          >
            {t("homeAllProducts")}
          </span>
        </div>

        {loading ? (
          <div className={productGridClassName}>
            {Array.from({ length: PRODUCT_LIST_MAX_ITEMS_PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 rounded border border-black/10 p-3 animate-pulse ${PRODUCT_GRID_TILE_SHELL_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS}`}
              >
                <div className="aspect-[210/372] w-full rounded bg-gray-200" />
                <div className="h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center font-sans text-sm text-black/70 py-8">
            {t("noProductsFound")}
          </p>
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
              <div className="flex justify-center pb-2 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  className="min-h-[48px] min-w-[180px] rounded-full border border-[#CB262E] bg-[#CB262E] px-8 py-3 font-sans text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-white hover:text-[#CB262E] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[220px]"
                >
                  {loadingMore ? t("loadingMore") : t("loadMore")}
                </button>
              </div>
            ) : products.length > 0 && !hasMore ? (
              <p className="pb-2 pt-2 text-center font-sans text-sm text-black/45 sm:pt-4">
                {t("noMoreProducts")}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

/** Full catalog grid on home (`getProducts`) with SSR page 1 + load-more pagination. */
export default function HomeAllProductsSection({
  initialProducts,
}: {
  initialProducts?: CarouselProduct[];
}) {
  return <HomeAllProductsSectionInner initialProducts={initialProducts} />;
}

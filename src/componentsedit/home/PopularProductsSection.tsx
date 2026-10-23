"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import Cookies from "js-cookie";
import { fetchPopularProducts, PRODUCT_POPULAR_SORT } from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import { HOME_CONTENT_INNER_CLASS, HOME_SECTION_X_PADDING_CLASS } from "@/componentsedit/home/homeSectionLayout";
import {
  canUseHomeCarouselSsrSeed,
  localeCurrencyCacheKey,
} from "@/lib/home/homeCarouselClientSync";
import { buildShopCollectionHref } from "@/lib/shop/shopCollection";
import {
  CAROUSEL_CARD_HEIGHT_CLASS,
  CAROUSEL_CARD_WIDTH_CLASS,
  CAROUSEL_TRACK_LOADING_CLASS,
} from "@/lib/styles/carouselCardLayout";
import ProductCarouselTrack from "@/componentsedit/home/ProductCarouselTrack";
import { useGtmItemList } from "@/componentsedit/analytics/gtmDiscovery";

const SECTION_GAP = 39.73;
const CLIENT_CAROUSEL_RETRY_ATTEMPTS = 3;
const CLIENT_CAROUSEL_RETRY_DELAY_MS = 450;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PopularProductsSection({
  initialProducts,
}: {
  /** Server GraphQL `getPopularProducts` mapped to carousel shape; when set, skips REST list fetch. */
  initialProducts?: CarouselProduct[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<CarouselProduct[]>(
    () => initialProducts ?? [],
  );
  const [loading, setLoading] = useState(() => initialProducts === undefined);
  const ssrSeedRef = useRef<CarouselProduct[]>(initialProducts ?? []);
  const localeCurrencySeenRef = useRef<string | null>(null);

  useEffect(() => {
    ssrSeedRef.current = initialProducts ?? [];
  }, [initialProducts]);

  const fetchProducts = useCallback(async () => {
    const language = locale === "ar" ? "ar" : "en";
    const cur = String(currency || "QAR").toLowerCase();
    const token = Cookies.get("token") ?? null;
    let last: CarouselProduct[] = [];

    for (let attempt = 1; attempt <= CLIENT_CAROUSEL_RETRY_ATTEMPTS; attempt++) {
      try {
        const { getPopularProducts } = await fetchPopularProducts(
          {
            language,
            currency: cur,
            sort: PRODUCT_POPULAR_SORT.MOST_VIEWED,
            pageNumber: 1,
            itemsPerPage: 10,
          },
          token,
        );
        last = (getPopularProducts ?? []).map(gqlProductToCarouselProduct);
        if (last.length > 0) break;
      } catch {
        /* retry */
      }
      if (attempt < CLIENT_CAROUSEL_RETRY_ATTEMPTS) {
        await sleep(CLIENT_CAROUSEL_RETRY_DELAY_MS);
      }
    }

    if (last.length > 0) {
      setProducts(last);
    } else {
      setProducts((prev) =>
        prev.length > 0 ? prev : ssrSeedRef.current.length > 0 ? ssrSeedRef.current : [],
      );
    }
    setLoading(false);
  }, [locale, currency]);

  useEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    const prev = localeCurrencySeenRef.current;
    if (prev === null) {
      localeCurrencySeenRef.current = key;
      if (
        canUseHomeCarouselSsrSeed({
          initialProductCount: initialProducts?.length ?? 0,
          currency,
        })
      ) {
        setLoading(false);
        return;
      }
      setLoading(true);
      void fetchProducts();
      return;
    }
    if (prev !== key) {
      localeCurrencySeenRef.current = key;
      setLoading(true);
      void fetchProducts();
    }
  }, [locale, currency, fetchProducts, initialProducts]);

  const handleAddToCart = async (product: CarouselProduct) => {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCart(ref, 1);
  };
  const itemList = {
    itemListId: "home-popular-products",
    itemListName: t("popularProducts") || "Popular Products",
  };
  useGtmItemList(products, itemList, !loading);

  if (loading) {
    return (
      <section
        className={`w-full flex justify-center pt-8 pb-2 ${HOME_SECTION_X_PADDING_CLASS}`}
      >
        <div className={HOME_CONTENT_INNER_CLASS}>
          <div
            className={`${CAROUSEL_TRACK_LOADING_CLASS} overflow-hidden`}
            style={{ gap: SECTION_GAP }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`${CAROUSEL_CARD_WIDTH_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS} bg-gray-100 rounded animate-pulse`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section
      className={`w-full flex justify-center pt-8 pb-2 ${HOME_SECTION_X_PADDING_CLASS}`}
    >
      <div className={HOME_CONTENT_INNER_CLASS}>
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6"
          style={{ marginBottom: SECTION_GAP }}
        >
          <div className="flex flex-row items-center gap-3 sm:gap-4 min-h-10">
            <span
              className="flex-shrink-0 rounded-[3.97px] w-[17px] h-[34px] sm:w-[19.86px] sm:h-[39.73px]"
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
              {t("popularProducts") || "Popular Products"}
            </span>
          </div>
          <Link
            href={buildShopCollectionHref("popular")}
            className="flex items-center justify-center flex-shrink-0 rounded-[4px] text-[#FAFAFA] hover:opacity-90 transition-opacity w-full sm:w-auto min-h-10 px-6 sm:px-8 lg:px-12 whitespace-nowrap"
            style={{
              minWidth: "min(100%, 161px)",
              background: "#CB262E",
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
            }}
          >
            {t("viewAllProducts")}
          </Link>
        </div>

        <ProductCarouselTrack>
          {products.map((p, index) => (
            <div
              key={p?.id || p?.slug || p?.name}
              className="shrink-0"
            >
              <ProductCarouselCard
                product={p}
                onAddToCart={handleAddToCart}
                itemList={itemList}
                itemIndex={index}
              />
            </div>
          ))}
        </ProductCarouselTrack>
      </div>
    </section>
  );
}

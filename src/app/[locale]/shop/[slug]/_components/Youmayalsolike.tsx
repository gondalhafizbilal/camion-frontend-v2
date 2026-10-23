"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import Cookies from "js-cookie";
import { useCart } from "@/componentsedit/context/CartContext";
import RatingStars from "@/componentsedit/RatingStars";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import Image from "@/componentsedit/StaticImage";
import { loadPopularCarouselProducts } from "@/services/graphql/loadCarouselProductLists";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import {
  buildProductDetailHref,
  resolveListingVariantUuid,
} from "@/lib/productDetailHref";
import { useHorizontalCarouselScroll } from "@/lib/hooks/useHorizontalCarouselScroll";
import { formatMoneyAmount } from "@/lib/currency/localizedCurrencyCode";

export default function YouMayAlsoLikeCarousel() {
  const { addToCart: addToCartContext } = useCart();
  const t = useTranslations();
  const { currency } = useCurrency();
  const locale = useLocale();
  const [products, setProducts] = useState<CarouselProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const trackDir = locale === "ar" ? "rtl" : "ltr";
  const {
    canScrollPrev,
    canScrollNext,
    hasOverflow,
    handlePrev,
    handleNext,
    onScroll,
  } = useHorizontalCarouselScroll(scrollContainerRef);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await loadPopularCarouselProducts(
          {
            language: String(locale || "en"),
            currency: String(currency || "QAR"),
            pageNumber: 1,
            itemsPerPage: 10,
          },
          Cookies.get("token"),
        );
        if (alive) setProducts(list);
      } catch (error) {
        console.error("Error fetching products (GraphQL):", error);
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [locale, currency]);

  useEffect(() => {
    onScroll();
  }, [products, onScroll, trackDir]);

  async function addToCart(product: CarouselProduct) {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCartContext(ref, 1, []);
  }

  if (loading) {
    return (
      <section className="container mx-auto px-3 sm:px-4 pt-4 pb-2">
        <div className="h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-start items-center pt-4 md:pt-6">
          <div className="animate-pulse h-6 w-48 bg-gray-300 rounded mb-6 md:mb-8"></div>
          <div className="flex gap-4 md:gap-6 px-12 w-full justify-center flex-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
                <div className="animate-pulse w-[100px] h-[120px] md:w-[140px] md:h-[160px] bg-gray-300 rounded-lg"></div>
                <div className="animate-pulse h-4 w-20 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-3 sm:px-4 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] relative flex flex-col justify-start items-center py-4 md:py-6">
          <h2 className="font-bold text-lg md:text-1xl mb-4 md:mb-6 px-4">
            {t("youMayAlsoLike") || "You May Also Like"}
          </h2>

          <div className="w-full flex-1 relative flex items-center">
            <div
              ref={scrollContainerRef}
              dir={trackDir}
              onScroll={onScroll}
              className="w-full overflow-x-auto scrollbar-hide flex items-center"
            >
              <div className="flex gap-4 md:gap-6 lg:gap-8 px-4 md:px-8 py-2 min-w-min">
                {products.map((product) => {
                  const image =
                    product.images?.[0]?.src || "/assets/icons/logo-light.svg";
                  const price = product.prices?.price;
                  const code = product.prices?.currency_code || String(currency || "QAR");
                  const hasVariations =
                    product?.variations && product.variations.length > 0;
                  const pid = product.id;

                  return (
                    <div
                      key={pid ?? product.slug}
                      data-carousel-card
                      className="bg-white text-center cursor-pointer group rounded-lg shadow-sm hover:shadow-md transition-all relative flex-shrink-0"
                      style={{ width: "140px" }}
                    >
                      <Link
                        href={buildProductDetailHref(
                          product.slug,
                          resolveListingVariantUuid(product),
                          product.productUuid,
                        )}
                        className="block h-full"
                      >
                        <div className="relative h-[120px] md:h-[160px] bg-center bg-contain bg-no-repeat mb-2 mt-2 overflow-hidden rounded-lg">
                          <Image
                            src={image}
                            alt={product.name || ""}
                            fill
                            className="object-contain"
                          />
                        </div>

                        <h3 className="font-semibold px-2 text-xs md:text-sm line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="mt-1 flex justify-center">
                          <RatingStars
                            average={Number(product?.average_rating ?? 0) || 0}
                            count={Number(product?.rating_count ?? 0) || 0}
                            size={10}
                          />
                        </div>
                        <p className="text-[#B92123] font-semibold mt-1 text-xs md:text-sm px-1">
                          {formatMoneyAmount(price, locale, code)}
                        </p>
                      </Link>

                      {hasVariations ? (
                        <Link
                          href={buildProductDetailHref(
                            product.slug,
                            resolveListingVariantUuid(product),
                            product.productUuid,
                          )}
                        >
                          <div className="bg-gray-100 text-gray-700 group-hover:bg-[#B92123] group-hover:text-white cursor-pointer rounded-b-lg text-xs md:text-sm font-bold px-2 py-1.5 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
                            {t("selectOptions")}
                          </div>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void addToCart(product);
                          }}
                          className="bg-[#e14a5c] cursor-pointer rounded-b-lg text-white text-xs md:text-sm font-bold px-2 py-1.5 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2"
                        >
                          {t("addToCart")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {hasOverflow && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canScrollPrev}
                  className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white shadow px-3 py-2 text-sm font-semibold text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
                  aria-label={t("previousSlide")}
                >
                  <span className="inline-flex rtl:rotate-180">‹</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canScrollNext}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 hover:bg-white shadow px-3 py-2 text-sm font-semibold text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
                  aria-label={t("nextSlide")}
                >
                  <span className="inline-flex rtl:rotate-180">›</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

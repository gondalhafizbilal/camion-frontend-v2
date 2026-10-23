"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import ProductCarouselTrack from "@/componentsedit/home/ProductCarouselTrack";
import { Link } from "@/i18n/navigation";
import {
  buildShopContextCollectionHref,
  buildShopProductCollectionHref,
} from "@/lib/shop/shopCollection";
import {
  loadPopularCarouselProducts,
  loadRelatedCarouselProducts,
} from "@/services/graphql/loadCarouselProductLists";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import {
  CAROUSEL_CARD_HEIGHT_CLASS,
  CAROUSEL_CARD_WIDTH_CLASS,
} from "@/lib/styles/carouselCardLayout";

export default function SimilarProductsSection({
  productSlug,
}: {
  /** When set, uses `getRelatedProducts`; otherwise `getPopularProducts` (e.g. cart / confirmation). */
  productSlug?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<CarouselProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const slug = (productSlug || "").trim();
    const lang = locale === "ar" ? "ar" : "en";
    const cur = String(currency || "QAR").toLowerCase();
    const token = Cookies.get("token");
    try {
      let list = slug
        ? await loadRelatedCarouselProducts(
            {
              slug,
              language: lang,
              currency: cur,
              pageNumber: 1,
              itemsPerPage: 10,
              excludeSlug: slug,
            },
            token,
          )
        : await loadPopularCarouselProducts(
            { language: lang, currency: cur, pageNumber: 1, itemsPerPage: 10 },
            token,
          );
      if (slug && (!list || list.length === 0)) {
        list = await loadPopularCarouselProducts(
          { language: lang, currency: cur, pageNumber: 1, itemsPerPage: 10 },
          token,
        );
      }
      setProducts(list.slice(0, 12));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [locale, currency, productSlug]);

  useEffect(() => {
    setLoading(true);
    void fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (product: CarouselProduct) => {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCart(ref, 1, []);
  };

  const slug = (productSlug || "").trim();
  const viewAllHref = slug
    ? buildShopProductCollectionHref("related", slug)
    : buildShopContextCollectionHref("related");

  if (loading) {
    return (
      <section className="mt-12 w-full min-w-0 md:mt-16 lg:mt-20">
        <div className="mb-6 flex flex-row flex-wrap items-center justify-between gap-4 sm:mb-10">
          <div className="flex flex-row items-center gap-2">
            <div
              className="shrink-0 rounded bg-[#CB262E]"
              style={{ width: 20, height: 40 }}
            />
            <span className="font-sans text-lg font-semibold leading-tight text-black sm:text-xl sm:leading-5">
              {t("similarProducts")}
            </span>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`${CAROUSEL_CARD_WIDTH_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS} shrink-0 animate-pulse rounded bg-gray-100`}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="mt-12 w-full min-w-0 md:mt-16 lg:mt-20">
      <div className="mb-6 flex min-h-[46px] flex-row flex-wrap items-center justify-between gap-4 sm:mb-10">
        <div className="flex flex-row items-center gap-2">
          <div
            className="shrink-0 rounded"
            style={{ width: 20, height: 40, background: "#CB262E", borderRadius: 4 }}
          />
          <span className="font-sans text-lg font-semibold leading-tight text-black sm:text-xl sm:leading-5">
            {t("similarProducts")}
          </span>
        </div>
        <Link
          href={viewAllHref}
          className="ms-auto flex shrink-0 items-center justify-center font-sans text-base font-medium leading-6 text-black transition-opacity hover:opacity-80"
        >
          {t("viewAllProducts")}
        </Link>
      </div>

      <ProductCarouselTrack variant="page">
        {products.map((p) => (
          <div key={p?.id ?? p?.slug ?? p?.name} className="shrink-0">
            <ProductCarouselCard product={p} onAddToCart={handleAddToCart} />
          </div>
        ))}
      </ProductCarouselTrack>
    </section>
  );
}

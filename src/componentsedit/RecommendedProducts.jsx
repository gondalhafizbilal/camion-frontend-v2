"use client";
import { useState, useEffect } from "react";
import { LazyMotion, m, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Cookies from "js-cookie";
import { useCart } from "@/componentsedit/context/CartContext";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import Image from "@/componentsedit/StaticImage";
import { ShoppingCart } from "lucide-react";
import RatingStars from "@/componentsedit/RatingStars";
import { loadPopularCarouselProducts } from "@/services/graphql/loadCarouselProductLists";
import {
  buildProductDetailHref,
  resolveListingVariantUuid,
} from "@/lib/productDetailHref";
import {
  ecommerceMotionRootClass,
  withEcommerceMotionLayers,
} from "@/componentsedit/buttons/EcommerceMotionButton";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import { formatMoneyAmount } from "@/lib/currency/localizedCurrencyCode";

const loadFeatures = () => import("framer-motion").then((res) => res.domAnimation);

export default function RecommendedProducts({ initialProducts = [] }) {
  const t = useTranslations();
  const locale = useLocale();
  const { addToCart: addToCartContext } = useCart();

  const [products, setProducts] = useState([]);
  const [hoveredProductId, setHoveredProductId] = useState("");
  const [addingProductId, setAddingProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrency();

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }
    let cancelled = false;
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
        if (!cancelled) setProducts(list);
      } catch (error) {
        console.error("Error fetching products (GraphQL):", error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialProducts?.length, locale, currency]);

  async function handleAddToCart(product) {
    const pid = String(product.id ?? "");
    setAddingProductId(pid);
    try {
      const ref = carouselProductToCartRef(product);
      if (ref) await addToCartContext(ref, 1);
    } finally {
      setAddingProductId("");
    }
  }

  return loading ? (
    <div className="md:p-6 container m-auto mt-16 min-h-screen">
      <h2 className="font-semibold text-xl mb-2">{t("mostViewed")}</h2>
      <div className="grid grid-cols-2 w-full md:grid-cols-6 md:gap-6 gap-1">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="p-4 border rounded-2xl border-gray-200 shadow animate-pulse md:p-6 dark:border-gray-400"
          >
            <div className="flex items-center justify-center h-48 mb-4 bg-gray-300 rounded dark:bg-gray-400"></div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="flex-1 mt-10 container flex flex-col gap-4 w-full">
      <p className="text-lg font-semibold mb-4">{t("mostViewed")}</p>

      <LazyMotion features={loadFeatures} strict>
        <AnimatePresence mode="wait">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {products.map((product, index) => {
              const image = product.images?.[0]?.src || "/assets/icons/logo-light.svg";
              const hoverImage = product.images?.[1]?.src || product.images?.[0]?.src;
              const price = product.prices?.price;
              const currencyCode = product.prices?.currency_code || currency || "QAR";
              const pid = product.id;
              const label = product.name || "";
              const isAdding = addingProductId === String(pid ?? "");

              return (
                <div
                  key={`${pid}-${index}`}
                  className="bg-white text-center min-h-[300px] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative group border border-gray-100"
                  onMouseEnter={() => setHoveredProductId(String(pid ?? ""))}
                  onMouseLeave={() => setHoveredProductId("")}
                >
                  <Link
                    href={buildProductDetailHref(
                      product.slug,
                      resolveListingVariantUuid(product),
                      product.productUuid,
                    )}
                    className="block"
                  >
                    <div className="relative w-full h-44 mb-3 mt-4">
                      <Image
                        src={hoveredProductId === String(pid ?? "") ? hoverImage : image}
                        alt={label}
                        fill
                        className="object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </div>

                    <h3 className="font-semibold px-3 text-gray-800 text-sm line-clamp-2 group-hover:text-[#e14a5c] transition-colors">
                      {label}
                    </h3>

                    <div className="flex items-center justify-center mb-1">
                      <RatingStars
                        average={Number(product?.average_rating ?? 0) || 0}
                        count={Number(product?.rating_count ?? 0) || 0}
                        size={12}
                      />
                    </div>

                    <p className="text-[#e14a5c] font-bold mt-1">
                      {formatMoneyAmount(price, locale, currencyCode)}
                    </p>
                  </Link>

                  <m.button
                    type="button"
                    disabled={isAdding}
                    data-loading={isAdding ? "" : undefined}
                    aria-busy={isAdding || undefined}
                    onClick={() => handleAddToCart(product)}
                    animate={
                      hoveredProductId === String(pid ?? "")
                        ? { y: 0, opacity: 1 }
                        : { y: 60, opacity: 0 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`${ecommerceMotionRootClass(
                      "cta",
                      "w-full cursor-pointer rounded-t-xl py-3 text-sm font-semibold text-white md:absolute md:bottom-0 md:left-0 md:right-0 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-2",
                      { busy: isAdding },
                    )}`}
                  >
                    {withEcommerceMotionLayers(
                      <>
                        <ShoppingCart size={18} /> {t("addToCart")}
                      </>,
                      {
                        surfaceClassName: "rounded-t-xl bg-[#e14a5c] shadow-md",
                        contentClassName: "flex items-center justify-center gap-2",
                        busy: isAdding,
                      },
                    )}
                  </m.button>
                </div>
              );
            })}
          </m.div>
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}

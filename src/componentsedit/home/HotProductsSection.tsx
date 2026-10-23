"use client";

import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import Cookies from "js-cookie";
import { fetchAllBanners, fetchProducts, fetchProductsByCategory } from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/componentsedit/context/CartContext";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import RatingStars from "@/componentsedit/RatingStars";
import type {
  CarouselProduct,
  ProductRatingSummary,
} from "@/componentsedit/home/ProductCarouselSection";
import {
  PRODUCT_IMAGE_FALLBACK,
  productImageUrlOrFallback,
} from "@/lib/productImageFallback";
import {
  buildProductDetailHref,
  resolveListingVariantUuid,
} from "@/lib/productDetailHref";
import { EcommerceMotionButton } from "@/componentsedit/buttons/EcommerceMotionButton";
import { formatMoneyAmount } from "@/lib/currency/localizedCurrencyCode";

type SidebarBanner = {
  id: string | number;
  img: string;
  href: string;
  alt: string;
};

const decodeHtml = (html: unknown) => {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/\$amp/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .trim();
};

// ✅ Fallback sidebar banners (hardcoded)
const SIDEBAR_FALLBACK = [
  {
    id: "s1",
    img: "/assets/banners/home/slidebar/slidebar-1.jpg",
    href: "/shop",
    alt: "Sidebar banner 1",
  },
  {
    id: "s2",
    img: "/assets/banners/home/slidebar/slidebar-2.jpg",
    href: "/shop",
    alt: "Sidebar banner 2",
  },
];

const PAGE_SIZE = 5;

// ✅ Banner dimensions kept EXACTLY as before:
// each banner h-[420px], gap space-y-4 (=16px)
// total height = 420 + 16 + 420 = 856px
const BANNERS_TOTAL_HEIGHT_MD = "md:h-[856px]";

export default function HotProductsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const [items, setItems] = useState<CarouselProduct[]>([]);
  const [page, setPage] = useState(1);
  const [initLoading, setInitLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory] = useState("");
  // ✅ Sidebar banners state - start with empty array, will use fallback if no API banners
  const [sidebarBanners, setSidebarBanners] = useState<SidebarBanner[]>([]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // ✅ Products scroll container ref (independent scrolling on md+)
  const productsScrollRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fetch sidebar banners
  useEffect(() => {
    let mounted = true;

    const fetchSidebarBanners = async () => {
      try {
        const language = locale === "ar" ? "ar" : "en";
        const token = Cookies.get("token") ?? null;
        const getBanners = await fetchAllBanners({
          language,
          authToken: token,
        });
        if (!mounted) return;

        const mapped = (getBanners ?? [])
          .filter(
            (b) =>
              b?.isActive !== false &&
              String(b?.placement ?? "")
                .toLowerCase()
                .includes("sidebar") &&
              b?.imageUrl,
          )
          .slice(0, 2)
          .map((b, idx) => ({
            id: b.uuid || `sidebar-${idx}`,
            img: String(b.imageUrl),
            href: "/shop",
            alt: String(b.title ?? "Sidebar banner"),
          }));

        if (mapped.length > 0) {
          setSidebarBanners(mapped);
        }
      } catch {
        /* use SIDEBAR_FALLBACK */
      }
    };

    fetchSidebarBanners();
    return () => {
      mounted = false;
    };
  }, [locale]);

  const fetchPage = useCallback(
    async (p: number, filters: { category?: string } = {}) => {
      const { category } = filters;
      const language = locale === "ar" ? "ar" : "en";
      const currencyCode = String(currency || "QAR").toLowerCase();
      const token = Cookies.get("token") ?? null;

      if (category) {
        const { getProductsByCategory } = await fetchProductsByCategory(
          {
            slug: category,
            language,
            currency: currencyCode,
            pageNumber: p,
            itemsPerPage: PAGE_SIZE,
          },
          token,
        );
        return (getProductsByCategory ?? []).map(gqlProductToCarouselProduct);
      }

      const { getProducts } = await fetchProducts(
        {
          language,
          currency: currencyCode,
          pageNumber: p,
          itemsPerPage: PAGE_SIZE,
        },
        token,
      );
      return (getProducts ?? []).map(gqlProductToCarouselProduct);
    },
    [locale, currency],
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setInitLoading(true);
        const first = await fetchPage(1, { category: selectedCategory });
        if (!alive) return;

        setItems(first);
        setHasMore(first.length >= PAGE_SIZE);
        setPage(1);
      } catch (e: unknown) {
        if (!(e instanceof Error && e.name === "AbortError")) console.warn(e);
      } finally {
        if (alive) setInitLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetchPage, selectedCategory]);

  // ✅ Shared loader used by BOTH: IntersectionObserver + auto-fill
  const loadMore = useCallback(async () => {
    if (initLoading || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const next = await fetchPage(nextPage, { category: selectedCategory });

      setItems((prev) => {
        const combined: CarouselProduct[] = [...prev, ...next];
        const unique = Array.from(
          new Map(combined.map((p) => [p?.id ?? p?.slug ?? p?.name, p])).values(),
        );
        return unique;
      });

      setHasMore(next.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) console.warn(e);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, initLoading, loadingMore, page, selectedCategory]);

  // ✅ Auto-fill: if products area has empty space (not scrollable), load more until filled
  useEffect(() => {
    const el = productsScrollRef.current;
    if (!el) return;
    if (initLoading || loadingMore || !hasMore) return;

    const notFilled = el.scrollHeight <= el.clientHeight + 50;
    if (!notFilled) return;

    loadMore();
  }, [items.length, hasMore, initLoading, loadingMore, loadMore]);

  // ✅ Infinite scroll ONLY inside products scroll container
  useEffect(() => {
    if (!sentinelRef.current) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        loadMore();
      },
      {
        root: productsScrollRef.current,
        rootMargin: "400px",
        threshold: 0,
      },
    );

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <section className="container mx-auto px-3 sm:px-4 pt-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-6">
        {/* ✅ Products: match banner column total height so no white space */}
        <div
          ref={productsScrollRef}
          className={`min-w-0 ${BANNERS_TOTAL_HEIGHT_MD} md:overflow-y-auto md:pr-2`}
        >
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
              {t("hotProducts")}
            </h2>
            <Link
              href="/shop"
              className="text-sm font-semibold text-[#B92123] hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>

          {initLoading ? (
            <GridSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-600">
              {t("noProductsFound")}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {items.map((p) => (
                  <ProductCard
                    key={p?.id || p?.slug || p?.name}
                    p={p}
                    t={t}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="h-12 flex items-center justify-center">
                {loadingMore ? (
                  <span className="text-sm text-gray-500">{t("loadingMore")}</span>
                ) : hasMore ? (
                  <span className="text-xs text-gray-400">{t("scrollToLoadMore")}</span>
                ) : (
                  <span className="text-xs text-gray-400">{t("reachedEnd")}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar banners (unchanged dimensions) */}
        <aside className="hidden md:block self-start">
          <div className="sticky top-24 space-y-4">
            {(Array.isArray(sidebarBanners) && sidebarBanners.length > 0
              ? sidebarBanners.slice(0, 2)
              : SIDEBAR_FALLBACK.slice(0, 2)
            ).map((b) => (
              <Link
                key={b.id}
                href={b.href}
                className="block overflow-hidden rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow"
                aria-label={b.alt}
              >
                <div className="relative h-[420px]">
                  <Image
                    src={b.img}
                    alt={b.alt}
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProductCard({
  p,
  rating,
  t,
}: {
  p: CarouselProduct;
  rating?: ProductRatingSummary;
  t: ReturnType<typeof useTranslations>;
}) {
  const locale = useLocale();
  const { addToCart } = useCart();
  const { currency } = useCurrency();
  const hasVariations = p?.variations && p.variations.length > 0;

  const resolvedImg = productImageUrlOrFallback(
    p?.images?.[0]?.thumbnail || p?.images?.[0]?.src || "",
  );
  const [imgSrc, setImgSrc] = useState(resolvedImg);
  useEffect(() => {
    setImgSrc(resolvedImg);
  }, [resolvedImg, p?.id, p?.slug]);

  const rawName = p?.name || "Product";
  const name = decodeHtml(rawName);

  const prices = p?.prices || {};
  const regular = prices?.regular_price;
  const sale = prices?.sale_price;
  const onSale =
    Boolean(p?.on_sale) ||
    (Number(sale) > 0 && Number(regular) > 0 && Number(sale) < Number(regular));

  const href = buildProductDetailHref(
    p?.slug,
    resolveListingVariantUuid(p),
    p?.productUuid,
  );

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={imgSrc}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 240px"
          unoptimized
          loading="lazy"
          onError={() => setImgSrc(PRODUCT_IMAGE_FALLBACK)}
        />
      </div>

      <div className="p-3">
        <div className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#B92123] transition-colors">
          {name}
        </div>

        {(() => {
          const bundled = p.ratings as { average?: number; count?: number } | undefined;
          const avg =
            rating?.average ?? p?.average_rating ?? p?.rating ?? bundled?.average ?? 0;
          const count =
            rating?.count ??
            p?.rating_count ??
            p?.reviews_count ??
            bundled?.count ??
            (Array.isArray(p.reviews) ? p.reviews.length : 0) ??
            0;

          return <RatingStars average={Number(avg)} count={Number(count)} size={12} />;
        })()}

        {prices?.price && (
          <div className="mt-1 pb-0.5">
            {onSale ? (
              <div className="flex flex-col gap-0.5 items-start">
                <span className="text-sm font-extrabold text-gray-900 leading-snug">
                  {formatMoneyAmount(sale, locale, prices?.currency_code || currency || "QAR")}
                </span>
                <span className="text-xs font-semibold leading-snug text-[#CB262E] line-through">
                  {formatMoneyAmount(
                    regular,
                    locale,
                    prices?.currency_code || currency || "QAR",
                  )}
                </span>
              </div>
            ) : (
              <div className="text-sm font-extrabold text-gray-900">
                {formatMoneyAmount(
                  prices.price,
                  locale,
                  prices?.currency_code || currency || "QAR",
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {hasVariations ? (
        <div className="mt-2 block w-full text-center bg-gray-100 py-2 text-sm font-semibold text-gray-700 transition-colors group-hover:bg-[#B92123] group-hover:text-white">
          {t("selectOptions")}
        </div>
      ) : (
        <EcommerceMotionButton
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const ref = carouselProductToCartRef(p);
            if (ref) return addToCart(ref, 1);
          }}
          className="mt-2 block w-full py-2 text-center text-sm font-semibold text-white"
          surfaceClassName="bg-[#B92123]"
        >
          {t("addToCart")}
        </EcommerceMotionButton>
      )}
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-100 overflow-hidden bg-white"
        >
          <div className="aspect-square bg-gray-100 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import Cookies from "js-cookie";
import { fetchProducts } from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import {
  PRODUCT_IMAGE_FALLBACK,
  productImageUrlOrFallback,
} from "@/lib/productImageFallback";
import {
  buildProductDetailHref,
  resolveListingVariantUuid,
} from "@/lib/productDetailHref";
import { formatMoneyAmount } from "@/lib/currency/localizedCurrencyCode";

/** ✅ Same helpers style as your HotProductsSection */
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

const PAGE_SIZE = 5;
const TWO_BOX_TIMER_KEY = "camion_home_deals_timer_end_v1";
const TIMER_SECONDS = 24 * 60 * 60;

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

const formatHMS = (totalSeconds: unknown) => {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
};

function getOrCreateEndAt() {
  // ✅ Persist timer across refreshes using localStorage (per browser/device)
  if (typeof window === "undefined") return Date.now() + TIMER_SECONDS * 1000;

  try {
    const raw = localStorage.getItem(TWO_BOX_TIMER_KEY);
    const parsed = raw ? Number(raw) : 0;

    // if missing/invalid or already expired, set new 24h window
    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      const next = Date.now() + TIMER_SECONDS * 1000;
      localStorage.setItem(TWO_BOX_TIMER_KEY, String(next));
      return next;
    }

    return parsed;
  } catch {
    return Date.now() + TIMER_SECONDS * 1000;
  }
}

function resetEndAt() {
  if (typeof window === "undefined") return Date.now() + TIMER_SECONDS * 1000;

  const next = Date.now() + TIMER_SECONDS * 1000;
  try {
    localStorage.setItem(TWO_BOX_TIMER_KEY, String(next));
  } catch {}
  return next;
}

export default function TrendingClearanceSection() {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CarouselProduct[]>([]);
  const [endAt, setEndAt] = useState(() => getOrCreateEndAt());
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((endAt - Date.now()) / 1000)),
  );
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);

        const language = locale === "ar" ? "ar" : "en";
        const currencyCode = String(currency || "QAR").toLowerCase();
        const token = Cookies.get("token") ?? null;
        const { getProducts } = await fetchProducts(
          {
            language,
            currency: currencyCode,
            pageNumber: 1,
            itemsPerPage: PAGE_SIZE,
          },
          token,
        );
        const list = (getProducts ?? []).map(gqlProductToCarouselProduct);

        if (!alive) return;
        setItems(list);
      } catch (e: unknown) {
        if (!(e instanceof Error && e.name === "AbortError")) console.warn(e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [locale, currency]);
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = Math.floor((endAt - now) / 1000);

      if (diff <= 0) {
        // ✅ Auto-reset to another 24 hours
        const nextEnd = resetEndAt();
        setEndAt(nextEnd);
        setRemaining(TIMER_SECONDS);
        return;
      }

      setRemaining(diff);
    };

    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [endAt]);

  // ✅ Split the pool into 2 sections (for now)
  const trending = useMemo(() => items.slice(0, 10), [items]);
  const clearance = useMemo(() => items.slice(10, 20), [items]);

  return (
    <section className="container mx-auto px-3 sm:px-4 pt-4 pb-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DealsBox
          title={
            t?.("trendingProducts") ||
            (locale === "ar" ? "المنتجات الرائجة" : "Trending Products")
          }
          rightText={locale === "ar" ? "عرض لفترة محدودة" : "Limited time offer"}
          items={trending}
          loading={loading}
          locale={locale}
          timerSeconds={remaining}
        />

        <DealsBox
          title={
            t?.("clearanceDeals") ||
            (locale === "ar" ? "عروض التصفية" : "Clearance Deals")
          }
          rightText={locale === "ar" ? "مخزون محدود" : "Limited stock"}
          items={clearance}
          loading={loading}
          locale={locale}
          timerSeconds={remaining}
        />
      </div>
    </section>
  );
}

function DealsBox({
  title,
  rightText,
  items,
  loading,
  locale,
  timerSeconds,
}: {
  title: string;
  rightText: string;
  items: CarouselProduct[];
  loading: boolean;
  locale: string;
  timerSeconds: number;
}) {
  const t = useTranslations();
  return (
    <div
      className="
          bg-white rounded-2xl overflow-hidden
          border-2 border-[#B92123]/30
          hover:border-[#B92123]/60
          hover:shadow-[0_0_0_3px_rgba(185,33,35,0.08)]
          transition
        "
    >
      {/* ✅ Red top highlight strip */}
      <div className="h-1 w-full bg-[#B92123]" />

      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#B92123] text-lg">⚡</span>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 truncate">
                {title}
              </h3>
            </div>

            {/* ✅ 24h Timer */}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-gray-500">
                {locale === "ar" ? "ينتهي خلال" : "Ends in"}
              </span>

              <span
                className="
                  inline-flex items-center
                  rounded-lg
                  border border-[#B92123]/30
                  bg-[#B92123]/5
                  px-2 py-0.5
                  text-[11px] sm:text-xs
                  font-extrabold
                  text-[#B92123]
                  tracking-wider
                "
              >
                {formatHMS(timerSeconds)}
              </span>
            </div>
          </div>

          <Link
            href="/shop"
            className="text-xs sm:text-sm font-semibold text-[#B92123] hover:underline whitespace-nowrap"
          >
            {rightText} →
          </Link>
        </div>
      </div>

      <div className="px-3 pb-4">
        {loading ? (
          <RowSkeleton />
        ) : items?.length ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {items.map((p) => (
              <MiniCard key={p?.id || p?.slug || p?.name} p={p} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="px-1 text-sm text-gray-600">{t("noProductsFound")}</div>
        )}
      </div>
    </div>
  );
}

function MiniCard({ p, locale }: { p: CarouselProduct; locale: string }) {
  const { currency } = useCurrency();
  const resolvedImg = productImageUrlOrFallback(
    p?.images?.[0]?.thumbnail || p?.images?.[0]?.src || "",
  );
  const [imgSrc, setImgSrc] = useState(resolvedImg);
  useEffect(() => {
    setImgSrc(resolvedImg);
  }, [resolvedImg, p?.id, p?.slug]);

  const name = decodeHtml(p?.name || "Product");

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
      className="min-w-[150px] max-w-[150px] sm:min-w-[190px] sm:max-w-[190px]
                 rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-[130px] sm:h-[150px] bg-gray-50">
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

      <div className="p-2.5">
        <div className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
          {name}
        </div>

        {prices?.price ? (
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
        ) : (
          <div className="mt-1 text-xs text-gray-400">—</div>
        )}
      </div>
    </Link>
  );
}

function RowSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="min-w-[150px] max-w-[150px] sm:min-w-[190px] sm:max-w-[190px]
                     h-[210px] sm:h-[230px] rounded-2xl bg-gray-100 animate-pulse"
        />
      ))}
    </div>
  );
}

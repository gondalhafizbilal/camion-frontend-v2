"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "@/componentsedit/StaticImage";
import { useTranslations, useLocale } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { Link, useRouter } from "@/i18n/navigation";
import { fetchSearchProducts } from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import {
  PRODUCT_IMAGE_FALLBACK,
  productImageUrlOrFallback,
} from "@/lib/productImageFallback";
import {
  buildProductDetailHref,
  resolveListingVariantUuid,
} from "@/lib/productDetailHref";

import Filter from "./filter";

import { formatMoneyAmount } from "@/lib/currency/localizedCurrencyCode";
import {
  trackGtmSearch,
  trackGtmSelectItem,
} from "@/componentsedit/analytics/gtmDiscovery";

type ProductSearchHit = {
  id: string | number;
  slug: string;
  name: string;
  productUuid?: string;
  variantUuid?: string;
  price?: number | string;
  currencyCode?: string;
  images?: Array<{ thumbnail?: string }>;
};

function SearchSuggestionThumb({
  thumbnail,
  name,
}: {
  thumbnail?: string;
  name: string;
}) {
  const initial = productImageUrlOrFallback(thumbnail || "");
  const [src, setSrc] = useState(initial);
  useEffect(() => {
    setSrc(initial);
  }, [initial]);
  return (
    <Image
      src={src}
      alt={name}
      width={48}
      height={48}
      className="w-12 h-12 object-cover rounded-md"
      unoptimized
      onError={() => setSrc(PRODUCT_IMAGE_FALLBACK)}
    />
  );
}

const Icon = {
  Search: ({ className = "" }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 21l-4.35-4.35" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  ),
};

export default function ProductSearch() {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        // GraphQL search (best-match default in `fetchSearchProducts`)
        const { searchProducts } = await fetchSearchProducts({
          query: searchTerm.trim(),
          language: String(locale || "en"),
          currency: String(currency || "QAR"),
          pageNumber: 1,
          itemsPerPage: 10,
        });

        const mapped = (searchProducts ?? [])
          .map((p) => gqlProductToCarouselProduct(p))
          .filter((p) => Boolean(p?.slug))
          .map((p) => ({
            id: String(p.id ?? p.slug ?? ""),
            slug: String(p.slug ?? ""),
            name: String(p.name ?? ""),
            productUuid: p.productUuid,
            variantUuid: p.variantUuid,
            price: p.prices?.price,
            currencyCode: String(p.prices?.currency_code ?? currency ?? "QAR"),
            images: [{ thumbnail: String(p.images?.[0]?.thumbnail ?? "") }],
          }))
          .filter((x) => Boolean(x.id) && Boolean(x.slug));

        setResults(mapped);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [locale, currency],
  );

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;

    trackGtmSearch(q);
    setResults([]);
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) void fetchProducts(query);
      else setResults([]);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, fetchProducts]);

  return (
    <div className="w-full max-w-xl relative">
      <div className="relative w-full bg-white rounded-full border border-gray-200 shadow-sm">
        <input
          type="search"
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
            if (e.key === "Escape") setResults([]);
          }}
          className={`w-full h-[44px] ${
            locale === "ar" ? "pr-4 pl-[112px]" : "pl-4 pr-[112px]"
          } rounded-full text-black focus:outline-none`}
        />

        <div
          className={`absolute ${
            locale === "ar" ? "left-[54px]" : "right-[54px]"
          } top-1/2 -translate-y-1/2 z-40`}
        >
          <Filter embedded />
        </div>

        <button
          onClick={handleSearch}
          className={`absolute cursor-pointer bg-[#e14a5c] ${
            locale === "ar" ? "left-1.5" : "right-1.5"
          } top-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#B92123] focus:ring-offset-2 z-50`}
          aria-label={t("search")}
          type="button"
        >
          <Icon.Search className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-lg p-4 text-center z-50">
          {t("loading")}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-lg p-4 text-center z-50">
          {t("noProductsFound")}
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-lg max-h-64 overflow-y-auto z-50">
          {results.map((item, index) => (
            <Link
              key={String(item.id)}
              href={buildProductDetailHref(
                item.slug,
                resolveListingVariantUuid(item),
                item.productUuid,
              )}
              onClick={() =>
                trackGtmSelectItem(
                  item,
                  {
                    itemListId: "search-suggestions",
                    itemListName: "Search suggestions",
                  },
                  index,
                )
              }
              className="flex items-center"
            >
              <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <SearchSuggestionThumb
                  thumbnail={item.images?.[0]?.thumbnail}
                  name={item?.name || "product"}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-800 line-clamp-1">
                    {item?.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatMoneyAmount(item.price, locale, item.currencyCode || currency || "QAR")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

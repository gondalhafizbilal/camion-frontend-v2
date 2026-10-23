"use client";

import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Cookies from "js-cookie";
import { fetchCategories } from "@/services/graphql";
import type { GqlCategory } from "@/services/graphql/types/category";
import { RequestTimeoutError } from "@/types/errors";

function ArrowLeftIcon({
  size = 24,
  strokeWidth = 2,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon({
  size = 24,
  strokeWidth = 1.5,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CategoryListItem = {
  id?: string | number;
  slug?: string;
  name?: string;
  image?: { thumbnail?: string; src?: string };
};

function gqlRootsToShopCategories(roots: GqlCategory[]): CategoryListItem[] {
  return roots.map((c) => {
    const thumb = (c.thumbnailUrl ?? "").trim();
    return {
      id: c.uuid,
      slug: c.slug,
      name: c.name ?? c.slug,
      image: thumb ? { thumbnail: thumb, src: thumb } : undefined,
    };
  });
}

export default function ShopByCategoriesSection() {
  const t = useTranslations();
  const locale = useLocale();
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(0);
  const mountedRef = useRef(true);

  const ITEMS_PER_PAGE = 18;
  const maxPage = Math.max(0, Math.ceil((categories?.length || 0) / ITEMS_PER_PAGE) - 1);
  const hasMultiplePages = (categories?.length || 0) > ITEMS_PER_PAGE;
  const visibleCategories = categories.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );
  const canGoPrev = hasMultiplePages && page > 0;
  const canGoNext = hasMultiplePages && page < maxPage;

  const reloadCategories = async () => {
    try {
      setErrorMessage("");
      const language = locale === "ar" ? "ar" : "en";
      const token = Cookies.get("token") ?? null;
      const { getCategories } = await fetchCategories(
        { language, pageNumber: 1, itemsPerPage: 200 },
        token,
      );

      if (!mountedRef.current) return;

      setCategories(gqlRootsToShopCategories(getCategories ?? []));
    } catch (err: unknown) {
      console.error("Error fetching categories:", err);
      if (!mountedRef.current) return;
      if (err instanceof RequestTimeoutError) {
        setErrorMessage(
          "We're having trouble loading categories right now — the request timed out. Please try again later.",
        );
      } else {
        setErrorMessage(
          "Unable to load categories. Please check your connection and try again.",
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void reloadCategories();
    return () => {
      mountedRef.current = false;
    };
  }, [locale]);

  useEffect(() => {
    setPage(0);
  }, [categories?.length]);

  // Loading state - skeleton
  if (loading) {
    return (
      <section
        className="w-full flex justify-center pt-8 pb-2"
        style={{
          paddingLeft: "clamp(16px, 9.375vw, 135px)",
          paddingRight: "clamp(16px, 9.375vw, 135px)",
        }}
      >
        <div
          className="mx-auto w-full flex flex-col"
          style={{ width: 1169, maxWidth: "100%" }}
        >
          <div className="animate-pulse h-8 w-48 bg-gray-300 rounded mb-6" />
          <div className="flex gap-4 md:gap-6 w-full overflow-hidden justify-start">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
                <div className="animate-pulse w-[80px] h-[80px] md:w-[120px] md:h-[120px] bg-gray-300 rounded-full" />
                <div className="animate-pulse h-4 w-16 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const handleRetry = () => {
    setLoading(true);
    void reloadCategories();
  };

  // ✅ Error state - show friendly message with retry
  if (errorMessage) {
    return (
      <section
        className="w-full flex justify-center pt-8 pb-2"
        style={{
          paddingLeft: "clamp(16px, 9.375vw, 135px)",
          paddingRight: "clamp(16px, 9.375vw, 135px)",
        }}
      >
        <div
          className="mx-auto w-full p-6 text-center"
          style={{ width: 1169, maxWidth: "100%" }}
        >
          <p className="text-sm text-gray-700 mb-3">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-block px-4 py-2 bg-[#B92123] text-white rounded-full text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ✅ Empty state
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full flex justify-center pt-8 pb-2"
      style={{
        paddingLeft: "clamp(16px, 9.375vw, 135px)",
        paddingRight: "clamp(16px, 9.375vw, 135px)",
      }}
    >
      <div
        className="mx-auto flex flex-col w-full items-stretch"
        style={{ width: 1169, maxWidth: "100%" }}
      >
        {/* Section 1: Title + arrows only */}
        <div
          className="flex flex-row items-center justify-between py-4 pl-0 pr-0"
          style={{
            minHeight: 45.69,
          }}
        >
          <div
            className="flex flex-row items-center flex-shrink-0"
            style={{
              gap: 15.89,
              height: 40,
            }}
          >
            <span
              className="flex-shrink-0 rounded-[3.97px]"
              style={{
                width: 19.86,
                height: 39.73,
                background: "#CB262E",
              }}
            />
            <span
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 20,
                lineHeight: "20px",
                color: "#000000",
              }}
            >
              {t("shopByCategories")}
            </span>
          </div>

          <div
            className="flex flex-row justify-end items-center flex-shrink-0"
            style={{ gap: 7.95, height: 45.69 }}
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!canGoPrev}
              className="flex items-center justify-center rounded-full bg-[#F5F5F5] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex-shrink-0"
              style={{ width: 45.69, height: 45.69 }}
              aria-label={t("previousSlide")}
            >
              <span className="inline-flex rtl:rotate-180">
                <ArrowLeftIcon size={20} strokeWidth={1.99} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={!canGoNext}
              className="flex items-center justify-center rounded-full bg-[#F5F5F5] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex-shrink-0"
              style={{ width: 45.69, height: 45.69 }}
              aria-label={t("nextSlide")}
            >
              <span className="inline-flex rtl:rotate-180">
                <ArrowRightIcon size={20} strokeWidth={1.49} />
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: 2 rows, 9 per row — left edge aligned with header red bar */}
        <div
          className="w-full grid pb-4 md:pb-6 grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 justify-items-start pl-0"
          style={{
            width: "100%",
            maxWidth: 1169,
            columnGap: "4px",
            rowGap: "16px",
          }}
        >
          {visibleCategories.map((category, idx) => (
            <Link
              key={category.id || idx}
              href={`/categories/${category?.slug}`}
              className="flex flex-col items-center justify-start text-center group overflow-hidden"
            >
              <div
                className="relative flex-shrink-0 rounded-[10px] overflow-hidden bg-gray-100 transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ width: 88, height: 88 }}
              >
                <Image
                  src={
                    category.image?.thumbnail ||
                    category.image?.src ||
                    "/assets/images/Laptops.jpg"
                  }
                  alt={category.name || t("category")}
                  width={88}
                  height={88}
                  className="object-cover w-full h-full"
                  sizes="88px"
                  loading="lazy"
                />
              </div>
              <p
                className="flex-shrink-0 mt-1 truncate w-full text-xs font-bold text-gray-800 group-hover:text-[#B92123] transition-colors"
                style={{
                  fontFamily:
                    "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  maxWidth: "100%",
                }}
              >
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

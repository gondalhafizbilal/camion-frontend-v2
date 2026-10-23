"use client";

import { useState, useEffect, useRef } from "react";
import Image from "@/componentsedit/StaticImage";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useCategories, type CategoryRecord } from "@/componentsedit/context/CategoriesContext";
import FiltersPanel, {
  type FilterApplyPayload,
} from "@/componentsedit/FiltersPanel";

const InlineFilterIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M4 6h10" />
    <path d="M4 12h16" />
    <path d="M4 18h10" />
    <circle cx="17" cy="6" r="2" />
    <circle cx="9" cy="18" r="2" />
  </svg>
);

export type FilterProps = {
  embedded?: boolean;
  variant?: "header";
};

/**
 * embedded=true -> inside search bar (pill style, inline icon)
 * variant="header" -> header search bar (filter_v2.svg icon)
 * else -> legacy absolute positioning
 */
function Filter({ embedded = false, variant }: FilterProps) {
  const isHeader = variant === "header";
  const [showPopup, setShowPopup] = useState(false);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceMax] = useState(100);
  const [selectedColour] = useState("");
  const [selectedSize] = useState("");

  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const categoriesCtx = useCategories();

  useEffect(() => {
    if (Array.isArray(categoriesCtx.flatCategories)) {
      setCategories(categoriesCtx.flatCategories);
    }
  }, [categoriesCtx.flatCategories]);

  useEffect(() => {
    if (!categories || categories.length === 0) return;

    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      return;
    }

    const categoryPageMatch = pathname.match(/\/categories\/([^/]+)/);
    if (categoryPageMatch) {
      setSelectedCategory(categoryPageMatch[1]);
      return;
    }

    if (categories.length > 0 && !selectedCategory) {
      const first = categories[0]?.slug;
      if (first) setSelectedCategory(first);
    }
  }, [categories, pathname, searchParams]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showPopup) {
        setShowPopup(false);
        filterButtonRef.current?.focus();
      }
    };
    if (showPopup) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showPopup]);

  useEffect(() => {
    const handleOutsideClick = (e: Event) => {
      if (!showPopup) return;
      const target = e.target;
      if (
        target instanceof Node &&
        wrapperRef.current &&
        !wrapperRef.current.contains(target)
      ) {
        setShowPopup(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showPopup]);

  const handleFilterApply = (filters: FilterApplyPayload) => {
    const next = new URLSearchParams(searchParams.toString());
    const FILTER_KEYS = [
      "category",
      "minPrice",
      "maxPrice",
      "colour",
      "size",
    ] as const;
    for (const k of FILTER_KEYS) next.delete(k);

    if (filters?.category) next.set("category", filters.category);
    if (filters?.minPrice != null)
      next.set("minPrice", String(filters.minPrice));
    if (filters?.maxPrice != null)
      next.set("maxPrice", String(filters.maxPrice));
    if (filters?.colour) next.set("colour", filters.colour);
    if (filters?.size) next.set("size", filters.size);

    const qs = next.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
    setShowPopup(false);
  };

  return (
    <div ref={wrapperRef} className={embedded || isHeader ? "relative" : ""}>
      <button
        ref={filterButtonRef}
        onClick={() => setShowPopup((s) => !s)}
        aria-label="Filter products"
        aria-expanded={showPopup}
        aria-haspopup="dialog"
        aria-controls="filter-popup"
        type="button"
        className={
          embedded
            ? "cursor-pointer w-9 h-9 flex items-center justify-center rounded-full text-[#B92123] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B92123] focus:ring-offset-2"
            : isHeader
              ? "cursor-pointer flex items-center justify-center p-0.5 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#CB262E] focus:ring-offset-1 text-black"
              : "absolute cursor-pointer end-12 top-1/2 -translate-y-1/2 p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[#B92123] focus:ring-offset-2"
        }
      >
        {embedded ? (
          <InlineFilterIcon className="w-5 h-5" />
        ) : isHeader ? (
          <Image src="/assets/icons/filter_v2.svg" alt="" width={24} height={24} aria-hidden />
        ) : (
          <Image src="/assets/icons/filter.svg" alt="" width={20} height={20} unoptimized aria-hidden />
        )}
      </button>

      {showPopup && (
        <>
          <div className="fixed inset-0 z-[999] md:hidden" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close filters"
              onClick={() => setShowPopup(false)}
            />
            <div
              ref={modalRef}
              id="filter-popup"
              className="absolute inset-x-0 bottom-0 px-3 pb-3"
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-title"
            >
              <div className="w-full mx-auto max-w-[620px]">
                <FiltersPanel
                  categories={categories}
                  selectedCategory={selectedCategory}
                  selectedColour={selectedColour}
                  selectedSize={selectedSize}
                  priceMax={priceMax}
                  currencyCode="QAR"
                  onApply={handleFilterApply}
                  onClose={() => setShowPopup(false)}
                />
              </div>
            </div>
          </div>

          <div
            ref={modalRef}
            id="filter-popup"
            className={[
              "hidden md:block",
              isHeader || embedded
                ? "absolute z-[999] end-0 top-full mt-2"
                : "absolute z-[999] left-1/2 -translate-x-1/2 top-full mt-2",
            ].join(" ")}
            style={{ maxWidth: "min(620px, 95vw)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
          >
            <FiltersPanel
              categories={categories}
              selectedCategory={selectedCategory}
              selectedColour={selectedColour}
              selectedSize={selectedSize}
              priceMax={priceMax}
              currencyCode="QAR"
              onApply={handleFilterApply}
              onClose={() => setShowPopup(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Filter;

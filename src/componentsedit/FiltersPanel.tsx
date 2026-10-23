"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CategoryRecord } from "@/componentsedit/context/CategoriesContext";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";

const CHEVRON_DOWN = (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="opacity-80 flex-shrink-0" aria-hidden>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type ColourOption = {
  value: string;
  hex: string;
  border?: boolean;
};

const DEFAULT_COLOURS: ColourOption[] = [
  { value: "black", hex: "#000000" },
  { value: "white", hex: "#FFFFFF", border: true },
  { value: "red", hex: "#F40101" },
  { value: "blue", hex: "#0000FF" },
];
const DEFAULT_SIZES = ["UK 6", "UK 8", "uk 9", "uk 10"];

export type FilterApplyPayload = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colour?: string;
  size?: string;
};

type CategoryPill = { slug: string; name: string };

export type FiltersPanelProps = {
  categories?: CategoryRecord[];
  colours?: ColourOption[];
  sizes?: string[];
  selectedCategory?: string;
  selectedColour?: string;
  selectedSize?: string;
  priceMin?: number;
  priceMax?: number;
  currencyCode?: string;
  onApply?: (filters: FilterApplyPayload) => void;
  onClose?: () => void;
};

export default function FiltersPanel({
  categories = [],
  colours = DEFAULT_COLOURS,
  sizes = DEFAULT_SIZES,
  selectedCategory = "",
  selectedColour = "",
  selectedSize = "",
  priceMin = 10,
  priceMax = 100,
  currencyCode = "QAR",
  onApply,
  onClose,
}: FiltersPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localColour, setLocalColour] = useState(selectedColour);
  const [localSize, setLocalSize] = useState(selectedSize);
  const [localPriceMax, setLocalPriceMax] = useState(priceMax);

  const categoryOptions = useMemo(
    () =>
      categories.length
        ? categories.map((c) => ({
            value: String(c.slug ?? ""),
            label: String(c.name ?? c.slug ?? ""),
          }))
        : [{ value: "", label: t("category") || "Category" }],
    [categories, t],
  );

  const categoryPills = useMemo((): CategoryPill[] => {
    if (categories.length) {
      return categories.map((c) => ({
        slug: String(c.slug ?? c.id ?? ""),
        name: String(c.name ?? c.slug ?? ""),
      }));
    }
    return [
      { slug: "outerwear", name: "Outerwear" },
      { slug: "denim", name: "Denim" },
    ];
  }, [categories]);

  const handleApply = () => {
    onApply?.({
      category: localCategory || undefined,
      colour: localColour || undefined,
      size: localSize || undefined,
      minPrice: priceMin,
      maxPrice: localPriceMax,
    });
    onClose?.();
  };

  return (
    <div
      className={[
        "bg-white shadow-lg border border-black/10 overflow-hidden flex flex-col",
        "w-full md:w-[620px]",
        "rounded-t-[16px] md:rounded-b-lg md:rounded-t-none",
      ].join(" ")}
      style={{ minHeight: 0, maxHeight: "85vh" }}
      role="dialog"
      aria-modal="true"
      aria-label={t("filterProducts") || "Filter products"}
    >
      <div className="flex flex-col p-6 gap-6 overflow-y-auto flex-1">
        <div className="flex flex-col gap-2" dir="ltr">
          <div className="flex items-center justify-between gap-2" style={{ height: 24 }}>
            <span className="font-sans font-medium text-black capitalize" style={{ fontSize: 12, lineHeight: "18px" }}>
              {formatAmountWithCurrency(10, currencyCode, locale)}
            </span>
            <span className="font-sans font-medium text-black capitalize" style={{ fontSize: 12, lineHeight: "18px" }}>
              {formatAmountWithCurrency(50, currencyCode, locale)}
            </span>
            <span className="font-sans font-medium text-black capitalize text-end" style={{ fontSize: 12, lineHeight: "18px" }}>
              {formatAmountWithCurrency(100, currencyCode, locale)}
            </span>
          </div>
          <div className="relative flex items-center" style={{ height: 24 }}>
            <div className="absolute inset-x-0 flex items-center" style={{ top: 6, height: 4 }}>
              <div className="w-full h-full rounded-full bg-[#A4A4A4]" />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black flex-shrink-0 z-0" aria-hidden />
            <input
              type="range"
              min={priceMin}
              max={100}
              step={1}
              value={localPriceMax}
              onChange={(e) => setLocalPriceMax(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Price"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#CB262E] flex-shrink-0 pointer-events-none z-0"
              style={{ left: `calc(${((localPriceMax - priceMin) / (100 - priceMin)) * 100}% - 12px)` }}
              aria-hidden
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black flex-shrink-0 z-0" aria-hidden />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full flex flex-row items-center justify-between box-border px-3 py-2 bg-white border border-black/15 rounded-[5px] font-sans font-medium text-black text-start"
            style={{ height: 40, fontSize: 14, lineHeight: "24px" }}
          >
            <span className="flex-1 truncate">
              {categoryOptions.find((o) => o.value === localCategory)?.label || t("category") || "Category"}
            </span>
            {CHEVRON_DOWN}
          </button>
          <div className="flex flex-row items-center gap-4 overflow-x-auto scrollbar-hide py-1" style={{ minHeight: 30 }}>
            {categoryPills.map((cat) => (
              <button
                key={cat.slug || cat.name}
                type="button"
                onClick={() => setLocalCategory(localCategory === cat.slug ? "" : cat.slug)}
                className="flex-shrink-0 flex items-center justify-center px-3 rounded-[5px] font-sans font-medium text-xs capitalize whitespace-nowrap transition-colors"
                style={{
                  height: 30,
                  lineHeight: "24px",
                  background: localCategory === cat.slug ? "#000000" : "transparent",
                  color: localCategory === cat.slug ? "#FFFFFF" : "#000000",
                  border: localCategory === cat.slug ? "none" : "1px solid rgba(0,0,0,0.15)",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full flex flex-row items-center justify-between box-border px-3 py-2 bg-white border border-black/15 rounded-[5px] font-sans font-medium text-black text-start"
            style={{ height: 40, fontSize: 14, lineHeight: "24px" }}
          >
            <span className="flex-1 truncate">
              {localColour ? colours.find((c) => c.value === localColour)?.value : t("colours") || "Colour"}
            </span>
            {CHEVRON_DOWN}
          </button>
          <div className="flex flex-row items-center gap-2 flex-wrap">
            {colours.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setLocalColour(localColour === c.value ? "" : c.value)}
                className="flex-shrink-0 w-9 h-[30px] rounded flex items-center justify-center border border-black/15 transition-all"
                style={{ background: c.hex, borderWidth: c.border ? "0.54px" : 0, borderColor: c.border ? "#000" : "transparent" }}
                title={c.value}
                aria-label={c.value}
              >
                {c.border && <span className="sr-only">{c.value}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full flex flex-row items-center justify-between box-border px-3 py-2 bg-white border border-black/15 rounded-[5px] font-sans font-medium text-black text-start"
            style={{ height: 40, fontSize: 14, lineHeight: "24px" }}
          >
            <span className="flex-1 truncate">{localSize || t("size") || "Size"}</span>
            {CHEVRON_DOWN}
          </button>
          <div className="flex flex-row items-center gap-2 overflow-x-auto scrollbar-hide py-1" style={{ minHeight: 30 }}>
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setLocalSize(localSize === s ? "" : s)}
                className="flex-shrink-0 flex items-center justify-center px-3 rounded-[5px] font-sans font-medium text-xs capitalize whitespace-nowrap bg-black text-white transition-colors"
                style={{ height: 30, lineHeight: "24px" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center p-6 pt-0">
        <button
          type="button"
          onClick={handleApply}
          className="flex items-center justify-center font-sans font-medium text-white bg-[#CB262E] rounded-[5px] hover:opacity-90 transition-opacity capitalize"
          style={{ width: 343, height: 50, padding: "20px 34px", fontSize: 16, lineHeight: "24px" }}
        >
          {t("apply")}
        </button>
      </div>
    </div>
  );
}

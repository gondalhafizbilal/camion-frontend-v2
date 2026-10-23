"use client";

import { useTranslations } from "next-intl";
import {
  getProductListSortOptions,
  PRODUCT_POPULAR_SORT,
  PRODUCT_SEARCH_SORT,
  type ProductListSortMode,
  type ProductListSortValue,
} from "@/services/graphql/constants/productSearchSort";

const SORT_LABEL_KEYS: Record<ProductListSortValue, string> = {
  [PRODUCT_SEARCH_SORT.BEST_MATCH]: "shopSortBestMatch",
  [PRODUCT_SEARCH_SORT.PRICE_LOW_TO_HIGH]: "shopSortPriceLowToHigh",
  [PRODUCT_SEARCH_SORT.PRICE_HIGH_TO_LOW]: "shopSortPriceHighToLow",
  [PRODUCT_SEARCH_SORT.BEST_SELLERS]: "shopSortBestSellers",
  [PRODUCT_SEARCH_SORT.MOST_FAVORITED]: "shopSortMostFavorited",
  [PRODUCT_SEARCH_SORT.NEW_ARRIVALS]: "shopSortNewArrivals",
  [PRODUCT_SEARCH_SORT.MOST_RATED]: "shopSortMostRated",
  [PRODUCT_POPULAR_SORT.MOST_VIEWED]: "shopSortMostViewed",
};

type ProductListSortSelectProps = {
  value: ProductListSortValue;
  onChange: (value: ProductListSortValue) => void;
  /** `search` / `popular` / `catalog` — controls which sort values are offered. */
  mode?: ProductListSortMode;
  className?: string;
};

export default function ProductListSortSelect({
  value,
  onChange,
  mode = "catalog",
  className = "",
}: ProductListSortSelectProps) {
  const t = useTranslations();
  const options = getProductListSortOptions(mode);

  return (
    <label
      className={`flex w-full max-w-full shrink-0 flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3 ${className}`.trim()}
    >
      <span className="shrink-0 font-sans text-sm font-medium text-black">
        {t("sortBy")}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProductListSortValue)}
        className="box-border min-h-[44px] w-full min-w-0 rounded-md border border-black/20 bg-white px-3 py-2 font-sans text-sm text-black shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#CB262E]/40 sm:min-w-[220px]"
        aria-label={t("sortBy")}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {t(SORT_LABEL_KEYS[option])}
          </option>
        ))}
      </select>
    </label>
  );
}

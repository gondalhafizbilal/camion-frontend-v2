"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  maxDeliveryDistributionPercentage,
  PRODUCT_DELIVERY_DISTRIBUTION,
  PRODUCT_DELIVERY_FASTEST_DAYS,
  PRODUCT_DELIVERY_MAX_DAYS,
  PRODUCT_DELIVERY_MIN_DAYS,
} from "@/lib/product/productDeliveryEstimate";
import { BRAND_CALLOUT_BG, BRAND_ORANGE, BRAND_RED } from "@/lib/styles/brandWarmGradient";
import { pushGtmEvent } from "@/componentsedit/analytics/gtmDataLayer";

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" />
      <path d="M3 9l4 0" />
    </svg>
  );
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${
        expanded ? "rotate-90" : "rtl:rotate-180"
      }`}
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TapIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path
        d="M8 13V4.5a1.5 1.5 0 013 0V12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 11.5v-2a1.5 1.5 0 013 0V14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10.5a1.5 1.5 0 013 0V16a6 6 0 01-6 6h-2a6 6 0 01-6-6v-4a1.5 1.5 0 013 0v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" className="shrink-0 text-black/45" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" className="shrink-0 text-black/45" aria-hidden>
      <path
        d="M20 12V8a2 2 0 00-2-2h-3.5L12 3 4.5 10.5A2 2 0 004 12v4a2 2 0 002 2h4a2 2 0 001.5-.67L20 12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" />
    </svg>
  );
}

function ProductShippingDetailsPanel() {
  const t = useTranslations();
  const maxPercentage = maxDeliveryDistributionPercentage();

  return (
    <div
      id="product-shipping-details"
      className="flex flex-col gap-3 border-t border-black/10 pt-3 sm:pt-4"
    >
      <div className="overflow-hidden rounded-[5px] border border-black/15">
        <div className="flex items-center gap-2 border-b border-black/10 px-3 py-2.5">
          <ClockIcon />
          <span className="min-w-0 flex-1 font-sans text-[10px] leading-3 text-black/70">
            {t("productShippingDeliveryTime")}
          </span>
          <span className="shrink-0 font-sans text-[10px] font-semibold leading-3 text-black tabular-nums">
            {t("productShippingDeliveryTimeRange", {
              min: PRODUCT_DELIVERY_MIN_DAYS,
              max: PRODUCT_DELIVERY_MAX_DAYS,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <TagIcon />
          <span className="min-w-0 flex-1 font-sans text-[10px] leading-3 text-black/70">
            {t("productShippingCosts")}
          </span>
          <span className="shrink-0 font-sans text-[10px] font-bold uppercase leading-3 tracking-wide text-[#CB262E]">
            {t("productShippingFreeCost")}
          </span>
        </div>
      </div>

      <div className="rounded-[5px] bg-[#FAFAFA] p-2.5">
        <ul className="flex flex-col gap-2">
          {PRODUCT_DELIVERY_DISTRIBUTION.map((row) => {
            const barWidth =
              maxPercentage > 0 ? (row.percentage / maxPercentage) * 100 : 0;
            return (
              <li
                key={`${row.labelKey}-${row.days}`}
                className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-center gap-x-1.5"
              >
                <span className="font-sans text-[10px] leading-3 text-black/75 whitespace-nowrap">
                  {t(row.labelKey, { days: row.days })}
                </span>
                <div className="h-1.5 min-w-[28px] overflow-hidden rounded-full bg-black/[0.08]" aria-hidden>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${BRAND_RED} 0%, ${BRAND_ORANGE} 100%)`,
                    }}
                  />
                </div>
                <span className="font-sans text-[10px] font-semibold leading-3 tabular-nums text-black whitespace-nowrap">
                  {row.percentage.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function ProductShippingSection({
  productId,
  variantId,
  category,
}: {
  productId?: string | number;
  variantId?: string | number | null;
  category?: string;
}) {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    if (!expanded) {
      pushGtmEvent("view_delivery_info", {
        product_id: productId,
        variant_id: variantId || undefined,
        category,
        source: "pdp_shipping_section",
      });
    }
    setExpanded(!expanded);
  };

  return (
    <div className="box-border w-full min-w-0 overflow-hidden rounded-[5px] border border-black/15 bg-white">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="product-shipping-details"
        className="flex w-full min-w-0 flex-col gap-3 p-3 text-start transition-colors hover:bg-black/[0.02] sm:p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-1 font-sans text-xs font-semibold text-[#2E7D32]">
            <TruckIcon className="text-[#2E7D32]" />
            {t("productShippingFreeShippingBadge")}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-semibold"
            style={{ background: BRAND_CALLOUT_BG, color: BRAND_RED }}
          >
            <LightningIcon className="text-[#CB262E]" />
            {t("productShippingFastestDeliveryBadge", {
              days: PRODUCT_DELIVERY_FASTEST_DAYS,
            })}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px]"
            style={{ background: BRAND_CALLOUT_BG, color: BRAND_RED }}
          >
            <TruckIcon />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-base font-semibold text-black">
                {t("shipping")}
              </span>
              <span
                className="inline-flex rounded px-2 py-0.5 font-sans text-[11px] font-bold uppercase tracking-wide"
                style={{ background: BRAND_CALLOUT_BG, color: BRAND_RED }}
              >
                {t("productShippingFastBadge")}
              </span>
            </div>
            <p className="mt-0.5 font-sans text-sm leading-5 text-black/70">
              {t("productShippingFastestDescription", {
                days: PRODUCT_DELIVERY_FASTEST_DAYS,
              })}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 font-sans text-sm font-medium text-[#CB262E] underline underline-offset-2">
              {expanded ? t("productShippingHideDetails") : t("productShippingTapForDetails")}
              <TapIcon />
            </span>
          </div>

          <span className="text-[#CB262E]">
            <ChevronIcon expanded={expanded} />
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <ProductShippingDetailsPanel />
        </div>
      ) : null}
    </div>
  );
}

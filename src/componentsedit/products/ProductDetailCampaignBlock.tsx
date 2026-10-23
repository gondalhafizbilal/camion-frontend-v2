"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";
import CampaignSectionHeader from "@/componentsedit/campaign/CampaignSectionHeader";
import ProductCampaignCountdownBar from "@/componentsedit/products/ProductCampaignCountdownBar";
import { buildCampaignCollectionHref } from "@/lib/campaign/campaignCollection";
import { forwardChevronGlyph } from "@/lib/i18n/forwardArrow";
import { isCampaignCountdownActive } from "@/lib/campaign/campaignCountdown";
import {
  CAMPAIGN_HEADER_GRADIENT,
  CAMPAIGN_ACCENT_COLOR,
  CAMPAIGN_CALLOUT_BG,
  CAMPAIGN_GRADIENT_SHADOW,
} from "@/lib/styles/campaignGradient";
import {
  DISCOUNT_PERCENT_DIR,
  formatDiscountPercentLabel,
} from "@/lib/formatDiscountPercent";

const FONT = "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif";

export function isProductCampaignPurchaseFrameActive(
  campaign?: CarouselProductCampaign | null,
): boolean {
  if (!campaign?.name?.trim()) return false;
  return isCampaignCountdownActive({
    startsAt: campaign.startsAt ?? null,
    finishesAt: campaign.finishesAt ?? null,
  });
}

type ProductDetailCampaignPurchaseFrameProps = {
  campaign: CarouselProductCampaign;
  children: ReactNode;
  className?: string;
};

/**
 * Orange-bordered purchase panel for campaign PDPs — wraps variant pickers through quantity.
 */
export function ProductDetailCampaignPurchaseFrame({
  campaign,
  children,
  className = "",
}: ProductDetailCampaignPurchaseFrameProps) {
  if (!isProductCampaignPurchaseFrameActive(campaign)) return <>{children}</>;

  return (
    <div
      className={`mb-6 overflow-hidden rounded-md border border-black/10 bg-[#FAFAFA] ${className}`.trim()}
    >
      <CampaignSectionHeader campaign={campaign} density="compact" />
      <div className="flex flex-col gap-0 bg-white px-3 py-3 sm:px-4 sm:py-4">{children}</div>
    </div>
  );
}

type ProductDetailCampaignStripProps = {
  campaign?: CarouselProductCampaign | null;
  className?: string;
};

/** Flush campaign countdown bar for PDP gallery (below product image). */
export function ProductDetailCampaignStrip({
  campaign,
  className = "",
}: ProductDetailCampaignStripProps) {
  if (!campaign?.name?.trim()) return null;

  const timing = {
    startsAt: campaign.startsAt ?? null,
    finishesAt: campaign.finishesAt ?? null,
  };
  if (!isCampaignCountdownActive(timing)) return null;

  return (
    <div className={`h-8 w-full shrink-0 leading-none sm:h-9 ${className}`.trim()}>
      <ProductCampaignCountdownBar
        campaign={campaign}
        className="h-full min-h-0 rounded-none py-0 text-[10px] sm:text-[11px]"
      />
    </div>
  );
}

type ProductDetailCampaignCalloutProps = {
  campaign?: CarouselProductCampaign | null;
  className?: string;
};

/** Campaign summary + link on PDP info column (above price). */
export function ProductDetailCampaignCallout({
  campaign,
  className = "",
}: ProductDetailCampaignCalloutProps) {
  const t = useTranslations();
  const locale = useLocale();
  if (!campaign?.name?.trim()) return null;

  const timing = {
    startsAt: campaign.startsAt ?? null,
    finishesAt: campaign.finishesAt ?? null,
  };
  if (!isCampaignCountdownActive(timing)) return null;

  const name = campaign.name.trim();
  const brief = campaign.brief?.trim() || "";
  const discount = Number(campaign.discountPercentage);
  const hasDiscount = Number.isFinite(discount) && discount > 0;
  const href = buildCampaignCollectionHref(campaign.slug);

  return (
    <div
      className={`mb-4 overflow-hidden rounded-lg border border-[#CB262E]/20 ${className}`.trim()}
      style={{ boxShadow: CAMPAIGN_GRADIENT_SHADOW }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 sm:px-4"
        style={{ background: CAMPAIGN_HEADER_GRADIENT }}
      >
        <span className="text-base leading-none text-white" aria-hidden>
          ⚡
        </span>
        <span
          className="min-w-0 flex-1 truncate text-sm font-semibold text-white sm:text-base"
          style={{ fontFamily: FONT }}
        >
          {name}
        </span>
        {hasDiscount ? (
          <span
            dir={DISCOUNT_PERCENT_DIR}
            className="shrink-0 rounded bg-white/95 px-2 py-0.5 text-xs font-bold sm:text-sm"
            style={{ fontFamily: FONT, color: CAMPAIGN_ACCENT_COLOR }}
          >
            {formatDiscountPercentLabel(discount)}
          </span>
        ) : null}
      </div>
      {(brief || href) && (
        <div
          className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4"
          style={{ background: CAMPAIGN_CALLOUT_BG }}
        >
          {brief ? (
            <p className="m-0 min-w-0 text-xs leading-snug text-gray-700 sm:text-sm">
              {brief}
            </p>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          {href ? (
            <Link
              href={href}
              className="shrink-0 text-xs font-semibold hover:underline sm:text-sm"
              style={{ fontFamily: FONT, color: CAMPAIGN_ACCENT_COLOR }}
            >
              {t("discoverMore")} {forwardChevronGlyph(locale)}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

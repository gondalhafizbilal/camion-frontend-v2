"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";
import CampaignBarProgressOverlay from "@/componentsedit/campaign/CampaignBarProgressOverlay";
import {
  getCampaignCountdownParts,
  getCampaignProgressWidthPercent,
  isCampaignCountdownActive,
  type CampaignCountdownParts,
} from "@/lib/campaign/campaignCountdown";
import {
  CAMPAIGN_HEADER_GRADIENT,
  CAMPAIGN_PROGRESS_BAR_GRADIENT,
  CAMPAIGN_ACCENT_COLOR,
} from "@/lib/styles/campaignGradient";
import {
  DISCOUNT_PERCENT_DIR,
  formatDiscountPercentLabel,
} from "@/lib/formatDiscountPercent";

const FONT = "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif";

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function formatCampaignEndsInClock(parts: CampaignCountdownParts): string {
  if (parts.days > 0) {
    return `${parts.days}d ${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
  }
  return `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
}

export type CampaignSectionHeaderState = {
  countdownActive: boolean;
  endsInLabel: string;
  progressWidth: number;
};

export function readCampaignSectionHeaderState(
  campaign: CarouselProductCampaign,
  nowMs = Date.now(),
): CampaignSectionHeaderState {
  const timing = {
    startsAt: campaign.startsAt ?? null,
    finishesAt: campaign.finishesAt ?? null,
  };
  const countdownActive = isCampaignCountdownActive(timing, nowMs);
  if (!countdownActive) {
    return { countdownActive: false, endsInLabel: "", progressWidth: 0 };
  }
  const parts = getCampaignCountdownParts(timing.finishesAt, nowMs);
  if (!parts || parts.expired) {
    return { countdownActive: false, endsInLabel: "", progressWidth: 0 };
  }
  return {
    countdownActive: true,
    endsInLabel: formatCampaignEndsInClock(parts),
    progressWidth: getCampaignProgressWidthPercent(timing, nowMs),
  };
}

function CampaignClockIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

type CampaignSectionHeaderProps = {
  campaign: CarouselProductCampaign;
  /** Fallback title when campaign name is empty. */
  fallbackTitle?: string;
  /** `compact` stacks content for narrow PDP purchase panels. */
  density?: "default" | "compact";
  className?: string;
};

/** Red campaign bar matching mobile app (PDP + home). */
export default function CampaignSectionHeader({
  campaign,
  fallbackTitle = "",
  density = "default",
  className = "",
}: CampaignSectionHeaderProps) {
  const t = useTranslations();
  const name = String(campaign.name ?? "").trim() || fallbackTitle.trim();

  const [header, setHeader] = useState<CampaignSectionHeaderState>(() =>
    readCampaignSectionHeaderState(campaign),
  );

  useEffect(() => {
    if (!campaign.finishesAt) {
      setHeader({ countdownActive: false, endsInLabel: "", progressWidth: 0 });
      return;
    }
    const tick = () => setHeader(readCampaignSectionHeaderState(campaign));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [campaign]);

  if (!name) return null;

  const discount = Number(campaign.discountPercentage);
  const hasDiscount = Number.isFinite(discount) && discount > 0;

  const progressOverlay = header.countdownActive ? (
    <CampaignBarProgressOverlay widthPercent={header.progressWidth} chevronPx={9} />
  ) : null;

  const discountBadge = hasDiscount ? (
    <span
      dir={DISCOUNT_PERCENT_DIR}
      className="relative z-[1] shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-extrabold sm:text-sm"
      style={{ fontFamily: FONT, color: CAMPAIGN_ACCENT_COLOR }}
    >
      {formatDiscountPercentLabel(discount)}
    </span>
  ) : null;

  const countdownBlock = header.countdownActive ? (
    <div
      className="relative z-[1] flex shrink-0 items-center gap-1.5 text-white"
      aria-label={
        density === "compact"
          ? `${t("campaignEndsIn")} ${header.endsInLabel}`
          : undefined
      }
    >
      <CampaignClockIcon />
      <span
        className="whitespace-nowrap text-[11px] font-semibold tabular-nums sm:text-xs"
        style={{ fontFamily: FONT }}
      >
        {density === "compact" ? (
          <span aria-hidden>{header.endsInLabel}</span>
        ) : (
          <>
            {t("campaignEndsIn")} {header.endsInLabel}
          </>
        )}
      </span>
    </div>
  ) : null;

  const progressBar = header.countdownActive ? (
    <div
      className={`relative z-[1] h-1.5 min-w-0 overflow-hidden rounded-full bg-white/25 ${
        density === "compact" ? "flex-1" : "hidden min-w-[48px] flex-1 sm:block"
      }`}
      aria-hidden
    >
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-linear"
        style={{
          width: `${header.progressWidth}%`,
          background: CAMPAIGN_PROGRESS_BAR_GRADIENT,
        }}
      />
    </div>
  ) : density === "default" ? (
    <span className="relative z-[1] hidden min-w-0 flex-1 sm:block" aria-hidden />
  ) : null;

  const lightningBadge = (
    <span
      className="relative z-[1] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm text-white ring-1 ring-white/25 sm:h-8 sm:w-8 sm:text-base"
      aria-hidden
    >
      ⚡
    </span>
  );

  if (density === "compact") {
    return (
      <div
        className={`relative w-full overflow-hidden px-3 py-2 sm:px-3.5 sm:py-2.5 ${className}`.trim()}
        style={{ background: CAMPAIGN_HEADER_GRADIENT }}
      >
        {progressOverlay}
        <div className="relative z-[1] flex flex-col gap-1.5">
          <div className="flex min-w-0 items-start gap-2">
            {lightningBadge}
            <span
              className="min-w-0 flex-1 text-sm font-bold italic leading-snug text-white sm:text-[15px]"
              style={{ fontFamily: FONT }}
            >
              {name}
            </span>
            {discountBadge}
          </div>
          {header.countdownActive ? (
            <div className="flex min-w-0 items-center gap-2 ps-9">
              {progressBar}
              {countdownBlock}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-[40px] w-full items-center gap-2 overflow-hidden px-3 py-2 sm:min-h-[44px] sm:gap-3 sm:px-4 sm:py-2.5 ${className}`.trim()}
      style={{ background: CAMPAIGN_HEADER_GRADIENT }}
    >
      {progressOverlay}

      {lightningBadge}

      <span
        className="relative z-[1] min-w-0 flex-1 truncate text-sm font-bold italic text-white sm:text-base"
        style={{ fontFamily: FONT }}
      >
        {name}
      </span>

      {progressBar}

      {discountBadge}

      {countdownBlock ? (
        <div className="relative z-[1] ml-auto">{countdownBlock}</div>
      ) : null}
    </div>
  );
}

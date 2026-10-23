"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";
import {
  getCartCampaignEndsFormat,
  isCampaignCountdownActive,
  type CartCampaignEndsUnit,
} from "@/lib/campaign/campaignCountdown";
import { CAMPAIGN_ACCENT_COLOR } from "@/lib/styles/campaignGradient";

type CartLineCampaignUrgencyProps = {
  campaign?: CarouselProductCampaign | null;
  className?: string;
  textClassName?: string;
};

function CartCampaignClockIcon() {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: CAMPAIGN_ACCENT_COLOR }}
      aria-hidden
    >
      <svg
        width={10}
        height={10}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v4.5l2.5 1.5" />
      </svg>
    </span>
  );
}

function readEndsTimeLabel(
  t: ReturnType<typeof useTranslations>,
  unit: CartCampaignEndsUnit,
  count: number,
): string {
  if (unit === "days") {
    return t("cartCampaignEndsInDays", { count });
  }
  if (unit === "hours") {
    return t("cartCampaignEndsInHours", { count });
  }
  return t("cartCampaignEndsInMinutes", { count });
}

function readUrgencyLabel(
  t: ReturnType<typeof useTranslations>,
  campaignName: string,
  unit: CartCampaignEndsUnit,
  count: number,
): string {
  const timePart = readEndsTimeLabel(t, unit, count);
  const endsIn = t("campaignEndsIn");
  return campaignName ? `${campaignName} ${endsIn} ${timePart}` : `${endsIn} ${timePart}`;
}

export default function CartLineCampaignUrgency({
  campaign,
  className = "",
  textClassName = "text-[11px] leading-4 sm:text-xs sm:leading-[18px]",
}: CartLineCampaignUrgencyProps) {
  const t = useTranslations();
  const campaignName = String(campaign?.name ?? "").trim();
  const finishesAt = campaign?.finishesAt ?? null;
  const startsAt = campaign?.startsAt ?? null;
  const [label, setLabel] = useState<string | null>(() => {
    if (!isCampaignCountdownActive({ startsAt, finishesAt })) return null;
    const format = getCartCampaignEndsFormat(finishesAt);
    return format
      ? readUrgencyLabel(t, campaignName, format.unit, format.count)
      : null;
  });

  useEffect(() => {
    if (!finishesAt || !isCampaignCountdownActive({ startsAt, finishesAt })) {
      setLabel(null);
      return;
    }

    const tick = () => {
      if (!isCampaignCountdownActive({ startsAt, finishesAt })) {
        setLabel(null);
        return;
      }
      const format = getCartCampaignEndsFormat(finishesAt);
      setLabel(
        format
          ? readUrgencyLabel(t, campaignName, format.unit, format.count)
          : null,
      );
    };

    tick();
    const format = getCartCampaignEndsFormat(finishesAt);
    const intervalMs = format?.unit === "days" ? 60_000 : 1_000;
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [campaignName, finishesAt, startsAt, t]);

  if (!label) return null;

  return (
    <p
      className={`flex min-w-0 items-center gap-1.5 font-sans font-semibold ${textClassName} ${className}`.trim()}
      style={{ color: CAMPAIGN_ACCENT_COLOR }}
      aria-live="polite"
    >
      <CartCampaignClockIcon />
      <span className="min-w-0 truncate">{label}</span>
    </p>
  );
}

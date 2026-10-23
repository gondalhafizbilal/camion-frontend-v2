"use client";

import { useEffect, useState } from "react";
import type { CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";
import CampaignBarProgressOverlay from "@/componentsedit/campaign/CampaignBarProgressOverlay";
import {
  formatCampaignCountdown,
  getCampaignCountdownParts,
  getCampaignProgressWidthPercent,
  isCampaignCountdownActive,
} from "@/lib/campaign/campaignCountdown";
import { CAMPAIGN_HEADER_GRADIENT } from "@/lib/styles/campaignGradient";

const FONT = "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif";

type ProductCampaignCountdownBarProps = {
  campaign: CarouselProductCampaign;
  className?: string;
};

type CampaignBarState = {
  visible: boolean;
  label: string;
  progressWidth: number;
};

function CampaignClockIcon() {
  return (
    <svg
      width={12}
      height={12}
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

function readCampaignBarState(
  name: string,
  startsAt: string | null,
  finishesAt: string | null,
  nowMs = Date.now(),
): CampaignBarState {
  const timing = { startsAt, finishesAt };
  if (!name || !finishesAt || !isCampaignCountdownActive(timing, nowMs)) {
    return { visible: false, label: "", progressWidth: 0 };
  }
  const parts = getCampaignCountdownParts(finishesAt, nowMs);
  if (!parts || parts.expired) {
    return { visible: false, label: "", progressWidth: 0 };
  }
  return {
    visible: true,
    label: formatCampaignCountdown(parts),
    progressWidth: getCampaignProgressWidthPercent(timing, nowMs),
  };
}

export default function ProductCampaignCountdownBar({
  campaign,
  className = "",
}: ProductCampaignCountdownBarProps) {
  const name = String(campaign.name ?? "").trim();
  const finishesAt = campaign.finishesAt ?? null;
  const startsAt = campaign.startsAt ?? null;

  const [state, setState] = useState<CampaignBarState>(() =>
    readCampaignBarState(name, startsAt, finishesAt),
  );

  useEffect(() => {
    if (!name || !finishesAt) {
      setState({ visible: false, label: "", progressWidth: 0 });
      return;
    }

    const tick = () => {
      setState(readCampaignBarState(name, startsAt, finishesAt));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [finishesAt, name, startsAt]);

  if (!state.visible || !state.label) return null;

  return (
    <div
      className={`relative flex h-full w-full min-w-0 items-center overflow-hidden ${className}`.trim()}
      style={{ background: CAMPAIGN_HEADER_GRADIENT }}
      aria-live="polite"
    >
      <CampaignBarProgressOverlay widthPercent={state.progressWidth} />
      <span
        className="relative z-[1] min-w-0 flex-1 truncate px-2 text-[9px] font-semibold leading-tight text-white sm:px-[9.38px] sm:text-[10px]"
        style={{ fontFamily: FONT }}
        title={name}
      >
        {name}
      </span>
      <span
        className="relative z-[1] flex shrink-0 items-center gap-1 whitespace-nowrap px-2 text-[9px] font-medium tabular-nums text-white sm:gap-1.5 sm:px-[9.38px] sm:text-[10px]"
        style={{ fontFamily: FONT }}
      >
        <CampaignClockIcon />
        {state.label}
      </span>
    </div>
  );
}

import { campaignProgressChevronClipPath } from "@/lib/campaign/campaignCountdown";
import { CAMPAIGN_BAR_PROGRESS_GRADIENT } from "@/lib/styles/campaignGradient";

type CampaignBarProgressOverlayProps = {
  widthPercent: number;
  chevronPx?: number;
};

/** Dark gradient chevron tab that slides with campaign elapsed progress (mobile app). */
export default function CampaignBarProgressOverlay({
  widthPercent,
  chevronPx,
}: CampaignBarProgressOverlayProps) {
  if (widthPercent <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-1000 ease-linear"
      style={{
        width: `${widthPercent}%`,
        background: CAMPAIGN_BAR_PROGRESS_GRADIENT,
        clipPath: campaignProgressChevronClipPath(chevronPx),
      }}
      aria-hidden
    />
  );
}

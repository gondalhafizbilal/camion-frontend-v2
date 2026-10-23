import {
  BRAND_CALLOUT_BG,
  BRAND_RED,
  BRAND_WARM_PROGRESS_FILL_GRADIENT,
} from "@/lib/styles/brandWarmGradient";

/** Add to Cart button red (`bg-[#CB262E]`). */
export const CAMPAIGN_RED_BRIGHT = BRAND_RED;

/** Low dark — darker tint of button red (base bar, after chevron). */
export const CAMPAIGN_RED_LOW = "#B52229" as const;

/** Deep dark — deepest tint of button red (chevron tab start). */
export const CAMPAIGN_RED_DEEP = "#8B1A22" as const;

export const CAMPAIGN_BRAND_RED = BRAND_RED;

/** After chevron — low dark → Add to Cart red. */
export const CAMPAIGN_HEADER_GRADIENT =
  `linear-gradient(90deg, ${CAMPAIGN_RED_LOW} 0%, ${CAMPAIGN_RED_BRIGHT} 100%)` as const;

/** Till chevron — deep dark → Add to Cart red. */
export const CAMPAIGN_BAR_PROGRESS_GRADIENT =
  `linear-gradient(90deg, ${CAMPAIGN_RED_DEEP} 0%, ${CAMPAIGN_RED_BRIGHT} 100%)` as const;

/** Progress pill fill — gold lightning gradient (#FFE566 → #FFB347). */
export const CAMPAIGN_PROGRESS_BAR_GRADIENT = BRAND_WARM_PROGRESS_FILL_GRADIENT;

export const CAMPAIGN_ACCENT_COLOR = BRAND_RED;

export const CAMPAIGN_CALLOUT_BG = BRAND_CALLOUT_BG;

export const CAMPAIGN_GRADIENT_SHADOW = "0 4px 14px rgba(203, 38, 46, 0.28)" as const;

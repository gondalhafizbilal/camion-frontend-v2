/** Brand warm palette — single source for header, buttons, cart, and campaign UI. */

export const BRAND_RED = "#CB262E" as const;
export const BRAND_ORANGE = "#F47919" as const;
export const BRAND_RED_DARK = "#9B1F26" as const;
export const BRAND_ORANGE_DARK = "#C44A14" as const;

/** Site header primary bar (`HeaderPrimaryBar`). */
export const BRAND_HEADER_GRADIENT =
  "linear-gradient(90.26deg, #CB262E 53.4%, #F47919 150.48%)" as const;

/** Cart subtotal strip, campaign headers, warm promo bars. */
export const BRAND_WARM_GRADIENT =
  `linear-gradient(90deg, ${BRAND_RED} 0%, ${BRAND_ORANGE} 100%)` as const;

/** Darker overlay for countdown progress chevron / fill sweep. */
export const BRAND_WARM_GRADIENT_PROGRESS =
  `linear-gradient(90deg, ${BRAND_RED_DARK} 0%, ${BRAND_ORANGE_DARK} 100%)` as const;

/** Gold accent for progress bars on warm gradient surfaces. */
export const BRAND_WARM_PROGRESS_FILL_GRADIENT =
  "linear-gradient(90deg, #FFE566 0%, #FFB347 100%)" as const;

export const BRAND_WARM_GRADIENT_SHADOW =
  "0 4px 14px rgba(203, 38, 46, 0.28)" as const;

/** Light red tint for callouts and soft highlights (matches checkout shipping row). */
export const BRAND_CALLOUT_BG = "#FFF5F5" as const;

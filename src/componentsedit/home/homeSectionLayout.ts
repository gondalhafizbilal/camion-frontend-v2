import {
  PAGE_CONTENT_INNER_CLASS,
  PAGE_CONTENT_MAX_WIDTH_CLASS,
  PAGE_DESKTOP_SECTION_X_PADDING_CLASS,
} from "@/lib/layout/pageContentLayout";

/**
 * Horizontal inset for home main content (product carousels, dividers, services).
 * Mobile/tablet unchanged; desktop (lg+) uses half the original clamp / 2xl inset.
 */
export const HOME_SECTION_X_PADDING_CLASS =
  `px-3 md:px-[clamp(16px,9.375vw,135px)] ${PAGE_DESKTOP_SECTION_X_PADDING_CLASS}`;

/** Stories / hero / hot-deals: flush on small phones, same clamp + 2xl header inset. */
export const HOME_BANNER_SECTION_X_PADDING_CLASS =
  `px-0 md:px-[clamp(16px,9.375vw,135px)] ${PAGE_DESKTOP_SECTION_X_PADDING_CLASS}`;

export const HOME_CONTENT_MAX_WIDTH_CLASS = PAGE_CONTENT_MAX_WIDTH_CLASS;
export const HOME_CONTENT_INNER_CLASS = PAGE_CONTENT_INNER_CLASS;

/** Fixed 4:1 frame for watermark-only state (1000×250 design). */
export const HOME_BANNER_ASPECT_CLASS = "aspect-[1000/250] w-full";

export const HOME_BANNER_FRAME_CLASS =
  `relative box-border w-full overflow-hidden isolate ${HOME_CONTENT_INNER_CLASS}`;

/** API banner: image sets height (full artwork visible). */
export const HOME_BANNER_MEDIA_LINK_CLASS = "relative z-[1] block w-full";

/** Watermark / fixed-aspect: fill the 4:1 box. */
export const HOME_BANNER_MEDIA_LAYER_CLASS =
  "absolute inset-0 z-[1] block overflow-hidden";

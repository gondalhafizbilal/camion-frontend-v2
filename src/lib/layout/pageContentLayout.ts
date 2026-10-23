/**
 * Shared main-column width for page center content (home, PDP, account, about, etc.).
 * Standard: Figma 1170px. Desktop (lg+): wider column so side gaps are ~half of original.
 * Ultra-wide (2xl+): grows with viewport minus halved section inset (2.5rem total).
 */
export const PAGE_CONTENT_MAX_WIDTH_CLASS =
  "max-w-[1170px] lg:max-w-[min(1800px,calc(50vw+585px))] 2xl:max-w-[min(1800px,calc(100vw-2.5rem))]";

export const PAGE_CONTENT_INNER_CLASS = `mx-auto w-full ${PAGE_CONTENT_MAX_WIDTH_CLASS}`;

/** Mobile/tablet unchanged; desktop (lg+) halves md:px-10 inset. */
export const PAGE_SECTION_X_PADDING_CLASS = "px-4 md:px-10 lg:px-5";

/** Halved desktop horizontal inset — shared by home sections, footer, cart, etc. */
export const PAGE_DESKTOP_SECTION_X_PADDING_CLASS =
  "lg:px-[clamp(16px,4.6875vw,67.5px)] 2xl:px-5";

/** Cart / checkout / confirmation outer shell — aligns with halved desktop inset. */
export const CHECKOUT_FLOW_PAGE_SHELL_CLASS =
  `w-full flex justify-center ${PAGE_SECTION_X_PADDING_CLASS}`;

/** Fixed tile width — matches horizontal carousels (no max-w-full shrink in grids). */
export const CAROUSEL_CARD_WIDTH_CLASS =
  "w-[200px] min-[400px]:w-[216px] md:w-[232px] lg:w-[250px] shrink-0";

/** Product image viewport — square area sized by card width, campaign bar sits directly below. */
export const CAROUSEL_CARD_IMAGE_FLEX_CLASS =
  "aspect-square w-full min-h-0 shrink-0";

/** Image + campaign strip — height follows card width (square + 24px bar). */
export const CAROUSEL_CARD_MEDIA_STACK_CLASS =
  "flex w-full shrink-0 flex-col gap-0 overflow-hidden";

/** @deprecated Prefer {@link CAROUSEL_CARD_IMAGE_FLEX_CLASS} inside {@link CAROUSEL_CARD_MEDIA_STACK_CLASS}. */
export const CAROUSEL_CARD_IMAGE_AREA_CLASS =
  "h-[200px] min-[400px]:h-[216px] md:h-[232px] lg:h-[250px]";

/** `next/image` `sizes` hint for carousel / grid product thumbs. */
export const CAROUSEL_CARD_IMAGE_SIZES = "(max-width: 768px) 216px, 250px";

export const CAROUSEL_CARD_HEIGHT_CLASS =
  "h-[372px] min-[400px]:h-[392px] md:h-[416px] lg:h-[438px]";

export const CAROUSEL_CARD_SHELL_CLASS = [
  "flex h-full flex-col overflow-hidden bg-white",
  CAROUSEL_CARD_WIDTH_CLASS,
].join(" ");

/** Reserved strip under the product image — keeps tiles aligned with/without a campaign. */
export const PRODUCT_CAMPAIGN_BAR_SLOT_CLASS =
  "h-[24px] w-full shrink-0 leading-none m-0 p-0";

/** Vertical gap between title, favourites, reviews, and price in product tiles. */
export const CAROUSEL_CARD_BODY_GAP_CLASS = "gap-1";

/** Horizontal gap between product tiles (carousels + grid columns). */
export const CAROUSEL_TILE_GAP_X = 14;

/** Vertical gap between product tile rows in grids only. */
export const CAROUSEL_TILE_GAP_Y = 21.5;

/** @deprecated Use {@link CAROUSEL_TILE_GAP_X} */
export const CAROUSEL_TILE_GAP = CAROUSEL_TILE_GAP_X;

/** Static literals — Tailwind cannot scan template-string class names. */
export const CAROUSEL_TILE_GAP_CLASS = "gap-[14px]";

export const PRODUCT_GRID_GAP_CLASS = "gap-x-[14px] gap-y-[21.5px]";

/** @see globals.css `.product-listing-grid` — gaps are defined in CSS; class name only here. */
export const PRODUCT_GRID_CLASS = "product-listing-grid";

/** Skeleton / placeholder tiles inside {@link PRODUCT_GRID_CLASS}. */
export const PRODUCT_GRID_TILE_SHELL_CLASS = "product-listing-grid__tile";

/** @deprecated Use {@link PRODUCT_GRID_CLASS} */
export const productGridClassName = PRODUCT_GRID_CLASS;

/** @deprecated Use {@link CAROUSEL_TILE_GAP_X} */
export const CAROUSEL_TRACK_GAP = CAROUSEL_TILE_GAP_X;

export const CAROUSEL_TRACK_CLASS =
  "w-full overflow-x-auto overflow-y-visible scrollbar-hide flex flex-row items-stretch py-2 min-h-0 [-webkit-overflow-scrolling:touch]";

/** PDP / cart / wishlist product rows — same tiles, lighter track chrome than home. */
export const PAGE_CAROUSEL_TRACK_CLASS =
  "scrollbar-hide -mx-1 flex w-full min-w-0 flex-row items-stretch overflow-x-auto overflow-y-visible px-1 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:px-0";

export const CAROUSEL_TRACK_LOADING_CLASS = [
  "flex overflow-hidden",
  CAROUSEL_TILE_GAP_CLASS,
  "h-[372px] min-[400px]:h-[392px] md:h-[416px] lg:h-[438px]",
].join(" ");

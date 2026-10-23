/** Layered motion system — see `globals.css` + `EcommerceMotionButton`. */
export const ECOMMERCE_MOTION_ROOT_CLASS = "ecommerce-motion-root";
export const ECOMMERCE_MOTION_SURFACE_CLASS = "ecommerce-motion-surface";
export const ECOMMERCE_MOTION_CONTENT_CLASS = "ecommerce-motion-content";
export const ECOMMERCE_MOTION_LOADER_CLASS = "ecommerce-motion-loader";
export const ECOMMERCE_MOTION_SPINNER_CLASS = "ecommerce-motion-spinner";
export const ECOMMERCE_MOTION_CONTENT_BUSY_CLASS = "ecommerce-motion-content--busy";
export const ECOMMERCE_MOTION_LOADING_CLASS = "ecommerce-motion-loading";

/** Scales background only (add to cart, view cart, checkout, etc.). */
export const ECOMMERCE_CTA_MOTION_CLASS = "ecommerce-cta-motion";

/** Wishlist heart buttons. */
export const ECOMMERCE_WISHLIST_MOTION_CLASS = "ecommerce-wishlist-motion";

export function withEcommerceCtaMotion(className = ""): string {
  return [ECOMMERCE_MOTION_ROOT_CLASS, ECOMMERCE_CTA_MOTION_CLASS, className]
    .filter(Boolean)
    .join(" ");
}

export function withEcommerceWishlistMotion(className = ""): string {
  return [
    ECOMMERCE_MOTION_ROOT_CLASS,
    ECOMMERCE_WISHLIST_MOTION_CLASS,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Fallback when `getProducts` / `getProduct` omit images or return unusable URLs.
 * Swap asset here to change catalog placeholders site-wide.
 */
export const PRODUCT_IMAGE_FALLBACK = "/assets/icons/vector-mobile-watermark.svg";

/** Banner watermark — same #CB272E @ 5% as product fallback; wider canvas for 4:1 frames. */
export const BANNER_IMAGE_FALLBACK = "/assets/icons/vector-banner-watermark.svg";

/** Matches product card placeholder background so banner watermark tint reads the same. */
export const BANNER_WATERMARK_BG_CLASS = "bg-[#F5F5F5]";

export function isUsableProductImageUrl(raw: unknown): boolean {
  if (raw == null) return false;
  const u = String(raw).trim();
  if (!u) return false;
  if (/^(undefined|null|NaN)$/i.test(u)) return false;
  if (u.toLowerCase() === "about:blank") return false;
  // Reject bare filenames / relative paths that are not site-root assets.
  if (!u.startsWith("/") && !/^https?:\/\//i.test(u) && !u.startsWith("//")) {
    return false;
  }
  return true;
}

export function productImageUrlOrFallback(raw: unknown): string {
  return isUsableProductImageUrl(raw) ? String(raw).trim() : PRODUCT_IMAGE_FALLBACK;
}

export function bannerImageUrlOrFallback(raw: unknown): string {
  return isUsableProductImageUrl(raw) ? String(raw).trim() : BANNER_IMAGE_FALLBACK;
}

/**
 * Product-level featured URLs (GraphQL) take precedence over variant `images`
 * for list cards, PDP hero order, cart, etc.
 * Order: `featuredThumbnailUrl` → `featuredImageUrl` → `variantPair` → watermark.
 */
export function resolveProductListImagePair(args: {
  featuredThumbnailUrl?: unknown;
  featuredImageUrl?: unknown;
  variantPair: { thumb: string; src: string };
}): { thumb: string; src: string } {
  const ft = args.featuredThumbnailUrl;
  const fi = args.featuredImageUrl;
  if (isUsableProductImageUrl(ft)) {
    const t = String(ft).trim();
    const s = isUsableProductImageUrl(fi) ? String(fi).trim() : t;
    return coalesceProductImagePair(t, s);
  }
  if (isUsableProductImageUrl(fi)) {
    const u = String(fi).trim();
    return coalesceProductImagePair(u, u);
  }
  return args.variantPair;
}

/**
 * Cart / checkout lines: use the line variant's image when present so color/size
 * match the thumbnail; product `featured*` is fallback only.
 */
export function resolveCartLineImagePair(args: {
  featuredThumbnailUrl?: unknown;
  featuredImageUrl?: unknown;
  variantPair: { thumb: string; src: string };
}): { thumb: string; src: string } {
  const { variantPair } = args;
  if (
    variantPair.thumb !== PRODUCT_IMAGE_FALLBACK ||
    variantPair.src !== PRODUCT_IMAGE_FALLBACK
  ) {
    return variantPair;
  }
  return resolveProductListImagePair(args);
}

/** Normalize thumbnail + full-size pair from variant `images` (GraphQL). */
export function coalesceProductImagePair(
  thumbnail: unknown,
  src: unknown,
): { thumb: string; src: string } {
  const t = String(thumbnail ?? "").trim();
  const s = String(src ?? "").trim();
  const tOk = isUsableProductImageUrl(t);
  const sOk = isUsableProductImageUrl(s);
  if (!tOk && !sOk) {
    return { thumb: PRODUCT_IMAGE_FALLBACK, src: PRODUCT_IMAGE_FALLBACK };
  }
  if (!tOk) {
    const u = sOk ? s : PRODUCT_IMAGE_FALLBACK;
    return { thumb: u, src: u };
  }
  if (!sOk) {
    const u = tOk ? t : PRODUCT_IMAGE_FALLBACK;
    return { thumb: u, src: u };
  }
  return { thumb: t, src: s };
}

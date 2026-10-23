import NextImage, { type ImageProps } from "next/image";

const STATIC_ASSET_FALLBACK = "/assets/icons/logo-light.svg";

/** True for files served from `/public` (e.g. `/assets/...`), not remote URLs. */
export function isPublicStaticAsset(src: ImageProps["src"]): boolean {
  if (!src) return false;
  if (typeof src === "string") {
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("//") ||
      src.startsWith("data:") ||
      src.startsWith("blob:")
    ) {
      return false;
    }
    return src.startsWith("/");
  }
  if (typeof src === "object" && "src" in src) {
    const s = String((src as { src: string }).src);
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("//")) {
      return false;
    }
    return s.startsWith("/") || s.startsWith("data:");
  }
  return false;
}

/**
 * Drop-in `next/image` wrapper: local `/public` assets skip the Image Optimizer
 * (`unoptimized`) so icons/SVGs load reliably from `/assets/...`.
 * Remote product/CDN URLs still use the default optimizer when beneficial.
 */
export default function StaticImage({
  unoptimized,
  onError,
  src,
  ...rest
}: ImageProps) {
  const bypassOptimizer = unoptimized ?? isPublicStaticAsset(src);

  return (
    <NextImage
      src={src}
      unoptimized={bypassOptimizer}
      onError={(event) => {
        onError?.(event);
        if (!isPublicStaticAsset(src)) return;
        const img = event.currentTarget;
        if (!img.src.includes(STATIC_ASSET_FALLBACK)) {
          img.src = STATIC_ASSET_FALLBACK;
        }
      }}
      {...rest}
    />
  );
}

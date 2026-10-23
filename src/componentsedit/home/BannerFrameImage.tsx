"use client";

import { useEffect, useState } from "react";
import Image from "@/componentsedit/StaticImage";
import {
  BANNER_IMAGE_FALLBACK,
  bannerImageUrlOrFallback,
} from "@/lib/productImageFallback";

/** Design target for layout hint; CMS images keep their natural aspect via h-auto. */
const BANNER_DESIGN_WIDTH = 1000;
const BANNER_DESIGN_HEIGHT = 250;

type BannerFrameImageProps = {
  src: unknown;
  alt?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  sizes?: string;
  /** Rendered height at current width (API banners only). */
  onMeasuredHeight?: (height: number) => void;
};

/**
 * Hero / hot-deals image: full height at natural aspect (no crop).
 * Watermark uses the fixed 4:1 frame with contain.
 */
function reportRenderedHeight(
  img: HTMLImageElement,
  onMeasuredHeight?: (height: number) => void,
): void {
  if (!onMeasuredHeight) return;
  const h = img.offsetHeight;
  if (h > 0) onMeasuredHeight(h);
}

export default function BannerFrameImage({
  src,
  alt = "",
  priority,
  loading,
  onMeasuredHeight,
}: BannerFrameImageProps) {
  const resolved = bannerImageUrlOrFallback(src);
  const [activeSrc, setActiveSrc] = useState(resolved);
  const isWatermark = activeSrc === BANNER_IMAGE_FALLBACK;

  useEffect(() => {
    setActiveSrc(bannerImageUrlOrFallback(src));
  }, [src]);

  const onError = () => {
    setActiveSrc((prev) =>
      prev !== BANNER_IMAGE_FALLBACK ? BANNER_IMAGE_FALLBACK : prev,
    );
  };

  if (isWatermark) {
    return (
      <div className="flex h-full min-h-[120px] w-full items-center justify-center p-6 md:p-10">
        <Image
          src={activeSrc}
          alt={alt}
          width={375}
          height={417}
          className="h-auto max-h-full w-auto max-w-[min(100%,420px)] object-contain"
          unoptimized
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={activeSrc}
      alt={alt}
      width={BANNER_DESIGN_WIDTH}
      height={BANNER_DESIGN_HEIGHT}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : (loading ?? "lazy")}
      className="block h-auto w-full max-w-full"
      onLoad={(e) => reportRenderedHeight(e.currentTarget, onMeasuredHeight)}
      onError={onError}
    />
  );
}

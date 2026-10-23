"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ProductGalleryImage } from "@/types/checkoutDisplay";
import type { CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";
import { productImageUrlOrFallback } from "@/lib/productImageFallback";
import { useDesktopImageZoom } from "@/hooks/useDesktopImageZoom";
import { ProductImageHoverZoomOverlay } from "@/componentsedit/products/ProductImageHoverZoomOverlay";
import ProductDetailImage from "./ProductDetailImage";
import { ProductDetailCampaignStrip } from "@/componentsedit/products/ProductDetailCampaignBlock";
import { ReviewImagesLightbox } from "./ReviewImagesCarousel";

type GallerySlide = { src: string; alt: string };

const ChevronLeft = () => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function ProductPhotoGallery({
  images = [],
  productName = "",
  activeSrc,
  campaign = null,
}: {
  images?: ProductGalleryImage[];
  productName?: string;
  activeSrc?: string;
  campaign?: CarouselProductCampaign | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [currentIndex, setCurrentIndex] = useState(0);
  /** After manual navigation, prefer carousel index over variant `activeSrc`. */
  const [ignoreActiveSrc, setIgnoreActiveSrc] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const {
    containerRef,
    isDesktop,
    zoomActive,
    zoomPos,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  } = useDesktopImageZoom();
  const list: GallerySlide[] = useMemo(
    () =>
      Array.isArray(images) && images.length > 0
        ? images
            .filter((img): img is ProductGalleryImage & { src: string } =>
              Boolean(img?.src),
            )
            .map((img) => ({
              src: productImageUrlOrFallback(img.src),
              alt: img?.alt || productName,
            }))
        : [],
    [images, productName],
  );

  const normalizedActive = useMemo(() => {
    const target = String(activeSrc || "").trim();
    return target ? productImageUrlOrFallback(target) : null;
  }, [activeSrc]);

  useEffect(() => {
    setIgnoreActiveSrc(false);
  }, [normalizedActive]);

  const displayImage = useMemo((): GallerySlide | null => {
    if (!ignoreActiveSrc && normalizedActive) {
      const inList = list.find((x) => x.src === normalizedActive);
      if (inList) return inList;
      return { src: normalizedActive, alt: productName || "Product" };
    }
    return list[currentIndex] ?? null;
  }, [ignoreActiveSrc, normalizedActive, list, currentIndex, productName]);

  const hasMultiple = list.length > 1;

  useEffect(() => {
    if (!normalizedActive || list.length === 0) return;
    const idx = list.findIndex((x) => x.src === normalizedActive);
    if (idx < 0) return;

    setCurrentIndex((prev) => (prev === idx ? prev : idx));
  }, [normalizedActive, list]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [list.length]);

  useEffect(() => {
    if (!hasMultiple) return;
    const activeThumb = thumbnailRefs.current[currentIndex];
    activeThumb?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex, hasMultiple]);

  const goPrev = () => {
    setIgnoreActiveSrc(true);
    setCurrentIndex((i) => (i <= 0 ? list.length - 1 : i - 1));
  };
  const goNext = () => {
    setIgnoreActiveSrc(true);
    setCurrentIndex((i) => (i >= list.length - 1 ? 0 : i + 1));
  };
  const goToIndex = (index: number) => {
    setIgnoreActiveSrc(true);
    setCurrentIndex(index);
  };

  const lightboxImages = useMemo(() => {
    if (!displayImage) return list;
    if (list.some((img) => img.src === displayImage.src)) return list;
    if (list.length === 0) return [displayImage];
    return [displayImage, ...list];
  }, [displayImage, list]);

  const openLightbox = () => {
    if (isDesktop || !displayImage) return;
    const idx = lightboxImages.findIndex((img) => img.src === displayImage.src);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  return (
    <div
      className="flex w-full min-w-0 max-w-full shrink-0 flex-col md:shrink-0 lg:self-start"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-md sm:rounded-lg md:rounded-lg lg:rounded-md">
        <div
          ref={containerRef}
          role={!isDesktop && displayImage ? "button" : undefined}
          tabIndex={!isDesktop && displayImage ? 0 : undefined}
          className={`group relative h-[300px] w-full overflow-hidden bg-[#F5F5F5] sm:h-[360px] md:h-[420px] lg:aspect-[3/4] lg:h-auto lg:min-h-[570px] lg:max-h-[680px] ${
            isDesktop ? "cursor-zoom-in" : displayImage ? "cursor-pointer" : ""
          }`}
          onMouseMove={onMouseMove}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={openLightbox}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLightbox();
            }
          }}
        >
          {displayImage ? (
            <>
              <ProductDetailImage
                key={displayImage.src}
                src={displayImage.src}
                alt={displayImage.alt || productName || "Product"}
                fill
                priority
                className={`object-contain transition-opacity duration-150 ${
                  zoomActive ? "opacity-0" : "opacity-100"
                }`}
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, (max-width: 1535px) 32vw, 540px"
              />
              <ProductImageHoverZoomOverlay
                src={displayImage.src}
                active={zoomActive}
                position={zoomPos}
              />
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                    className="pointer-events-auto absolute start-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white md:start-3 md:h-12 md:w-12"
                    aria-label={t("previousSlide")}
                  >
                    <span className="inline-flex rtl:rotate-180">
                      <ChevronLeft />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                    className="pointer-events-auto absolute end-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white md:end-3 md:h-12 md:w-12"
                    aria-label={t("nextSlide")}
                  >
                    <span className="inline-flex rtl:rotate-180">
                      <ChevronRight />
                    </span>
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-black/40 font-sans text-sm">
              {t("noImage")}
            </div>
          )}
        </div>
        <ProductDetailCampaignStrip campaign={campaign} />
      </div>
      {hasMultiple && (
        <div className="mt-3 flex flex-row items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] md:mt-4">
          <button
            type="button"
            onClick={goPrev}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-black hover:bg-black/10 lg:hidden"
            aria-label={t("previousSlide")}
          >
            <span className="inline-flex rtl:rotate-180">
              <ChevronLeft />
            </span>
          </button>
          <div className="flex flex-row items-center gap-2 flex-1 min-w-0 justify-center">
            {list.map((img, i) => (
              <button
                key={`${img.src}-${i}`}
                ref={(el) => {
                  thumbnailRefs.current[i] = el;
                }}
                type="button"
                onClick={() => goToIndex(i)}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-black/30 md:h-16 md:w-16"
                style={{
                  borderColor: i === currentIndex ? "#000000" : "transparent",
                }}
              >
                <ProductDetailImage
                  src={img.src}
                  alt={img.alt || `${productName} ${i + 1}`}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-black hover:bg-black/10 lg:hidden"
            aria-label={t("nextSlide")}
          >
            <span className="inline-flex rtl:rotate-180">
              <ChevronRight />
            </span>
          </button>
        </div>
      )}
      {lightboxOpen && lightboxImages.length > 0 ? (
        <ReviewImagesLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}

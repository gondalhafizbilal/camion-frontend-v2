"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import BannerCarouselIndicators from "@/componentsedit/home/BannerCarouselIndicators";
import BannerCopyFade from "@/componentsedit/home/BannerCopyFade";
import BannerCrossfadeSlides from "@/componentsedit/home/BannerCrossfadeSlides";
import {
  BANNER_IMAGE_FALLBACK,
  BANNER_WATERMARK_BG_CLASS,
} from "@/lib/productImageFallback";
import { DEFAULT_BANNER_TEXT_COLOR } from "@/services/graphql/mappers/bannerUtils";
import { useBannerCarousel } from "@/hooks/useBannerCarousel";
import {
  HOME_BANNER_ASPECT_CLASS,
  HOME_BANNER_FRAME_CLASS,
  HOME_BANNER_SECTION_X_PADDING_CLASS,
} from "@/componentsedit/home/homeSectionLayout";

type HeroSlide = {
  id: string | number;
  img: string;
  href: string;
  alt: string;
  tag?: string;
  title?: string;
  subtitle?: string;
  /** From GraphQL `color`; fallbacks use {@link DEFAULT_BANNER_TEXT_COLOR}. */
  textColor?: string;
};

function hasBannerCopy(slide?: Pick<HeroSlide, "tag" | "title" | "subtitle">) {
  if (!slide) return false;
  return Boolean(slide.tag?.trim() || slide.title?.trim() || slide.subtitle?.trim());
}

/** Scaled display height from intrinsic dimensions at the hero frame width. */
function scaledBannerHeight(img: HTMLImageElement, frameWidth: number): number {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (nw > 0 && nh > 0 && frameWidth > 0) {
    return Math.ceil((frameWidth / nw) * nh);
  }
  return img.offsetHeight;
}

const WATERMARK_PLACEHOLDER_SLIDE: HeroSlide = {
  id: "watermark",
  img: BANNER_IMAGE_FALLBACK,
  href: "/shop",
  alt: "heroBanner",
  textColor: DEFAULT_BANNER_TEXT_COLOR,
};

export default function HomeHeroSlider({
  slides: serverSlides = [],
}: {
  /** From GraphQL `getBanners` (placement hero). Empty → watermark placeholder. */
  slides?: HeroSlide[];
}) {
  const [frameMinHeight, setFrameMinHeight] = useState<number | undefined>(undefined);
  const t = useTranslations();
  const frameRef = useRef<HTMLDivElement | null>(null);

  const registerBannerHeight = useCallback((height: number) => {
    if (height <= 0) return;
    setFrameMinHeight((prev) => (prev == null ? height : Math.max(prev, height)));
  }, []);

  const registerBannerImageHeight = useCallback(
    (img: HTMLImageElement) => {
      const frameWidth = frameRef.current?.offsetWidth ?? img.offsetWidth;
      registerBannerHeight(scaledBannerHeight(img, frameWidth));
    },
    [registerBannerHeight],
  );

  const displaySlides = useMemo(
    () =>
      Array.isArray(serverSlides) && serverSlides.length > 0
        ? serverSlides
        : [WATERMARK_PLACEHOLDER_SLIDE],
    [serverSlides],
  );

  const { active, hasCarousel, goToSlide, pause, resume } = useBannerCarousel(
    displaySlides.length,
  );

  const usesWatermarkBg = displaySlides.every((s) => s.img === BANNER_IMAGE_FALLBACK);

  useEffect(() => {
    setFrameMinHeight(undefined);
  }, [displaySlides]);

  const currentSlide = displaySlides[active] || displaySlides[0];
  const textColor = currentSlide?.textColor?.trim() || DEFAULT_BANNER_TEXT_COLOR;
  const showCopy = hasBannerCopy(currentSlide);

  const crossfadeSlides = useMemo(
    () =>
      displaySlides.map((slide) => ({
        id: slide.id,
        imageUrl: slide.img,
        href: slide.href,
        alt: t(slide.alt),
        ariaLabel: slide.title?.trim() || t(slide.alt),
      })),
    [displaySlides, t],
  );

  return (
    <section
      className={`w-full flex justify-center ${HOME_BANNER_SECTION_X_PADDING_CLASS}`}
      style={{ marginTop: 19 }}
    >
      <div
        ref={frameRef}
        className={`${HOME_BANNER_FRAME_CLASS} border-y border-black/15 leading-none transition-[min-height] duration-500 ease-out md:border lg:border-0 ${
          usesWatermarkBg
            ? `${BANNER_WATERMARK_BG_CLASS} ${HOME_BANNER_ASPECT_CLASS}`
            : "bg-white"
        }`}
        style={
          !usesWatermarkBg && frameMinHeight
            ? { minHeight: frameMinHeight }
            : undefined
        }
        onMouseEnter={hasCarousel ? pause : undefined}
        onMouseLeave={hasCarousel ? resume : undefined}
        onFocusCapture={hasCarousel ? pause : undefined}
        onBlurCapture={hasCarousel ? resume : undefined}
      >
        <BannerCrossfadeSlides
          slides={crossfadeSlides}
          active={active}
          usesWatermarkBg={usesWatermarkBg}
          onImageHeight={usesWatermarkBg ? undefined : registerBannerHeight}
          onPreloadImageHeight={registerBannerImageHeight}
        />

        <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-center gap-2 p-4 pb-10 md:gap-2.5 md:p-5 md:pb-11 lg:hidden">
          {showCopy ? (
            <BannerCopyFade slideKey={currentSlide.id} className="w-full">
              <div className="flex w-full max-w-[343px] flex-row items-end gap-2 self-stretch md:max-w-[min(100%,560px)]">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col items-start gap-1 md:gap-1.5">
                  {currentSlide?.tag?.trim() ? (
                    <span
                      className="w-full font-sans text-[8px] font-medium leading-3 md:text-[10px] md:leading-3"
                      style={{ color: textColor }}
                    >
                      {currentSlide.tag.trim()}
                    </span>
                  ) : null}
                  <div className="flex w-full flex-col items-start">
                    {currentSlide?.title?.trim() ? (
                      <span
                        className="w-full font-sans text-base font-bold leading-6 line-clamp-1 md:line-clamp-2 md:text-lg md:leading-7"
                        style={{ color: textColor }}
                      >
                        {currentSlide.title.trim()}
                      </span>
                    ) : null}
                    {currentSlide?.subtitle?.trim() ? (
                      <span
                        className="w-full font-sans text-xs font-normal leading-[18px] line-clamp-1 md:line-clamp-2 md:text-sm md:leading-snug"
                        style={{ color: textColor }}
                      >
                        {currentSlide.subtitle.trim()}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </BannerCopyFade>
          ) : null}
        </div>

        {showCopy ? (
          <div className="absolute inset-0 z-[1] hidden flex-col items-start justify-center gap-2 ps-10 pe-10 pointer-events-none lg:flex lg:ps-14 lg:gap-3">
            <BannerCopyFade slideKey={currentSlide.id}>
              {currentSlide?.tag?.trim() ? (
                <span
                  className="font-sans text-sm font-medium leading-3"
                  style={{ color: textColor }}
                >
                  {currentSlide.tag.trim()}
                </span>
              ) : null}
              <div className="flex max-w-[min(100%,480px)] flex-col items-start gap-0">
                {currentSlide?.title?.trim() ? (
                  <span
                    className="font-sans text-[28px] font-bold leading-8 xl:text-[36px] xl:leading-10"
                    style={{ color: textColor }}
                  >
                    {currentSlide.title.trim()}
                  </span>
                ) : null}
                {currentSlide?.subtitle?.trim() ? (
                  <span
                    className="font-sans text-sm font-normal leading-snug"
                    style={{ color: textColor }}
                  >
                    {currentSlide.subtitle.trim()}
                  </span>
                ) : null}
              </div>
            </BannerCopyFade>
          </div>
        ) : null}

        {hasCarousel ? (
          <BannerCarouselIndicators
            count={displaySlides.length}
            active={active}
            onSelect={goToSlide}
            ariaLabel="Hero slides"
          />
        ) : null}
      </div>
    </section>
  );
}

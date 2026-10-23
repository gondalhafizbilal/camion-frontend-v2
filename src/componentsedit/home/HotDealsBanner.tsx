"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BannerCarouselIndicators from "@/componentsedit/home/BannerCarouselIndicators";
import BannerCopyFade from "@/componentsedit/home/BannerCopyFade";
import BannerCrossfadeSlides from "@/componentsedit/home/BannerCrossfadeSlides";
import type { HotDealBannerPayload } from "@/services/graphql/mappers/gqlBannersToHotDeal";
import { DEFAULT_BANNER_TEXT_COLOR } from "@/services/graphql/mappers/bannerUtils";
import {
  BANNER_IMAGE_FALLBACK,
  BANNER_WATERMARK_BG_CLASS,
  isUsableProductImageUrl,
} from "@/lib/productImageFallback";
import { useBannerCarousel } from "@/hooks/useBannerCarousel";
import {
  HOME_BANNER_ASPECT_CLASS,
  HOME_BANNER_FRAME_CLASS,
  HOME_BANNER_SECTION_X_PADDING_CLASS,
} from "@/componentsedit/home/homeSectionLayout";

function scaledBannerHeight(img: HTMLImageElement, frameWidth: number): number {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (nw > 0 && nh > 0 && frameWidth > 0) {
    return Math.ceil((frameWidth / nw) * nh);
  }
  return img.offsetHeight;
}

function isWatermarkBanner(banner: HotDealBannerPayload) {
  return (
    !isUsableProductImageUrl(banner.imageUrl) || banner.imageUrl === BANNER_IMAGE_FALLBACK
  );
}

const WATERMARK_PLACEHOLDER: HotDealBannerPayload = {
  id: "hot-deals-watermark",
  imageUrl: BANNER_IMAGE_FALLBACK,
  linkUrl: "/shop",
  textColor: DEFAULT_BANNER_TEXT_COLOR,
};

export default function HotDealsBanner({
  banners: serverBanners = [],
}: {
  /** GraphQL `getBanners` with placement hot_deals / Hotdeals_Web; missing image → watermark. */
  banners?: HotDealBannerPayload[];
}) {
  const [frameMinHeight, setFrameMinHeight] = useState<number | undefined>(undefined);
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

  const displayBanners = useMemo(
    () =>
      Array.isArray(serverBanners) && serverBanners.length > 0
        ? serverBanners
        : [WATERMARK_PLACEHOLDER],
    [serverBanners],
  );

  const { active, hasCarousel, goToSlide, pause, resume } = useBannerCarousel(
    displayBanners.length,
  );

  const usesWatermarkBg = displayBanners.every(isWatermarkBanner);
  const current = displayBanners[active] ?? displayBanners[0];
  const tag = current?.tag?.trim() ?? "";
  const title = current?.title?.trim() ?? "";
  const textColor = current?.textColor ?? DEFAULT_BANNER_TEXT_COLOR;
  const showCopy = Boolean(tag || title);

  useEffect(() => {
    setFrameMinHeight(undefined);
  }, [displayBanners]);

  const crossfadeSlides = useMemo(
    () =>
      displayBanners.map((banner) => ({
        id: banner.id,
        imageUrl: banner.imageUrl,
        href: banner.linkUrl?.trim() || "/shop",
        ariaLabel: banner.title?.trim() || undefined,
      })),
    [displayBanners],
  );

  return (
    <section
      className={`w-full flex justify-center pt-4 pb-2 ${HOME_BANNER_SECTION_X_PADDING_CLASS}`}
    >
      <div
        ref={frameRef}
        className={`${HOME_BANNER_FRAME_CLASS} relative w-full overflow-hidden rounded-none border-y border-black/15 leading-none transition-[min-height] duration-500 ease-out md:rounded-[4px] md:border lg:border-0 ${
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

        {showCopy ? (
          <>
            <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-center gap-2 p-4 md:gap-2.5 md:p-5 lg:hidden">
              <BannerCopyFade slideKey={current.id} className="w-full">
                <div className="flex w-full max-w-[343px] flex-col items-start gap-1 self-stretch md:max-w-[min(100%,560px)] md:gap-1.5">
                  {tag ? (
                    <span
                      className="w-full text-[8px] font-semibold leading-3 md:text-[10px] md:leading-3"
                      style={{
                        fontFamily:
                          "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                        color: textColor,
                      }}
                    >
                      {tag}
                    </span>
                  ) : null}
                  {title ? (
                    <p
                      className="w-full font-sans text-base font-bold leading-6 line-clamp-2 md:text-lg md:leading-7 md:line-clamp-3"
                      style={{ color: textColor }}
                    >
                      {title}
                    </p>
                  ) : null}
                </div>
              </BannerCopyFade>
            </div>

            <div className="absolute inset-0 z-[1] hidden flex-col justify-center box-border ps-10 pe-10 lg:flex lg:ps-14">
              <BannerCopyFade slideKey={current.id}>
                <div className="flex max-w-[min(100%,480px)] shrink min-w-0 flex-col gap-2">
                  {tag ? (
                    <span
                      className="text-sm leading-5"
                      style={{
                        fontFamily:
                          "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 600,
                        color: textColor,
                      }}
                    >
                      {tag}
                    </span>
                  ) : null}
                  {title ? (
                    <h2
                      className="text-[28px] leading-8 xl:text-[36px] xl:leading-10"
                      style={{
                        fontFamily:
                          "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                        fontWeight: 600,
                        color: textColor,
                      }}
                    >
                      {title}
                    </h2>
                  ) : null}
                </div>
              </BannerCopyFade>
            </div>
          </>
        ) : null}

        {hasCarousel ? (
          <BannerCarouselIndicators
            count={displayBanners.length}
            active={active}
            onSelect={goToSlide}
            ariaLabel="Hot deals banners"
            getItemLabel={(index) => `Go to hot deal ${index + 1}`}
          />
        ) : null}
      </div>
    </section>
  );
}

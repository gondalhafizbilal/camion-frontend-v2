"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import BannerFrameImage from "@/componentsedit/home/BannerFrameImage";
import {
  HOME_BANNER_MEDIA_LAYER_CLASS,
  HOME_BANNER_MEDIA_LINK_CLASS,
} from "@/componentsedit/home/homeSectionLayout";

const SLIDE_FADE_TRANSITION = { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const };

export type BannerCrossfadeSlide = {
  id: string | number;
  imageUrl: string;
  href: string;
  alt?: string;
  ariaLabel?: string;
};

type BannerCrossfadeSlidesProps = {
  slides: BannerCrossfadeSlide[];
  active: number;
  usesWatermarkBg: boolean;
  onImageHeight?: (height: number) => void;
  onPreloadImageHeight?: (img: HTMLImageElement) => void;
};

export default function BannerCrossfadeSlides({
  slides,
  active,
  usesWatermarkBg,
  onImageHeight,
  onPreloadImageHeight,
}: BannerCrossfadeSlidesProps) {
  const mediaClass = usesWatermarkBg
    ? HOME_BANNER_MEDIA_LAYER_CLASS
    : HOME_BANNER_MEDIA_LINK_CLASS;
  const activeSlide = slides[active] ?? slides[0];

  return (
    <>
      {activeSlide ? (
        <div className="pointer-events-none invisible relative z-0 w-full" aria-hidden>
          <BannerFrameImage
            src={activeSlide.imageUrl}
            alt=""
            onMeasuredHeight={usesWatermarkBg ? undefined : onImageHeight}
          />
        </div>
      ) : null}

      {slides.map((slide, idx) => {
        const isActive = idx === active;
        return (
          <motion.div
            key={slide.id}
            className="absolute inset-0 z-[1]"
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
            }}
            transition={SLIDE_FADE_TRANSITION}
            style={{ pointerEvents: isActive ? "auto" : "none" }}
            aria-hidden={!isActive}
          >
            <Link
              href={slide.href}
              {...(slide.ariaLabel ? { "aria-label": slide.ariaLabel } : {})}
              tabIndex={isActive ? 0 : -1}
              className={mediaClass}
            >
              <BannerFrameImage
                src={slide.imageUrl}
                alt={slide.alt ?? ""}
                priority={idx === 0}
              />
            </Link>
          </motion.div>
        );
      })}

      {slides.map((slide, idx) =>
        idx === active ? null : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`preload-${slide.id}`}
            src={slide.imageUrl}
            alt=""
            className="hidden"
            aria-hidden
            fetchPriority="low"
            onLoad={(e) => onPreloadImageHeight?.(e.currentTarget)}
          />
        ),
      )}
    </>
  );
}

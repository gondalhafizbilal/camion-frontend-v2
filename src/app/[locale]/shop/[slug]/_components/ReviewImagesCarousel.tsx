"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

export type ReviewImageItem = {
  src: string;
  thumbnail?: string;
  alt?: string;
};

function ChevronLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const SWIPE_THRESHOLD_PX = 40;

function useImageSwipe(
  enabled: boolean,
  onPrev: () => void,
  onNext: () => void,
  isRtl: boolean,
) {
  const startX = useRef<number | null>(null);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      startX.current = e.touches[0]?.clientX ?? null;
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || startX.current == null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX.current;
      const dx = endX - startX.current;
      startX.current = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (dx < 0) {
        if (isRtl) onPrev();
        else onNext();
      } else if (isRtl) onNext();
      else onPrev();
    },
    [enabled, isRtl, onNext, onPrev],
  );

  return { onTouchStart, onTouchEnd };
}

export function ReviewImagesLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ReviewImageItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [index, setIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)),
  );
  const hasMultiple = images.length > 1;

  useEffect(() => {
    setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)));
  }, [initialIndex, images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!hasMultiple) return;
      if (e.key === "ArrowLeft") {
        if (isRtl) setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
        else setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
      }
      if (e.key === "ArrowRight") {
        if (isRtl) setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
        else setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [hasMultiple, images.length, isRtl, onClose]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  const swipe = useImageSwipe(hasMultiple, goPrev, goNext, isRtl);
  const current = images[index];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[920px] overflow-hidden rounded-lg bg-black touch-pan-y"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute end-3 top-3 z-20 rounded bg-white/90 px-3 py-1.5 font-sans text-sm text-black hover:bg-white"
        >
          {t("close")}
        </button>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute start-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white sm:start-3"
              aria-label={t("previous")}
            >
              <span className="inline-flex rtl:rotate-180">
                <ChevronLeftIcon size={22} />
              </span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute end-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white sm:end-3"
              aria-label={t("next")}
            >
              <span className="inline-flex rtl:rotate-180">
                <ChevronRightIcon size={22} />
              </span>
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === index ? "bg-[#CB262E]" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}

        <img
          src={current.src}
          alt={current.alt || ""}
          className="mx-auto h-auto max-h-[85vh] w-full object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}

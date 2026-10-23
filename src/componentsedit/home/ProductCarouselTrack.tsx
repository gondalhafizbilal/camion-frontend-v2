"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type Ref,
} from "react";
import { useLocale } from "next-intl";
import {
  CAROUSEL_TILE_GAP_X,
  CAROUSEL_TRACK_CLASS,
  PAGE_CAROUSEL_TRACK_CLASS,
} from "@/lib/styles/carouselCardLayout";
import { useHorizontalCarouselScroll } from "@/lib/hooks/useHorizontalCarouselScroll";
import HorizontalCarouselNavButton from "@/componentsedit/home/HorizontalCarouselNavButton";

export type ProductCarouselTrackVariant = "home" | "page";

type ProductCarouselTrackProps = {
  children: ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
  /**
   * Scroll direction for the track. Defaults to the active locale
   * (`rtl` for Arabic) so slide movement follows RTL reading order.
   */
  dir?: "ltr" | "rtl" | "auto";
  /** Overlay prev/next arrows on the track edges. */
  showNav?: boolean;
  /** `home` = home sections; `page` = PDP, cart, wishlist product rows. */
  variant?: ProductCarouselTrackVariant;
  /** Extra classes on the scroll track (e.g. `max-w-full` on wishlist). */
  trackClassName?: string;
};

function assignScrollRef(
  node: HTMLDivElement | null,
  internalRef: React.MutableRefObject<HTMLDivElement | null>,
  scrollRef?: Ref<HTMLDivElement>,
) {
  internalRef.current = node;
  if (!scrollRef) return;
  if (typeof scrollRef === "function") {
    scrollRef(node);
    return;
  }
  scrollRef.current = node;
}

const TRACK_CLASS_BY_VARIANT: Record<ProductCarouselTrackVariant, string> = {
  home: CAROUSEL_TRACK_CLASS,
  page: PAGE_CAROUSEL_TRACK_CLASS,
};

/** Horizontal product carousel scroller shared across home, PDP, cart, and wishlist. */
export default function ProductCarouselTrack({
  children,
  scrollRef,
  dir,
  showNav = true,
  variant = "home",
  trackClassName = "",
}: ProductCarouselTrackProps) {
  const locale = useLocale();
  const resolvedDir = dir ?? (locale === "ar" ? "rtl" : "ltr");
  const internalRef = useRef<HTMLDivElement | null>(null);
  const {
    canScrollPrev,
    canScrollNext,
    hasOverflow,
    handlePrev,
    handleNext,
    onScroll,
  } = useHorizontalCarouselScroll(internalRef);

  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      assignScrollRef(node, internalRef, scrollRef);
    },
    [scrollRef],
  );

  useEffect(() => {
    onScroll();
  }, [children, onScroll, resolvedDir]);

  const trackClasses = [TRACK_CLASS_BY_VARIANT[variant], trackClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative w-full min-w-0" dir={resolvedDir}>
      {showNav && hasOverflow ? (
        <>
          <HorizontalCarouselNavButton
            direction="prev"
            onClick={handlePrev}
            disabled={!canScrollPrev}
          />
          <HorizontalCarouselNavButton
            direction="next"
            onClick={handleNext}
            disabled={!canScrollNext}
          />
        </>
      ) : null}
      <div
        ref={setScrollRef}
        dir={resolvedDir}
        onScroll={onScroll}
        className={trackClasses}
        style={{ gap: CAROUSEL_TILE_GAP_X }}
      >
        {children}
      </div>
    </div>
  );
}

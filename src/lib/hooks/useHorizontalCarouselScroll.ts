"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { CAROUSEL_TILE_GAP_X } from "@/lib/styles/carouselCardLayout";

const DEFAULT_SCROLL_STEP = 220;
const SCROLL_EPSILON = 2;

function resolveScrollStep(el: HTMLDivElement): number {
  const firstCard = el.querySelector<HTMLElement>("[data-carousel-card]");
  if (firstCard?.offsetWidth) {
    return firstCard.offsetWidth + CAROUSEL_TILE_GAP_X;
  }
  return DEFAULT_SCROLL_STEP;
}

function isRtlDir(el: HTMLElement): boolean {
  return getComputedStyle(el).direction === "rtl";
}

function resolveEdgeCards(el: HTMLDivElement): {
  first: HTMLElement | null;
  last: HTMLElement | null;
} {
  const cards = el.querySelectorAll<HTMLElement>("[data-carousel-card]");
  if (cards.length > 0) {
    return {
      first: cards[0] ?? null,
      last: cards[cards.length - 1] ?? null,
    };
  }
  const children = el.children;
  return {
    first: (children[0] as HTMLElement | undefined) ?? null,
    last: (children[children.length - 1] as HTMLElement | undefined) ?? null,
  };
}

/**
 * Horizontal carousel scroll helpers that respect `dir`.
 * In Arabic RTL, "next" advances toward the inline-start side (right → left).
 */
export function useHorizontalCarouselScroll(
  scrollRef: RefObject<HTMLDivElement | null>,
) {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const scrollStepRef = useRef(DEFAULT_SCROLL_STEP);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    scrollStepRef.current = resolveScrollStep(el);

    const max = el.scrollWidth - el.clientWidth;
    if (max <= SCROLL_EPSILON) {
      setHasOverflow(false);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const { first, last } = resolveEdgeCards(el);
    if (!first || !last) {
      setHasOverflow(false);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const viewport = el.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    const rtl = isRtlDir(el);

    setHasOverflow(true);

    if (rtl) {
      // Content starts on the right; next reveals items toward the left.
      setCanScrollPrev(firstRect.right > viewport.right + SCROLL_EPSILON);
      setCanScrollNext(lastRect.left < viewport.left - SCROLL_EPSILON);
    } else {
      setCanScrollPrev(firstRect.left < viewport.left - SCROLL_EPSILON);
      setCanScrollNext(lastRect.right > viewport.right + SCROLL_EPSILON);
    }
  }, [scrollRef]);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const handlePrev = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const step = scrollStepRef.current;
    // RTL: previous moves toward the right (positive scroll delta).
    el.scrollBy({
      left: isRtlDir(el) ? step : -step,
      behavior: "smooth",
    });
    window.setTimeout(checkScroll, 300);
  }, [scrollRef, checkScroll]);

  const handleNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const step = scrollStepRef.current;
    // RTL: next moves toward the left (negative scroll delta) — right → left.
    el.scrollBy({
      left: isRtlDir(el) ? -step : step,
      behavior: "smooth",
    });
    window.setTimeout(checkScroll, 300);
  }, [scrollRef, checkScroll]);

  return {
    /** @deprecated Prefer `canScrollPrev` — kept for call-site compatibility. */
    canScrollLeft: canScrollPrev,
    /** @deprecated Prefer `canScrollNext` — kept for call-site compatibility. */
    canScrollRight: canScrollNext,
    canScrollPrev,
    canScrollNext,
    hasOverflow,
    handlePrev,
    handleNext,
    onScroll: checkScroll,
  };
}

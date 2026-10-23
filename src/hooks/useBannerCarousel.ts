import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_INTERVAL_MS = 5000;

export function useBannerCarousel(itemCount: number, intervalMs = DEFAULT_INTERVAL_MS) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasCarousel = itemCount > 1;

  const goToSlide = useCallback(
    (index: number) => {
      if (itemCount <= 0) return;
      setActive(((index % itemCount) + itemCount) % itemCount);
      setTimerEpoch((epoch) => epoch + 1);
    },
    [itemCount],
  );

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  useEffect(() => {
    if (active >= itemCount) setActive(0);
  }, [active, itemCount]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!hasCarousel || isPaused) return;

    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % itemCount);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasCarousel, isPaused, itemCount, intervalMs, timerEpoch]);

  return {
    active,
    hasCarousel,
    goToSlide,
    pause,
    resume,
  };
}

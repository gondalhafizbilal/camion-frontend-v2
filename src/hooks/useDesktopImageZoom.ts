"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";

export type ImageZoomPosition = { x: number; y: number };

export type UseDesktopImageZoomResult = {
  containerRef: RefObject<HTMLDivElement | null>;
  isDesktop: boolean;
  zoomActive: boolean;
  zoomPos: ImageZoomPosition;
  onMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

/** Desktop-only hover zoom: tracks pointer position inside `containerRef`. */
export function useDesktopImageZoom(): UseDesktopImageZoomResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState<ImageZoomPosition>({ x: 50, y: 50 });

  useEffect(() => {
    const mql = window.matchMedia("(hover:hover)");
    const update = () => setIsDesktop(mql.matches);

    update();

    if (mql.addEventListener) mql.addEventListener("change", update);
    else mql.addListener(update);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", update);
      else mql.removeListener(update);
    };
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!isDesktop || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setZoomPos({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    },
    [isDesktop],
  );

  const onMouseEnter = useCallback(() => {
    if (isDesktop) setZoomActive(true);
  }, [isDesktop]);

  const onMouseLeave = useCallback(() => {
    setZoomActive(false);
  }, []);

  return {
    containerRef,
    isDesktop,
    zoomActive,
    zoomPos,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  };
}

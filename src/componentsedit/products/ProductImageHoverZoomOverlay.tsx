"use client";

import type { ImageZoomPosition } from "@/hooks/useDesktopImageZoom";

type ProductImageHoverZoomOverlayProps = {
  src: string;
  active: boolean;
  position: ImageZoomPosition;
  /** Background size percentage for the magnified image. */
  scale?: number;
};

export function ProductImageHoverZoomOverlay({
  src,
  active,
  position,
  scale = 180,
}: ProductImageHoverZoomOverlayProps) {
  if (!active || !src) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      <div
        className="absolute inset-0 bg-[#F5F5F5]"
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${scale}%`,
          backgroundPosition: `${position.x}% ${position.y}%`,
        }}
      />
    </div>
  );
}

type ProductImageHoverZoomHintProps = {
  label: string;
  visible: boolean;
};

export function ProductImageHoverZoomHint({
  label,
  visible,
}: ProductImageHoverZoomHintProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute bottom-3 end-3 z-[2] rounded-lg border bg-white/90 px-3 py-1 text-xs text-gray-600 opacity-0 backdrop-blur transition group-hover:opacity-100">
      {label}
    </div>
  );
}

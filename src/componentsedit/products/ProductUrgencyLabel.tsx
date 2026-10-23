"use client";

import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";

const BRAND_RED = "#CB262E";

type ProductUrgencyLabelProps = {
  count: number;
  /** `card` matches product-tile favourites row; `pdp` matches PDP stock status text. */
  size?: "card" | "pdp";
  className?: string;
};

function UrgencyFlameIcon({ size }: { size: number }) {
  return (
    <Flame
      size={size}
      strokeWidth={2.25}
      absoluteStrokeWidth
      className="product-card-urgency-flame-icon flex-shrink-0"
      color="#EA5444"
      fill="#F28B82"
      aria-hidden
    />
  );
}

/** Fake urgency line: flame + “Only {count} left” (display only). */
export default function ProductUrgencyLabel({
  count,
  size = "card",
  className = "",
}: ProductUrgencyLabelProps) {
  const t = useTranslations();
  const isPdp = size === "pdp";
  const iconSize = isPdp ? 16 : 12;
  const fontSize = isPdp ? 14 : 10.04;
  const lineHeight = isPdp ? "21px" : "14px";
  const gap = isPdp ? 6 : 2.35;

  const label = t.rich("productCardOnlyLeft", {
    count: () => (
      <span style={{ fontWeight: 800, color: BRAND_RED }}>{count}</span>
    ),
  });

  return (
    <div
      className={`flex min-w-0 flex-row items-center ${className}`.trim()}
      style={{
        gap,
        fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
      }}
      aria-live="polite"
      aria-label={t("productCardOnlyLeftPlain", { count })}
    >
      <UrgencyFlameIcon size={iconSize} />
      <span
        className="truncate font-sans"
        style={{
          fontWeight: 600,
          fontSize,
          lineHeight,
          color: BRAND_RED,
        }}
      >
        {label}
      </span>
    </div>
  );
}

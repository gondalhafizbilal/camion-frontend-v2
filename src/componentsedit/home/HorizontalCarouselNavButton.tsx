"use client";

import { useLocale, useTranslations } from "next-intl";

type HorizontalCarouselNavDirection = "prev" | "next";

function ChevronLeftIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/**
 * Logical inline edges so prev sits at reading-start and next at reading-end.
 * In Arabic RTL that places prev on the right and next on the left.
 */
const POSITION_CLASS: Record<HorizontalCarouselNavDirection, string> = {
  prev: "start-1 sm:start-2",
  next: "end-1 sm:end-2",
};

export default function HorizontalCarouselNavButton({
  direction,
  onClick,
  disabled = false,
}: {
  direction: HorizontalCarouselNavDirection;
  onClick: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Point the chevron toward the travel direction (not a CSS rtl: flip — more reliable).
  // RTL: prev (start/right) → right chevron; next (end/left) → left chevron.
  const icon =
    direction === "prev"
      ? isRtl
        ? <ChevronRightIcon />
        : <ChevronLeftIcon />
      : isRtl
        ? <ChevronLeftIcon />
        : <ChevronRightIcon />;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "pointer-events-auto absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white text-[#333333] shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-[opacity,box-shadow,background-color] hover:bg-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.16)] disabled:cursor-not-allowed disabled:opacity-45",
        POSITION_CLASS[direction],
      ].join(" ")}
      aria-label={
        direction === "prev" ? t("previousSlide") : t("nextSlide")
      }
    >
      <span className="inline-flex">{icon}</span>
    </button>
  );
}

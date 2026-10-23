"use client";

type BannerCarouselIndicatorsProps = {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
  getItemLabel?: (index: number) => string;
};

export default function BannerCarouselIndicators({
  count,
  active,
  onSelect,
  ariaLabel,
  getItemLabel = (index) => `Go to slide ${index + 1}`,
}: BannerCarouselIndicatorsProps) {
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-3 z-[3] flex min-h-[14px] flex-row items-center justify-center gap-1.5 px-4 sm:gap-2"
      role="tablist"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }, (_, idx) => {
        const isActive = idx === active;
        return (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(idx);
            }}
            aria-label={getItemLabel(idx)}
            className={`h-2 shrink-0 cursor-pointer rounded-full border-0 p-0 transition-all duration-300 ease-out sm:h-[10px] lg:h-[14px] ${
              isActive
                ? "w-6 bg-white sm:w-7 lg:w-9"
                : "w-2 bg-white/50 hover:bg-white/75 sm:w-[10px] lg:w-[14px]"
            }`}
          />
        );
      })}
    </div>
  );
}

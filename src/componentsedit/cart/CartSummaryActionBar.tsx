"use client";

import { useTranslations } from "next-intl";
import {
  EcommerceMotionButton,
  EcommerceMotionLink,
} from "@/componentsedit/buttons/EcommerceMotionButton";
import {
  BRAND_WARM_GRADIENT,
  BRAND_WARM_GRADIENT_SHADOW,
} from "@/lib/styles/brandWarmGradient";

export type CartSummaryActionBarProps = {
  totalItems: number;
  subtotalLabel: string;
  href?: string;
  onClick?: () => void;
  /** `rail` = narrow desktop cart drawer; `mobile` = PDP bottom sheet. */
  variant?: "mobile" | "rail";
  className?: string;
};

function CartTrolleyWithCount({
  count,
  variant,
}: {
  count: number;
  variant: "mobile" | "rail";
}) {
  const isRail = variant === "rail";
  const displayCount = count > 99 ? "99+" : String(count);
  const shellW = isRail ? 50 : 58;
  const shellH = isRail ? 34 : 42;
  const iconW = isRail ? 36 : 40;
  const iconH = isRail ? 28 : 32;
  const badgeH = isRail ? 16 : 20;
  const badgeFont = isRail
    ? displayCount.length > 1
      ? 9
      : 10
    : displayCount.length > 1
      ? 11
      : 12;
  const badgeMinW =
    displayCount.length > 2
      ? isRail
        ? 24
        : 28
      : displayCount.length > 1
        ? isRail
          ? 20
          : 24
        : badgeH;

  return (
    <span
      className="relative inline-flex shrink-0 items-end justify-start"
      style={{ width: shellW, height: shellH }}
      aria-hidden
    >
      <span
        className="absolute bottom-0 start-0 rounded-full"
        style={{
          width: iconW + 4,
          height: iconH + 4,
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 55%, transparent 100%)",
        }}
      />

      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 24 24"
        fill="none"
        className="relative shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
        aria-hidden
      >
        <path
          d="M2 3h2.2l2.4 13.2a2 2 0 002 1.85h8.8a2 2 0 002-1.85L21 8H6.2"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="20.5" r="1.75" fill="white" />
        <circle cx="17.5" cy="20.5" r="1.75" fill="white" />
        <path
          d="M7 8h14"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>

      {count > 0 ? (
        <span
          className="absolute flex items-center justify-center rounded-full border-2 border-white bg-white font-sans font-bold tabular-nums text-[#CB262E] shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
          style={{
            top: isRail ? -3 : -4,
            insetInlineEnd: 0,
            minWidth: badgeMinW,
            height: badgeH,
            paddingInline: displayCount.length > 1 ? 3 : 0,
            fontSize: badgeFont,
            lineHeight: 1,
          }}
        >
          {displayCount}
        </span>
      ) : null}
    </span>
  );
}

export default function CartSummaryActionBar({
  totalItems,
  subtotalLabel,
  href = "/cart",
  onClick,
  variant = "mobile",
  className = "",
}: CartSummaryActionBarProps) {
  const t = useTranslations();
  const isRail = variant === "rail";

  const barClass = isRail
    ? "flex w-full cursor-default select-none items-center justify-center gap-2.5 rounded-xl text-white min-h-[38px] px-2.5 py-2"
    : [
        "flex w-full touch-manipulation items-center justify-center gap-2.5 rounded-xl text-white transition-[transform,opacity] hover:opacity-95 active:scale-[0.99]",
        "min-h-[54px] px-5 py-3.5",
        className,
      ].join(" ");

  const barStyle = {
    background: BRAND_WARM_GRADIENT,
    boxShadow: BRAND_WARM_GRADIENT_SHADOW,
  };

  const labelClass = isRail
    ? "font-sans text-[10px] font-semibold capitalize leading-none"
    : "font-sans text-[16px] font-semibold capitalize leading-none";

  const priceClass = isRail
    ? "mt-1.5 cursor-default select-none text-center font-sans text-[12px] font-bold tabular-nums leading-tight text-black"
    : "mt-2 text-center font-sans text-[22px] font-bold tabular-nums leading-tight text-black";

  const goToCartRootClass = isRail
    ? "mt-1.5 flex min-h-[32px] w-full touch-manipulation items-center justify-center rounded-md font-sans text-[12px] font-bold tabular-nums leading-tight text-black"
    : "mt-2.5 flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg font-sans text-[15px] font-semibold text-white";

  const goToCartSurfaceClass = isRail
    ? "rounded-md border border-black/12 bg-white hover:bg-black/[0.02]"
    : "rounded-lg bg-[#CB262E] shadow-[0_4px_14px_rgba(203,38,46,0.28)]";

  const goToCartButton = href ? (
    <EcommerceMotionLink
      href={href}
      onClick={onClick}
      className={goToCartRootClass}
      surfaceClassName={goToCartSurfaceClass}
    >
      {t("cartDrawerGoToCart")}
    </EcommerceMotionLink>
  ) : (
    <EcommerceMotionButton
      type="button"
      onClick={onClick}
      className={goToCartRootClass}
      surfaceClassName={goToCartSurfaceClass}
    >
      {t("cartDrawerGoToCart")}
    </EcommerceMotionButton>
  );

  return (
    <div className="flex w-full flex-col items-stretch">
      <div className={isRail ? "pointer-events-none" : undefined}>
        <div className={barClass} style={barStyle}>
          <CartTrolleyWithCount count={totalItems} variant={variant} />
          <span className={labelClass}>{t("subtotal")}</span>
        </div>
        <p className={priceClass}>{subtotalLabel}</p>
      </div>
      {goToCartButton}
    </div>
  );
}

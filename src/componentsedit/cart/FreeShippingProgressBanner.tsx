"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMinimumOrderMoney } from "@/lib/cart/formatMinimumOrderMoney";
import { useFreeShippingBannerState } from "@/hooks/useFreeShippingBannerState";
import {
  BRAND_WARM_GRADIENT,
  BRAND_WARM_GRADIENT_PROGRESS,
  BRAND_WARM_GRADIENT_SHADOW,
} from "@/lib/styles/brandWarmGradient";

export type FreeShippingProgressBannerVariant = "embedded" | "compact";

export type FreeShippingProgressBannerProps = {
  cartSubtotal: number;
  currencyCode: string;
  locale: string;
  variant?: FreeShippingProgressBannerVariant;
  className?: string;
  /**
   * When order preview (or checkout) has resolved the shipping fee, use it for
   * unlocked state instead of cart-vs-threshold alone — threshold can disagree
   * with the quote (e.g. destination still charged).
   */
  shippingKnown?: boolean;
  shippingTotal?: number | null;
};

function TruckDeliveryIcon({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" />
      <path d="M3 9l4 0" />
    </svg>
  );
}

function FreeShippingBadgeIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const badgeSize = size === "sm" ? 28 : 36;
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: badgeSize,
        height: badgeSize,
        background: BRAND_WARM_GRADIENT,
        boxShadow: BRAND_WARM_GRADIENT_SHADOW,
      }}
      aria-hidden
    >
      <TruckDeliveryIcon size={iconSize} />
    </div>
  );
}

function ProgressTrack({
  percent,
  achieved,
  compact,
}: {
  percent: number;
  achieved: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-black/[0.06] ${
        compact ? "h-1" : "h-[5px] sm:h-1.5"
      }`}
      aria-hidden
    >
      <motion.div
        className="absolute inset-y-0 start-0 rounded-full"
        style={{
          background: achieved ? BRAND_WARM_GRADIENT : BRAND_WARM_GRADIENT_PROGRESS,
        }}
        initial={false}
        animate={{ width: `${achieved ? 100 : percent}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}

const shopMoreLinkClass =
  "inline-flex font-sans font-semibold text-[#CB262E] underline underline-offset-[3px] decoration-[#CB262E]/40 transition-colors hover:text-[#9B1F26] hover:decoration-[#CB262E]";

export default function FreeShippingProgressBanner({
  cartSubtotal,
  currencyCode,
  locale,
  variant = "embedded",
  className = "",
  shippingKnown = false,
  shippingTotal = null,
}: FreeShippingProgressBannerProps) {
  const t = useTranslations();
  const { active, progress } = useFreeShippingBannerState(cartSubtotal);

  if (!active || !progress) return null;

  const shippingFee =
    shippingKnown && shippingTotal != null && Number.isFinite(Number(shippingTotal))
      ? Math.max(0, Number(shippingTotal))
      : null;
  // Prefer the actual quote once known so checkout matches order summary / API.
  const achieved =
    shippingFee != null ? shippingFee === 0 : progress.achieved;
  const remainingLabel = formatMinimumOrderMoney(
    progress.remaining,
    currencyCode,
    locale,
  );

  const isCompact = variant === "compact";
  const iconSize = isCompact ? "sm" : "md";
  const paddingClass = isCompact ? "p-2.5" : "p-3.5 sm:p-4";
  const messageSizeClass = isCompact
    ? "text-[11px] leading-[15px]"
    : "text-[13px] leading-[18px] sm:text-sm sm:leading-5";
  const linkSizeClass = isCompact ? "text-[10px]" : "text-[11px] sm:text-xs";

  const shopMoreLink = !achieved ? (
    <Link href="/shop" className={`${shopMoreLinkClass} ${linkSizeClass}`}>
      {t("shopMore")}
    </Link>
  ) : null;

  const message = achieved ? (
    t("freeShippingUnlocked")
  ) : (
    <>
      {t.rich("freeShippingAddMore", {
        amount: remainingLabel,
        highlight: (chunks) => (
          <span className="font-bold tabular-nums text-[#CB262E]">{chunks}</span>
        ),
      })}
    </>
  );

  return (
    <div
      className={`rounded-lg bg-white shadow-[0_2px_12px_rgba(203,38,46,0.08)] ring-1 ring-black/[0.06] ${paddingClass} ${className}`.trim()}
      role="status"
      aria-label={
        achieved
          ? t("freeShippingUnlocked")
          : t("freeShippingAddMorePlain", { amount: remainingLabel })
      }
    >
      <div className={`flex flex-col ${isCompact ? "gap-2" : "gap-2.5"}`}>
        <div className="flex min-w-0 items-start gap-2.5">
          <FreeShippingBadgeIcon size={iconSize} />

          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={`font-sans font-medium ${messageSizeClass} ${
                achieved ? "font-semibold text-[#CB262E]" : "text-black/88"
              }`}
            >
              {message}
            </p>

            {!achieved && shopMoreLink ? (
              <p className="mt-1">{shopMoreLink}</p>
            ) : null}

            {!isCompact && achieved ? (
              <p className="mt-1 font-sans text-[11px] leading-relaxed text-black/55 sm:text-xs">
                {t("freeShippingUnlockedHint")}
              </p>
            ) : null}
          </div>
        </div>

        <ProgressTrack
          percent={progress.progressPercent}
          achieved={achieved}
          compact={isCompact}
        />
      </div>
    </div>
  );
}

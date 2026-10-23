"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/navigation";
import { writeCheckoutCartItemUuids } from "@/lib/checkout/checkoutReviewSession";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { MIN_ORDER_DOCK_Z } from "@/lib/cart/overlayZIndex";
import { formatMinimumOrderMoney } from "@/lib/cart/formatMinimumOrderMoney";
import { getMinimumOrderProgress } from "@/lib/cart/minimumOrder";
import { useMinOrderMobileLayout } from "@/hooks/useMinOrderMobileLayout";
import { PAGE_CONTENT_INNER_CLASS } from "@/lib/layout/pageContentLayout";

export type MinimumOrderDockVariant = "blocked" | "celebration";

type MinimumOrderContentProps = {
  variant: MinimumOrderDockVariant;
  cartSubtotal: number;
  currencyCode: string;
  locale: string;
  minimum: number;
};

function useMinimumOrderContent({
  variant,
  cartSubtotal,
  currencyCode,
  locale,
  minimum,
}: MinimumOrderContentProps) {
  const t = useTranslations();
  const { current, minimum: min, progressPercent, remaining, achieved } =
    getMinimumOrderProgress(cartSubtotal, minimum);

  const isCelebration = variant === "celebration" && achieved;
  const isBlocked = variant === "blocked" && !achieved;

  return {
    t,
    isCelebration,
    isBlocked,
    progressPercent,
    currentLabel: formatMinimumOrderMoney(current, currencyCode, locale),
    minimumLabel: formatMinimumOrderMoney(min, currencyCode, locale),
    remainingLabel: formatMinimumOrderMoney(remaining, currencyCode, locale),
  };
}

function ProgressTrack({
  percent,
  isSuccess,
}: {
  percent: number;
  isSuccess: boolean;
}) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#F0F0F0] sm:h-2.5">
      <motion.div
        className="absolute inset-y-0 start-0 rounded-full"
        style={{
          background: isSuccess
            ? "linear-gradient(90deg, #4ADE80 0%, #22C55E 50%, #16A34A 100%)"
            : "linear-gradient(90deg, #E85A60 0%, #CB262E 55%, #A81E24 100%)",
          boxShadow: isSuccess
            ? "0 0 12px rgba(34, 197, 94, 0.4)"
            : "0 0 8px rgba(203, 38, 46, 0.2)",
        }}
        initial={false}
        animate={{ width: `${isSuccess ? 100 : percent}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}

function CartBagIcon({ className }: { className?: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M6 6h15l-1.5 9h-12L6 6zm2-2h2l1 2h6l1-2h2l-1.2 6H7.2L8 4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mobile: bottom sheet (Temu-style). */
function MinimumOrderMobileSheet({
  variant,
  cartSubtotal,
  currencyCode,
  locale,
  minimum,
  onDismiss,
}: MinimumOrderContentProps & { onDismiss?: () => void }) {
  const {
    t,
    isCelebration,
    isBlocked,
    progressPercent,
    currentLabel,
    minimumLabel,
    remainingLabel,
  } = useMinimumOrderContent({
    variant,
    cartSubtotal,
    currencyCode,
    locale,
    minimum,
  });

  const shellClass = isCelebration
    ? "border-[#22C55E]/25 bg-[#F0FDF4]/98 shadow-[0_-12px_40px_rgba(34,197,94,0.18)]"
    : "border-[#CB262E]/20 bg-white shadow-[0_-16px_48px_rgba(203,38,46,0.12)]";

  const title = isCelebration
    ? t("minimumOrderAchievedCelebration")
    : t("minimumOrderCheckoutBlockedTitle");

  const subtitle = isCelebration
    ? t("minimumOrderAchievedHint")
    : t("minimumOrderCheckoutBlockedHint");

  const ctaClass = isCelebration
    ? "bg-[#22C55E] shadow-[0_4px_14px_rgba(34,197,94,0.35)]"
    : "bg-[#CB262E] shadow-[0_4px_14px_rgba(203,38,46,0.28)]";

  return (
    <div
      className={`pointer-events-auto w-full rounded-t-[18px] border-t backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] ${shellClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {isBlocked ? (
        <div
          className="h-[3px] w-full shrink-0 rounded-t-[18px]"
          style={{
            background:
              "linear-gradient(90deg, #CB262E 0%, #E04A52 50%, #CB262E 100%)",
          }}
          aria-hidden
        />
      ) : null}

      <div className={`${PAGE_CONTENT_INNER_CLASS} px-3 py-3 sm:px-6 sm:py-4`}>
        <div className={`flex flex-col ${isBlocked ? "gap-4" : "gap-3"}`}>
          <div className="flex min-w-0 items-start gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isCelebration
                  ? "bg-[#22C55E]/15 text-[#16A34A]"
                  : "bg-[#FFF5F5] text-[#CB262E]"
              }`}
            >
              {isCelebration ? (
                <span className="text-lg leading-none" aria-hidden>
                  🎉
                </span>
              ) : (
                <CartBagIcon />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`font-sans text-[15px] font-semibold leading-snug ${
                  isCelebration ? "text-[#166534]" : "text-black"
                }`}
              >
                {title}
              </p>
              <p
                className={`mt-0.5 font-sans text-[12px] leading-relaxed ${
                  isCelebration ? "text-[#15803D]/85" : "text-black/65"
                }`}
              >
                {subtitle}
              </p>
            </div>

            {isBlocked && onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black/70"
                aria-label={t("close")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          {isBlocked ? (
            <div className="flex flex-col items-center gap-1 rounded-xl bg-[#FFF8F8] px-3 py-3">
              <p className="font-sans text-[10px] font-medium uppercase tracking-wide text-black/45">
                {t("minimumOrderCheckoutRemainingLabel")}
              </p>
              <p className="font-sans text-[26px] font-bold tabular-nums leading-none text-[#CB262E]">
                {remainingLabel}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-row items-center justify-between gap-2">
              <span className="font-sans text-[10px] font-medium uppercase tracking-wide text-black/45">
                {t("minimumOrderGoal")}
              </span>
              <span className="shrink-0 font-sans text-[11px] font-semibold tabular-nums text-black">
                {currentLabel}
                <span className="font-normal text-black/40"> / </span>
                {minimumLabel}
              </span>
            </div>
            <ProgressTrack percent={progressPercent} isSuccess={isCelebration} />
            <div className="flex flex-row items-center justify-end">
              <span
                className={`font-sans text-[11px] font-semibold tabular-nums ${
                  isCelebration ? "text-[#16A34A]" : "text-[#CB262E]"
                }`}
              >
                {isCelebration ? "100%" : `${Math.round(progressPercent)}%`}
              </span>
            </div>
          </div>

          {isBlocked ? (
            <Link
              href="/shop"
              onClick={onDismiss}
              className={`inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg font-sans text-[15px] font-semibold text-white transition-[opacity,transform] hover:opacity-95 active:scale-[0.99] ${ctaClass}`}
            >
              {t("shopMore")}
            </Link>
          ) : isCelebration ? (
            <Link
              href="/checkout"
              onClick={() => writeCheckoutCartItemUuids(null)}
              className={`inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg font-sans text-[15px] font-semibold text-white transition-[opacity,transform] hover:opacity-95 active:scale-[0.99] ${ctaClass}`}
            >
              {t("continueCheckout")}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Desktop: centered popup (previous modal design). */
function MinimumOrderDesktopModal({
  variant,
  cartSubtotal,
  currencyCode,
  locale,
  minimum,
  onDismiss,
}: MinimumOrderContentProps & { onDismiss?: () => void }) {
  const {
    t,
    isCelebration,
    isBlocked,
    progressPercent,
    currentLabel,
    minimumLabel,
    remainingLabel,
  } = useMinimumOrderContent({
    variant,
    cartSubtotal,
    currencyCode,
    locale,
    minimum,
  });

  const title = isCelebration
    ? t("minimumOrderAchievedCelebration")
    : t("minimumOrderCheckoutBlockedTitle");

  const hint = isCelebration
    ? t("minimumOrderAchievedHint")
    : t("minimumOrderCheckoutBlockedHint");

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="minimum-order-desktop-title"
      className="relative mx-auto flex max-h-[min(92dvh,100%)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06]"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      onClick={(e) => e.stopPropagation()}
    >
      {!isCelebration ? (
        <div
          className="h-[3px] w-full shrink-0"
          style={{
            background:
              "linear-gradient(90deg, #CB262E 0%, #E04A52 50%, #CB262E 100%)",
          }}
          aria-hidden
        />
      ) : null}

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 end-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black/70"
          aria-label={t("close")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className={`flex flex-col items-center px-10 pb-6 pt-10 text-center ${
            isCelebration ? "bg-[#F0FDF4]/50" : ""
          }`}
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
              isCelebration ? "bg-[#22C55E]/15" : "bg-[#FFF5F5]"
            }`}
          >
            {isCelebration ? "🎉" : "🛒"}
          </div>

          <h2
            id="minimum-order-desktop-title"
            className={`mt-5 font-sans text-xl font-semibold leading-snug tracking-tight ${
              isCelebration ? "text-[#166534]" : "text-black"
            }`}
          >
            {title}
          </h2>

          <p
            className={`mt-2 max-w-[340px] font-sans text-sm leading-relaxed ${
              isCelebration ? "text-[#15803D]/85" : "text-black/65"
            }`}
          >
            {hint}
          </p>

          {isBlocked ? (
            <>
              <p className="mt-4 max-w-full break-words font-sans text-[26px] font-bold leading-tight tabular-nums text-[#CB262E]">
                {remainingLabel}
              </p>
              <p className="mt-1 font-sans text-xs font-medium uppercase tracking-wide text-black/45">
                {t("minimumOrderCheckoutRemainingLabel")}
              </p>
            </>
          ) : null}

          <div className="mt-6 w-full max-w-[320px]">
            <ProgressTrack percent={progressPercent} isSuccess={isCelebration} />
            <p className="mt-2 font-sans text-xs tabular-nums text-black/55">
              {currentLabel} / {minimumLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-10 pb-8">
        {isBlocked ? (
          <Link
            href="/shop"
            onClick={onDismiss}
            className="flex min-h-[52px] w-full items-center justify-center rounded-lg bg-[#CB262E] px-6 font-sans text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(203,38,46,0.35)] transition-[opacity,transform] hover:opacity-95 active:scale-[0.99]"
          >
            {t("shopMore")}
          </Link>
        ) : isCelebration ? (
          <Link
            href="/checkout"
            onClick={() => writeCheckoutCartItemUuids(null)}
            className="flex min-h-[52px] w-full items-center justify-center rounded-lg bg-[#22C55E] px-6 font-sans text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(34,197,94,0.35)] transition-[opacity,transform] hover:opacity-95 active:scale-[0.99]"
          >
            {t("continueCheckout")}
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}

export type MinimumOrderDockProps = {
  visible: boolean;
  variant: MinimumOrderDockVariant;
  cartSubtotal: number;
  currencyCode: string;
  locale: string;
  minimumAmount: number;
  showBackdrop: boolean;
  onDismissBlocked?: () => void;
};

export function MinimumOrderDock({
  visible,
  variant,
  cartSubtotal,
  currencyCode,
  locale,
  minimumAmount,
  showBackdrop,
  onDismissBlocked,
}: MinimumOrderDockProps) {
  const t = useTranslations();
  const isMobile = useMinOrderMobileLayout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible) {
      document.body.removeAttribute("data-min-order-dock");
      if (!isMobile) document.body.style.overflow = "";
      return;
    }

    if (isMobile) {
      document.body.setAttribute("data-min-order-dock", "open");
      document.body.style.overflow = "";
    } else {
      document.body.removeAttribute("data-min-order-dock");
      if (showBackdrop) document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.removeAttribute("data-min-order-dock");
      document.body.style.overflow = "";
    };
  }, [visible, isMobile, showBackdrop]);

  if (!mounted || typeof document === "undefined") return null;

  const contentProps = {
    variant,
    cartSubtotal,
    currencyCode,
    locale,
    minimum: minimumAmount,
    onDismiss: onDismissBlocked,
  };

  return createPortal(
    <AnimatePresence>
      {visible ? (
        <>
          {showBackdrop ? (
            <motion.button
              key="min-order-backdrop"
              type="button"
              className={`fixed inset-0 ${
                isMobile ? "bg-black/40 backdrop-blur-[1px]" : "bg-black/50 backdrop-blur-[2px]"
              }`}
              style={{ zIndex: MIN_ORDER_DOCK_Z - 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label={t("close")}
              onClick={onDismissBlocked}
            />
          ) : null}

          {isMobile ? (
            <motion.div
              key="min-order-mobile-sheet"
              className="fixed inset-x-0 bottom-0 isolate"
              style={{ zIndex: MIN_ORDER_DOCK_Z }}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <MinimumOrderMobileSheet {...contentProps} />
            </motion.div>
          ) : (
            <div
              key="min-order-desktop-modal"
              className="fixed inset-0 flex items-center justify-center p-4 md:p-6 pointer-events-none"
              style={{ zIndex: MIN_ORDER_DOCK_Z }}
            >
              <div className="pointer-events-auto w-[min(440px,calc(100vw-2rem))]">
                <MinimumOrderDesktopModal {...contentProps} />
              </div>
            </div>
          )}
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

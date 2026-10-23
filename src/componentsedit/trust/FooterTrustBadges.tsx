"use client";

import { useTranslations } from "next-intl";

/** Temu / marketplace-style: quiet icon + short label on dark footers. */
function SecurePaymentGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={12}
      height={12}
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 3.4 18.8 6.1v4.8c0 4.05-2.7 7.7-6.8 8.9-4.1-1.2-6.8-4.85-6.8-8.9V6.1L12 3.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 12.05 11.15 13.8l3.6-3.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QualityAssuranceGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={12}
      height={12}
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="7.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.8 12.15 11 14.35 15.3 9.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const badgeClassName =
  "inline-flex h-[26px] sm:h-[28px] min-w-0 items-center justify-center gap-1 rounded-[5px] border border-white/35 bg-transparent px-1.5 sm:px-2.5 text-[9px] sm:text-[11px] font-medium leading-none text-[#FAFAFA]";

/**
 * Marketplace-style trust cues (Temu / AliExpress pattern):
 * quiet shield/check marks — display only, same row, left-aligned.
 */
export default function FooterTrustBadges({ className = "" }: { className?: string }) {
  const t = useTranslations();

  return (
    <div
      className={`flex flex-nowrap w-fit max-w-full min-w-0 items-center gap-1.5 ${className}`.trim()}
      role="list"
      aria-label={t("trustedPayments")}
    >
      <span className={badgeClassName} role="listitem">
        <SecurePaymentGlyph />
        <span className="whitespace-nowrap">{t("securePaymentBadge")}</span>
      </span>

      <span className={badgeClassName} role="listitem">
        <QualityAssuranceGlyph />
        <span className="whitespace-nowrap">{t("qualityAssuranceBadge")}</span>
      </span>
    </div>
  );
}

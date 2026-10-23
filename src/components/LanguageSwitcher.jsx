"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useMemo } from "react";
import { routing } from "@/i18n/routing";
import { pathnameWithCurrentSearch } from "@/i18n/pathname";
import { useSiteCatalog } from "@/componentsedit/context/SiteCatalogContext";

const FALLBACK_LABELS = {
  en: "English",
  ar: "العربية",
};

const LanguageMark = ({ className = "" }) => {
  return (
    <svg
      width="22"
      height="18"
      viewBox="0 0 120 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* Matches the provided "translate + A" mark, drawn with strokes only. */}
      <g
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* top bar */}
        <path d="M18 18H80" />
        {/* down stroke from top bar (slightly right of center) */}
        <path d="M62 18V50" />
        {/* left curved stroke */}
        <path d="M62 50C50 66 38 72 24 78" />
        {/* inner hook stroke */}
        <path d="M40 50C48 60 56 68 66 74" />

        {/* A letter on the right */}
        <path d="M88 80L102 38L116 80" />
        <path d="M94 62H110" />
      </g>
    </svg>
  );
};

/**
 * Language switcher: cycles configured next-intl locales; labels from `getLanguages` when available.
 */
const LanguageSwitcher = ({ variant = "default", className = "" }) => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { languages } = useSiteCatalog();

  const localesOrder = routing.locales;

  const nextLocale = useMemo(() => {
    const idx = localesOrder.indexOf(locale);
    const nextIdx = idx >= 0 ? (idx + 1) % localesOrder.length : 0;
    return localesOrder[nextIdx] || localesOrder[0] || "en";
  }, [locale, localesOrder]);

  const cycleLanguage = () => {
    const idx = localesOrder.indexOf(locale);
    const nextIdx = idx >= 0 ? (idx + 1) % localesOrder.length : 0;
    const newLocale = localesOrder[nextIdx];
    router.replace(pathnameWithCurrentSearch(pathname), { locale: newLocale });
  };

  const switchToLabel = useMemo(() => {
    const key = String(nextLocale).toLowerCase();
    // Always prefer our explicit labels so Arabic is shown in Arabic script.
    if (FALLBACK_LABELS[key]) return FALLBACK_LABELS[key];
    const fromApi = languages.find(
      (l) => String(l.shortCode ?? "").toLowerCase() === key,
    );
    if (fromApi?.name?.trim()) return fromApi.name.trim();
    return String(nextLocale).toUpperCase();
  }, [languages, nextLocale]);

  const isPromobar = variant === "promobar";

  const buttonClasses = isPromobar
    ? "flex items-center gap-1 text-white hover:text-gray-300 transition-colors bg-transparent"
    : "flex items-center gap-1 text-gray-900 hover:text-camion-red transition-colors bg-transparent";

  const textClasses = isPromobar
    ? "text-[14px] font-normal"
    : "text-sm font-medium";

  return (
    <button
      onClick={cycleLanguage}
      className={`${buttonClasses} ${className}`}
      aria-label={t("switchLanguage")}
      type="button"
      dir="ltr"
    >
      <LanguageMark className="shrink-0 opacity-90" />
      <span className={textClasses}>{switchToLabel}</span>
    </button>
  );
};

export default LanguageSwitcher;

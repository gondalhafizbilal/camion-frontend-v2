"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
const ChevronDownIcon = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M2.5 4L6 7.5L9.5 4"
      stroke="#CB272E"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const textStyle: CSSProperties = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 400,
  fontSize: 12,
  lineHeight: "18px",
  color: "#000000",
};

export default function SecondaryTopBar() {
  const t = useTranslations();
  const locale = useLocale();
  const { currency, setCurrency, currencyOptions } = useCurrency();

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [influencerOpen, setInfluencerOpen] = useState(false);

  const influencerRef = useRef<HTMLDivElement | null>(null);
  const currencyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (influencerRef.current && !influencerRef.current.contains(target)) {
        setInfluencerOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="w-full hidden md:flex justify-center bg-white"
      style={{
        height: 24,
      }}
    >
      {/* overflow-visible: overflow-x-auto would clip the currency/partner dropdowns (overflow-y becomes auto). */}
      <div className="w-full min-h-full flex flex-row justify-end items-center gap-4 md:gap-6 px-4 md:px-10 overflow-visible">
        <div
          ref={influencerRef}
          className="relative"
          style={{
            flex: "none",
            order: 1,
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setInfluencerOpen(!influencerOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setInfluencerOpen((o) => !o);
              }
            }}
          >
            <span style={textStyle}>{t("becomePartner")}</span>
            <ChevronDownIcon />
          </div>

          {influencerOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                [locale === "ar" ? "right" : "left"]: 0,
                zIndex: 30,
                background: "#fff",
                boxShadow: "0px 4px 16px rgba(0,0,0,0.10)",
                borderRadius: 6,
                minWidth: 180,
                marginTop: 4,
                padding: "6px 0",
              }}
            >
              <Link
                href="/myaccount/affiliator-dashboard"
                className="block px-4 py-2 hover:bg-gray-50 whitespace-nowrap"
                style={textStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  setInfluencerOpen(false);
                }}
              >
                {t("affiliator")}
              </Link>

              <Link
                href="/myaccount/influencer-dashboard"
                className="block px-4 py-2 hover:bg-gray-50 whitespace-nowrap"
                style={textStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  setInfluencerOpen(false);
                }}
              >
                {t("influencer")}
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/about"
          className="whitespace-nowrap hover:opacity-80 transition-opacity flex items-center"
          style={{ ...textStyle, flex: "none", order: 2 }}
        >
          {t("aboutUs")}
        </Link>

        <Link
          href="/myaccount/help"
          className="whitespace-nowrap hover:opacity-80 transition-opacity flex items-center"
          style={{ ...textStyle, flex: "none", order: 3 }}
        >
          {t("helpSupport")}
        </Link>

        <div ref={currencyRef} className="relative" style={{ flex: "none", order: 4 }}>
          <button
            type="button"
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setCurrencyOpen((prev) => !prev)}
            aria-expanded={currencyOpen}
            aria-haspopup="listbox"
          >
            <span style={textStyle}>
              {t("currencyLabel")} {currency}
            </span>
            <ChevronDownIcon />
          </button>

          {currencyOpen && (
            <div
              role="listbox"
              style={{
                position: "absolute",
                top: "100%",
                [locale === "ar" ? "left" : "right"]: 0,
                zIndex: 30,
                background: "#fff",
                boxShadow: "0px 4px 16px rgba(0,0,0,0.10)",
                borderRadius: 6,
                minWidth: 120,
                marginTop: 4,
                padding: "6px 0",
              }}
            >
              {currencyOptions.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  className="w-full text-start px-4 py-2 hover:bg-gray-50 whitespace-nowrap"
                  style={textStyle}
                  onClick={() => {
                    setCurrency(code);
                    setCurrencyOpen(false);
                  }}
                >
                  {label === code ? code : `${code} — ${label}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center" style={{ flex: "none", order: 5 }}>
          <LanguageSwitcher variant="default" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { pathnameWithCurrentSearch } from "@/i18n/pathname";
import { toast } from "@/componentsedit/toast";
import AccountPanelSurface from "./AccountPanelSurface";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English (US)" },
  { value: "ar", label: "Arabic" },
];

function SelectChevron() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="pointer-events-none flex-shrink-0 opacity-80" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="#CB262E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AccountLanguagePanel() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const current = String(locale || "en");
  const [selected, setSelected] = useState(current);

  useEffect(() => {
    setSelected(current);
  }, [current]);

  const languageTitle = t("languageSettingsTitle");
  const selectedLabel = useMemo(() => {
    return LANGUAGE_OPTIONS.find((o) => o.value === selected)?.label || selected;
  }, [selected]);

  const handleSave = () => {
    if (selected === current) return;
    router.replace(pathnameWithCurrentSearch(pathname), { locale: selected });
    toast.success(t("languageUpdated"));
  };

  const handleCancel = () => {
    setSelected(current);
  };

  return (
    <div className="flex-1 w-full flex justify-center lg:justify-start">
      <AccountPanelSurface className="min-h-0 lg:min-h-[278px]">
        <h1
          className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]"
        >
          {languageTitle}
        </h1>

        <div className="flex flex-col items-stretch sm:items-start w-full mt-4 sm:mt-5 gap-2 max-w-[710px]">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
              color: "#000000",
            }}
          >
            {t("selectYourLanguage")}
          </span>

          <div className="relative w-full">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full appearance-none cursor-pointer bg-white outline-none"
              style={{
                height: 50,
                padding: "8px 24px",
                paddingRight: 56,
                border: "1px solid rgba(0, 0, 0, 0.15)",
                borderRadius: 5,
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 16,
                lineHeight: "24px",
                color: "#000000",
              }}
              aria-label={t("selectYourLanguage")}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <SelectChevron />
            </span>
          </div>

          <span className="sr-only">{selectedLabel}</span>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end w-full flex-wrap gap-4 sm:gap-8 mt-8 sm:mt-auto pt-8 sm:pt-10">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-transparent border-0 cursor-pointer hover:opacity-80 p-0 text-center sm:text-left font-sans font-normal text-base leading-6 text-black"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-[210px] h-12 sm:h-14 flex flex-row justify-center items-center border-0 cursor-pointer hover:opacity-90 rounded bg-[#CB262E] font-sans font-medium text-base leading-6 text-[#FAFAFA] px-6"
          >
            {t("save")}
          </button>
        </div>
      </AccountPanelSurface>
    </div>
  );
}


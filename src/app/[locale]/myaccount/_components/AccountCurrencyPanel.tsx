"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import AccountPanelSurface from "./AccountPanelSurface";

function SelectChevron() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="pointer-events-none flex-shrink-0 opacity-80" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="#CB262E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AccountCurrencyPanel() {
  const t = useTranslations();
  const { currency, setCurrency, supportedCurrencies, currencyOptions } =
    useCurrency();
  const [selected, setSelected] = useState<string>(currency);

  useEffect(() => {
    setSelected(currency);
  }, [currency]);

  const currencyTitle = t("currencySettingsTitle");

  const handleSave = () => {
    setCurrency(selected);
    toast.success(t("currencyUpdated"));
  };

  const handleCancel = () => {
    setSelected(currency);
  };

  return (
    <div className="flex-1 w-full flex justify-center lg:justify-start">
      <AccountPanelSurface className="min-h-0 lg:min-h-[278px]">
        <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
          {currencyTitle}
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
            {t("selectYourCurrency")}
          </span>

          <div className="relative w-full">
            <select
              value={selected}
              onChange={(e) => {
                const v = e.target.value;
                if ((supportedCurrencies as readonly string[]).includes(v)) {
                  setSelected(v);
                }
              }}
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
            >
              {currencyOptions.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label === code ? code : `${code} — ${label}`}
                </option>
              ))}
            </select>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <SelectChevron />
            </span>
          </div>
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

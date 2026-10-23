"use client";

import { useEffect, useRef, useState, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { AddressDraft } from "@/types/checkoutDisplay";
import CountryCodeCombobox from "@/componentsedit/auth/CountryCodeCombobox";
import CountryStateCityFields, {
  DEFAULT_COUNTRY_NAME,
} from "@/componentsedit/address/CountryStateCityFields";

/** Matches My Account → Addresses `TextInput` / checkout `AddressApiTextInput`. */
function AddressApiTextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "tel";
}) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="font-sans font-medium text-xs leading-[18px] text-black/60">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        className="w-full rounded border border-black/15 px-3 py-2 text-sm leading-5 outline-none focus:border-[#CB262E]"
      />
    </label>
  );
}

export type CheckoutAddressFormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  addressData: AddressDraft;
  setAddressData: (next: SetStateAction<AddressDraft>) => void;
  phoneCountryCode: string;
  setPhoneCountryCode: (next: string) => void;
  savingAddress: boolean;
  onSave: () => void | Promise<void>;
};

export default function CheckoutAddressFormModal({
  open,
  onClose,
  title,
  addressData,
  setAddressData,
  phoneCountryCode,
  setPhoneCountryCode,
  savingAddress,
  onSave,
}: CheckoutAddressFormModalProps) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input,button")?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (String(addressData.country ?? "").trim()) return;
    setAddressData((prev) => ({
      ...prev,
      country: DEFAULT_COUNTRY_NAME,
      state: "",
      city: "",
    }));
  }, [open, addressData, setAddressData]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("close") || "Close"}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-address-modal-title"
        className="relative w-full max-w-[710px] max-h-[min(92vh,900px)] overflow-y-auto rounded-t-[12px] sm:rounded-[8px] bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.12)] border border-black/10 p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-5">
          <h2
            id="checkout-address-modal-title"
            className="font-sans font-semibold text-lg sm:text-xl text-black pe-8"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 end-3 sm:top-4 sm:end-4 rounded-full p-2 text-black/50 hover:text-black hover:bg-black/[0.06]"
            aria-label={t("close") || "Close"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AddressApiTextInput
            label={t("fullName")}
            value={addressData.fullName ?? ""}
            onChange={(v) => setAddressData((prev) => ({ ...prev, fullName: v }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 min-w-0">
              <span className="font-sans font-medium text-xs leading-[18px] text-black/60">
                {t("countryCode")} *
              </span>
              <div className="w-full rounded border border-black/15 px-3 py-2" dir="ltr">
                <CountryCodeCombobox
                  value={addressData.countryCode ?? phoneCountryCode}
                  onChange={(v: string) => {
                    const next = String(v || "+974");
                    setPhoneCountryCode(next);
                    setAddressData((prev) => ({ ...prev, countryCode: next }));
                  }}
                  ariaLabel={t("countryCode") || "Country code"}
                />
              </div>
            </label>
            <AddressApiTextInput
              label={t("phone")}
              value={addressData.phoneLocal ?? ""}
              onChange={(v) =>
                setAddressData((prev) => ({ ...prev, phoneLocal: v }))
              }
              type="tel"
              required
            />
          </div>
          <AddressApiTextInput
            label={t("streetAddress")}
            value={addressData.streetAddress ?? addressData.address_1 ?? ""}
            onChange={(v) =>
              setAddressData((prev) => ({
                ...prev,
                streetAddress: v,
                address_1: v,
              }))
            }
            required
          />
          <AddressApiTextInput
            label={t("apartment")}
            value={addressData.apartment ?? addressData.address_2 ?? ""}
            onChange={(v) =>
              setAddressData((prev) => ({
                ...prev,
                apartment: v,
                address_2: v,
              }))
            }
          />
          <AddressApiTextInput
            label={t("postalCode")}
            value={addressData.zipCode ?? addressData.postcode ?? ""}
            onChange={(v) =>
              setAddressData((prev) => ({
                ...prev,
                zipCode: v,
                postcode: v,
              }))
            }
          />
          <CountryStateCityFields
            countryLabel={t("country")}
            stateLabel={t("state")}
            cityLabel={t("city")}
            countryValue={addressData.country ?? ""}
            stateValue={addressData.state ?? ""}
            cityValue={addressData.city ?? ""}
            onCountryChange={(v) =>
              setAddressData((prev) => ({ ...prev, country: v, state: "", city: "" }))
            }
            onStateChange={(v) =>
              setAddressData((prev) => ({ ...prev, state: v, city: "" }))
            }
            onCityChange={(v) => setAddressData((prev) => ({ ...prev, city: v }))}
            requiredCountry
            disabled={savingAddress}
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={savingAddress}
            className="rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#CB262E" }}
          >
            {savingAddress ? t("saving") : t("save")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-black/20 px-4 py-2 text-sm font-semibold text-black/80 hover:bg-black/[0.03] transition-colors"
            disabled={savingAddress}
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

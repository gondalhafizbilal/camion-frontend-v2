"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import {
  fetchCustomerAddresses,
  type GqlCustomerAddress,
} from "@/services/graphql";
import {
  buildCreateCustomerAddressPayloadFromFields,
  createCustomerAddress,
  updateCustomerAddress,
  setCustomerAddressAsDefault,
  type CreateCustomerAddressPayload,
} from "@/services/auth/customerAddresses";
import CountryCodeCombobox from "@/componentsedit/auth/CountryCodeCombobox";
import { splitInternationalPhone } from "@/lib/phone/splitInternationalPhone";
import CountryStateCityFields, {
  DEFAULT_COUNTRY_NAME,
} from "@/componentsedit/address/CountryStateCityFields";

function sortDefaultFirst(list: GqlCustomerAddress[]): GqlCustomerAddress[] {
  return [...list].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );
}

function AddressField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const v = value.trim();
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="font-sans font-medium text-xs leading-[18px] text-black/60">
        {label}
      </span>
      <span className="font-sans text-sm leading-snug text-black break-words">
        {v || "—"}
      </span>
    </div>
  );
}

function TextInput({
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
        className="w-full rounded border border-black/15 px-3 py-2 text-sm leading-5 outline-none focus:border-black/30"
      />
    </label>
  );
}

export default function AddressesPage() {
  const t = useTranslations();
  const [addresses, setAddresses] = useState<GqlCustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Requested page size. Some backends may ignore this and return a fixed small page.
  const PAGE_SIZE = 10;

  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+974");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY_NAME);

  const loadAddresses = useCallback(
    async (opts?: {
      /** After set-default PATCH; GraphQL `isDefault` may lag behind REST. */
      enforceDefaultUuid?: string;
    }) => {
      const token = Cookies.get("token");
      if (!token) {
        setAddresses([]);
        setHasNextPage(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { getCustomerAddresses } = await fetchCustomerAddresses(
          { pageNumber: page, itemsPerPage: PAGE_SIZE },
          token,
        );
        let list = (getCustomerAddresses ?? []).filter(Boolean);

        // Peek next page to decide whether "Next" should be enabled.
        const { getCustomerAddresses: nextRows } = await fetchCustomerAddresses(
          { pageNumber: page + 1, itemsPerPage: PAGE_SIZE },
          token,
        );
        setHasNextPage(Array.isArray(nextRows) && nextRows.length > 0);

        if (
          opts?.enforceDefaultUuid &&
          list.some((a) => a.uuid === opts.enforceDefaultUuid)
        ) {
          list = list.map((a) => ({
            ...a,
            isDefault: a.uuid === opts.enforceDefaultUuid,
          }));
        }
        setAddresses(sortDefaultFirst(list));
      } catch {
        setAddresses([]);
        setHasNextPage(false);
        toast.error(t("somethingWentWrong"));
      } finally {
        setLoading(false);
      }
    },
    [t, page],
  );

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      countryCode.trim().length > 0 &&
      phoneNumber.trim().length > 0 &&
      streetAddress.trim().length > 0
    );
  }, [fullName, countryCode, phoneNumber, streetAddress]);

  const resetForm = useCallback(() => {
    setFullName("");
    setCountryCode("+974");
    setPhoneNumber("");
    setStreetAddress("");
    setApartment("");
    setZipCode("");
    setCity("");
    setState("");
    setCountry(DEFAULT_COUNTRY_NAME);
    setEditingUuid(null);
  }, []);

  const onSaveAddress = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("pleaseLogin") || "Please login");
      return;
    }

    const payload: CreateCustomerAddressPayload =
      buildCreateCustomerAddressPayloadFromFields({
        fullName,
        countryCode,
        phoneNumber,
        streetAddress,
        apartment,
        zipCode,
        city,
        state,
        country,
      });

    setSaving(true);
    try {
      if (editingUuid) {
        await updateCustomerAddress(editingUuid, payload, token);
        toast.success(t("updated") || "Updated");
      } else {
        await createCustomerAddress(payload, token);
        toast.success(t("saved") || "Saved");
      }
      setShowForm(false);
      resetForm();
      setPage(1);
      await loadAddresses();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("somethingWentWrong"),
      );
    } finally {
      setSaving(false);
    }
  }, [
    apartment,
    city,
    country,
    countryCode,
    fullName,
    editingUuid,
    loadAddresses,
    phoneNumber,
    resetForm,
    state,
    streetAddress,
    t,
    zipCode,
  ]);

  const startEdit = useCallback((addr: GqlCustomerAddress) => {
    setEditingUuid(addr.uuid);
    setShowForm(true);
    setFullName(addr.fullName ?? "");
    const { dialCode, national } = splitInternationalPhone(addr.phoneNumber);
    setCountryCode(dialCode);
    setPhoneNumber(national);
    setStreetAddress(addr.streetAddress ?? "");
    setApartment(addr.apartment ?? "");
    setZipCode(addr.zipCode ?? "");
    setCity(addr.city ?? "");
    setState(addr.state ?? "");
    setCountry(addr.country ?? DEFAULT_COUNTRY_NAME);
  }, []);

  const onSetDefault = useCallback(
    async (uuid: string) => {
      const token = Cookies.get("token");
      if (!token) {
        toast.error(t("pleaseLogin") || "Please login");
        return;
      }
      setSaving(true);
      try {
        await setCustomerAddressAsDefault(uuid, token);
        toast.success(t("saved") || "Saved");
        await loadAddresses({ enforceDefaultUuid: uuid });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("somethingWentWrong"));
      } finally {
        setSaving(false);
      }
    },
    [loadAddresses, t],
  );

  const surfaceClass =
    "flex-1 w-full bg-white shadow-[0px_1px_13px_rgba(0,0,0,0.05)] rounded-[4px] min-h-0 sm:min-h-[480px] lg:min-h-[978px] p-4 sm:p-6 md:p-8 lg:p-10";

  if (loading) {
    return (
      <section className={surfaceClass}>
        <div className="font-sans font-medium text-base leading-6 text-black mb-5 sm:mb-6">
          {t("savedAddresses")}
        </div>
        <div className="space-y-4 max-w-[710px]">
          <div className="h-36 rounded-[5px] bg-black/[0.06] animate-pulse" />
          <div className="h-36 rounded-[5px] bg-black/[0.06] animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className={surfaceClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="font-sans font-medium text-base leading-6 text-black">
          {t("savedAddresses")}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "#CB262E" }}
          disabled={saving}
        >
          {showForm ? t("cancel") : t("addNewAddress")}
        </button>
      </div>

      {showForm ? (
        <div className="w-full max-w-[710px] rounded-[5px] border border-black/15 p-4 sm:p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label={t("fullName")}
              value={fullName}
              onChange={setFullName}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 min-w-0">
                <span className="font-sans font-medium text-xs leading-[18px] text-black/60">
                  {t("countryCode")} *
                </span>
                <div className="w-full rounded border border-black/15 px-3 py-2" dir="ltr">
                  <CountryCodeCombobox
                    value={countryCode}
                    onChange={(v: string) => setCountryCode(String(v || "+974"))}
                    ariaLabel={t("countryCode") || "Country code"}
                  />
                </div>
              </label>
              <TextInput
                label={t("phone")}
                value={phoneNumber}
                onChange={setPhoneNumber}
                type="tel"
                required
              />
            </div>
            <TextInput
              label={t("streetAddress")}
              value={streetAddress}
              onChange={setStreetAddress}
              required
            />
            <TextInput
              label={t("apartment")}
              value={apartment}
              onChange={setApartment}
            />
            <TextInput
              label={t("postalCode")}
              value={zipCode}
              onChange={setZipCode}
            />
            <CountryStateCityFields
              countryLabel={t("country")}
              stateLabel={t("state")}
              cityLabel={t("city")}
              countryValue={country}
              stateValue={state}
              cityValue={city}
              onCountryChange={setCountry}
              onStateChange={setState}
              onCityChange={setCity}
              requiredCountry
              disabled={saving}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSaveAddress}
              disabled={!canSubmit || saving}
              className="rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#CB262E" }}
            >
              {saving ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded border border-black/20 px-4 py-2 text-sm font-semibold text-black/80 hover:bg-black/[0.03] transition-colors"
              disabled={saving}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {addresses.length === 0 ? (
        <p className="font-sans text-sm leading-relaxed text-black/70 max-w-[710px]">
          {t("noSavedAddressesHint")}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-4 sm:gap-6 w-full max-w-[710px] list-none p-0 m-0">
            {addresses.map((addr) => (
              <li
                key={addr.uuid}
                className="rounded-[5px] border border-black/15 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {addr.isDefault ? (
                    <span
                      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ background: "#CB262E" }}
                    >
                      {t("defaultAddressBadge")}
                    </span>
                  ) : null}
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      onClick={() => void onSetDefault(addr.uuid)}
                      className="text-xs font-semibold text-black/70 hover:text-black hover:opacity-80"
                      disabled={saving}
                    >
                      {t("setAsDefault") || "Set as default"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => startEdit(addr)}
                    className="ms-auto text-xs font-semibold text-[#CB262E] hover:opacity-80"
                  >
                    {t("edit") || "Edit"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AddressField label={t("fullName")} value={addr.fullName} />
                  <AddressField
                    label={t("phone")}
                    value={String(addr.phoneNumber ?? "").trim()}
                  />
                  <AddressField
                    label={t("streetAddress")}
                    value={addr.streetAddress}
                  />
                  <AddressField label={t("apartment")} value={addr.apartment} />
                  <AddressField label={t("city")} value={addr.city} />
                  <AddressField label={t("state")} value={addr.state} />
                  <AddressField label={t("postalCode")} value={addr.zipCode} />
                  <AddressField label={t("country")} value={addr.country} />
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-center gap-2 mt-6 w-full max-w-[710px]">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={saving || loading || page === 1}
              className="px-4 py-2 cursor-pointer hover:bg-[#e14a5c] hover:text-white bg-gray-200 rounded disabled:opacity-50"
            >
              {t("prev") || "Prev"}
            </button>
            <span className="px-3 py-1 border rounded text-sm">
              {t("page") || "Page"} {page}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={saving || loading || !hasNextPage}
              className="px-4 py-2 cursor-pointer hover:bg-[#e14a5c] hover:text-white bg-gray-200 rounded disabled:opacity-50"
            >
              {t("next") || "Next"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

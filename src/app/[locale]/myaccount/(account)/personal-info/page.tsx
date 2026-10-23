"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { useUser } from "@/componentsedit/context/UserContext";
import { toast } from "@/componentsedit/toast";
import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { fetchCurrentCustomer } from "@/services/graphql";
import {
  parseCustomerSelfJson,
  type CustomerSelfFields,
} from "@/services/auth/customerSelf";
import CountryCodeCombobox from "@/componentsedit/auth/CountryCodeCombobox";
import { splitInternationalPhone } from "@/lib/phone/splitInternationalPhone";

function authCookieOptions(): Cookies.CookieAttributes {
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const opts: Cookies.CookieAttributes = {
    expires: 7,
    path: "/",
    sameSite: "Lax",
  };
  if (isSecure) opts.secure = true;
  return opts;
}

function fieldsFromCookies(): CustomerSelfFields {
  return {
    fullName: (Cookies.get("fullName") || "").trim(),
    email: (Cookies.get("email") || "").trim(),
    phone: (Cookies.get("phone") || "").trim(),
  };
}

export default function PersonalInfoPage() {
  const t = useTranslations();
  const { refetchUser } = useUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+974");
  const [phone, setPhone] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      const c = fieldsFromCookies();
      setFullName(c.fullName);
      setEmail(c.email);
      setPhone(c.phone);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    try {
      const { getCurrentCustomer } = await fetchCurrentCustomer(token);

      if (!getCurrentCustomer) {
        const c = fieldsFromCookies();
        setFullName(c.fullName);
        setEmail(c.email);
        setPhone(c.phone);
        return;
      }

      const full = (getCurrentCustomer.fullName ?? "").trim();
      const emailAddr = (getCurrentCustomer.emailAddress ?? "").trim();
      const phoneNum = (getCurrentCustomer.phoneNumber ?? "").trim();
      const cookieDial = (Cookies.get("countryCode") || "").trim();
      const { dialCode, national } = splitInternationalPhone(
        phoneNum,
        cookieDial || "+974",
      );

      setFullName(full);
      setEmail(emailAddr);
      setCountryCode(dialCode || cookieDial || "+974");
      setPhone(national || phoneNum);

      const opts = authCookieOptions();
      if (full) Cookies.set("fullName", full, opts);
      if (emailAddr) Cookies.set("email", emailAddr, opts);
      if (dialCode) Cookies.set("countryCode", dialCode, opts);
      if (national || phoneNum) Cookies.set("phone", national || phoneNum, opts);
      const id = (getCurrentCustomer.uuid ?? "").trim();
      if (id) Cookies.set("id", id, opts);
    } catch {
      const c = fieldsFromCookies();
      const cookieDial = (Cookies.get("countryCode") || "").trim();
      const { dialCode, national } = splitInternationalPhone(
        c.phone,
        cookieDial || "+974",
      );
      setFullName(c.fullName);
      setEmail(c.email);
      setCountryCode(dialCode || cookieDial || "+974");
      setPhone(national || c.phone);
      toast.error(t("somethingWentWrong"));
    } finally {
      setLoadingProfile(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("somethingWentWrong"));
      return;
    }

    const trimmed = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedCountryCode = countryCode.trim();
    const trimmedPhoneNumber = phone.trim();
    if (!trimmed) {
      toast.error(t("fullNameRequired"));
      return;
    }
    if (!trimmedEmail) {
      toast.error(
        t("pleaseFillAllRequiredFields") || "Please fill all required fields.",
      );
      return;
    }
    if (!trimmedCountryCode || !trimmedPhoneNumber) {
      toast.error(
        t("pleaseFillAllRequiredFields") || "Please fill all required fields.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.CUSTOMER_SELF, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fullName: trimmed,
          emailAddress: trimmedEmail,
          countryCode: trimmedCountryCode,
          phoneNumber: trimmedPhoneNumber,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        const fieldErrors =
          data?.errors && typeof data.errors === "object"
            ? Object.values(data.errors).filter(Boolean).join("\n")
            : "";
        toast.error(
          fieldErrors ||
            (typeof data?.message === "string" && data.message
              ? data.message
              : t("somethingWentWrong")),
        );
        return;
      }

      Cookies.set("fullName", trimmed, authCookieOptions());
      Cookies.set("email", trimmedEmail, authCookieOptions());
      Cookies.set("countryCode", trimmedCountryCode, authCookieOptions());
      Cookies.set("phone", trimmedPhoneNumber, authCookieOptions());
      toast.success(t("personalInfoUpdated"));
      void refetchUser();

      const merged = parseCustomerSelfJson(data);
      if (merged.email) setEmail(merged.email);
      if (merged.phone) setPhone(merged.phone);
    } catch {
      toast.error(t("somethingWentWrong"));
    } finally {
      setSaving(false);
    }
  };

  const editableInputClass =
    "w-full min-w-0 outline-none font-sans text-sm h-11 sm:h-11 rounded-[5px] border border-black/15 px-3 sm:px-[14px]";

  return (
    <section
      className="flex-1 w-full bg-white shadow-[0px_1px_13px_rgba(0,0,0,0.05)] rounded-[4px] min-h-0 sm:min-h-[480px] lg:min-h-[978px] p-4 sm:p-6 md:p-8 lg:p-10"
    >
      <div
        className="font-sans font-medium text-base leading-6 text-black mb-5 sm:mb-6"
      >
        {t("personalInformation")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-[710px]">
        <label className="flex flex-col gap-2 min-w-0 md:col-span-2">
          <span
            className="font-sans font-medium text-xs leading-[18px] text-black capitalize"
          >
            {t("fullName")}
          </span>
          <input
            type="text"
            name="fullName"
            autoComplete="name"
            placeholder={t("fullNamePlaceholder")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loadingProfile}
            className={editableInputClass}
          />
        </label>

        <label className="flex flex-col gap-2 min-w-0">
          <span
            className="font-sans font-medium text-xs leading-[18px] text-black capitalize"
          >
            {t("email")}
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            placeholder={t("emailPlaceholder")}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loadingProfile}
            className={editableInputClass}
          />
        </label>

        <label className="flex flex-col gap-2 min-w-0">
          <span
            className="font-sans font-medium text-xs leading-[18px] text-black capitalize"
          >
            {t("phone")}
          </span>
          <div
            className="box-border flex flex-row items-center gap-2 w-full bg-white border border-black/15 rounded-[5px] px-3 sm:px-[14px]"
            style={{ height: 44 }}
            dir="ltr"
          >
            <CountryCodeCombobox
              value={countryCode}
              onChange={(v: string) => setCountryCode(v)}
              disabled={loadingProfile}
              ariaLabel={t("countryCode") || "Country code"}
            />
            <input
              type="tel"
              dir="ltr"
              name="phone"
              autoComplete="tel"
              value={phone}
              placeholder={t("phonePlaceholder")}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loadingProfile}
              className="flex-1 min-w-0 outline-none font-sans text-sm bg-transparent border-none text-start"
            />
          </div>
        </label>
      </div>

      <div className="flex justify-end mt-8 sm:mt-10 w-full max-w-[710px]">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={loadingProfile || saving}
          className="w-full max-w-[147px] sm:w-[147px] h-10 flex items-center justify-center font-sans font-semibold text-sm leading-6 capitalize text-white bg-[#CB262E] rounded-[5px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? t("loading") : t("save")}
        </button>
      </div>
    </section>
  );
}

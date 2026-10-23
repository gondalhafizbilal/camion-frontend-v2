"use client";

import { useMemo, useState, type FormEvent } from "react";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { apiFetch } from "@/services/api/apiClient";
import AccountPanelSurface from "./AccountPanelSurface";
import { useLocale, useTranslations } from "next-intl";
import { getCountryOptions } from "@/lib/countries";

export type PartnerJoinFormFields = {
  fullName: string;
  gender: string;
  nationality: string;
  bio: string;
};

function defaultBuildBody(fields: PartnerJoinFormFields) {
  return {
    fullName: fields.fullName.trim(),
    gender: fields.gender,
    nationality: fields.nationality,
    bio: fields.bio.trim(),
  };
}

function firstApiErrorMessage(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const msg = data.message ?? data.error;
  if (typeof msg === "string" && msg.trim()) return msg;
  const errors = data.errors;
  if (errors && typeof errors === "object") {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v) && v[0] != null) return String(v[0]);
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

export default function PartnerJoinFormPanel({
  title,
  submitEndpoint,
  submitSuccessText = "Request submitted successfully.",
  buildSubmitBody = defaultBuildBody,
  onSubmitSuccess,
}: {
  title: string;
  submitEndpoint: string;
  submitSuccessText?: string;
  /** Maps form state to JSON body (e.g. referral API expects `Male` / `Qatari`). */
  buildSubmitBody?: (fields: PartnerJoinFormFields) => Record<string, string>;
  onSubmitSuccess?: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations();
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    nationality: "",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);

  const handleChange = (
    name: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("toastPleaseLoginFirst"));
      return;
    }
    if (!formData.fullName.trim() || !formData.gender || !formData.nationality || !formData.bio.trim()) {
      toast.error(t("toastFillRequiredFields"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(submitEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildSubmitBody(formData)),
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        toast.error(firstApiErrorMessage(data) || t("toastUnableSubmit"));
        return;
      }

      toast.success(submitSuccessText);
      setFormData({ fullName: "", gender: "", nationality: "", bio: "" });
      onSubmitSuccess?.();
    } catch {
      toast.error(t("toastUnableSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full contents">
      <AccountPanelSurface className="min-h-0 lg:min-h-[741px]">
      <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
        {title}
      </h1>

      <div className="mt-4" style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "24px" }}>
        {t("partnerFormSectionPersonal")}
      </div>

      <div className="mt-3" style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px" }}>
        {t("partnerFormFullName")}
      </div>
      <input
        value={formData.fullName}
        onChange={(e) => handleChange("fullName", e.target.value)}
        placeholder={t("partnerFormFullNamePh")}
        className="mt-1 w-full outline-none"
        style={{
          height: 50,
          border: "1px solid rgba(0, 0, 0, 0.15)",
          borderRadius: 5,
          padding: "8px 24px",
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          lineHeight: "24px",
        }}
      />

      <div className="mt-5" style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px" }}>
        {t("partnerFormGender")}
      </div>
      <select
        value={formData.gender}
        onChange={(e) => handleChange("gender", e.target.value)}
        className="mt-1 w-full outline-none bg-white"
        style={{
          height: 50,
          border: "1px solid rgba(0, 0, 0, 0.15)",
          borderRadius: 5,
          padding: "8px 24px",
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          lineHeight: "24px",
        }}
      >
        <option value="">{t("partnerFormGenderPh")}</option>
        <option value="male">{t("partnerFormMale")}</option>
        <option value="female">{t("partnerFormFemale")}</option>
      </select>

      <div className="mt-5" style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px" }}>
        {t("partnerFormNationality")}
      </div>
      <select
        value={formData.nationality}
        onChange={(e) => handleChange("nationality", e.target.value)}
        className="mt-1 w-full outline-none bg-white"
        style={{
          height: 50,
          border: "1px solid rgba(0, 0, 0, 0.15)",
          borderRadius: 5,
          padding: "8px 24px",
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          lineHeight: "24px",
        }}
      >
        <option value="">{t("partnerFormNationalityPh")}</option>
        {countryOptions.map((c) => (
          <option key={c.code} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="mt-5" style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px" }}>
        {t("partnerFormAbout")}
      </div>
      <textarea
        value={formData.bio}
        onChange={(e) => handleChange("bio", e.target.value)}
        placeholder={t("partnerFormAboutPh")}
        className="mt-1 w-full outline-none resize-none"
        style={{
          height: 188,
          border: "1px solid rgba(0, 0, 0, 0.15)",
          borderRadius: 5,
          padding: 16,
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: 10,
          lineHeight: "18px",
        }}
      />

      <div className="w-full flex justify-stretch sm:justify-end mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-[210px] h-12 sm:h-[50px] flex items-center justify-center hover:opacity-90 disabled:opacity-60 bg-[#CB262E] rounded-[5px] font-sans font-semibold text-base leading-6 capitalize text-white px-6"
        >
          {submitting ? t("partnerFormSubmitting") : t("startNow")}
        </button>
      </div>
      </AccountPanelSurface>
    </form>
  );
}


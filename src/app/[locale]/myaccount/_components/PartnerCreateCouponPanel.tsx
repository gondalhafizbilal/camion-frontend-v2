"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Cookies from "js-cookie";
import { apiFetch } from "@/services/api/apiClient";
import AccountPanelSurface from "./AccountPanelSurface";

const labelClass =
  "font-sans font-medium text-sm sm:text-base leading-6 capitalize text-black";
const inputClass =
  "w-full min-w-0 box-border h-12 rounded-[5px] border border-black/15 px-4 sm:px-6 font-sans font-medium text-sm leading-6 text-black outline-none focus:border-[#CB262E]/50";

function firstApiErrorMessage(
  data: Record<string, unknown> | null | undefined,
): string | null {
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

/** Local calendar date as `yyyy-mm-dd` for `input[type="date"]` (min / validation). */
function localYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PartnerCreateCouponPanel({
  title,
  submitEndpoint,
}: {
  title?: string;
  submitEndpoint?: string;
}) {
  const t = useTranslations();
  const displayTitle = title ?? t("partnerActionCreateCoupon");
  /** Set after mount so SSR and first client paint match, and `min` always reflects the user's local today. */
  const [minExpiryDate, setMinExpiryDate] = useState("");

  useEffect(() => {
    setMinExpiryDate(localYyyyMmDd(new Date()));
  }, []);

  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState("");
  const [validity, setValidity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token || !submitEndpoint) {
      setIsError(true);
      setMessage(t("unableToCoupon"));
      return;
    }

    const discountValue = Number(percentage);
    if (!code.trim() || Number.isNaN(discountValue) || discountValue <= 0) {
      setIsError(true);
      setMessage(t("couponInvalidForm"));
      return;
    }
    if (!validity.trim()) {
      setIsError(true);
      setMessage(t("couponChooseExpiry"));
      return;
    }
    const today = localYyyyMmDd(new Date());
    if (validity.trim() < today) {
      setIsError(true);
      setMessage(t("couponExpiryPast"));
      return;
    }

    setSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const payload = {
        code: code.trim(),
        discountPercentage: discountValue,
        expiresAt: validity.trim(),
      };

      const res = await apiFetch(submitEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(firstApiErrorMessage(data) || t("createCouponFailed"));
      }

      setIsError(false);
      setMessage(t("createCouponSuccess"));
      setCode("");
      setPercentage("");
      setValidity("");
    } catch (error: unknown) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : t("createCouponFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountPanelSurface className="min-h-0 lg:min-h-[490px]">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 sm:gap-6 w-full max-w-[710px]"
      >
        <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444] m-0">
          {displayTitle}
        </h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="coupon-code" className={labelClass}>
            {t("couponCodeLabel")}
          </label>
          <input
            id="coupon-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("couponCodePlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="coupon-percentage" className={labelClass}>
            {t("couponPercentageLabel")}
          </label>
          <input
            id="coupon-percentage"
            type="number"
            min={1}
            max={100}
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder={t("couponPercentagePlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="coupon-validity" className={labelClass}>
            {t("couponExpiryLabel")}
          </label>
          <input
            id="coupon-validity"
            type="date"
            required
            value={validity}
            onChange={(e) => {
              const v = e.target.value;
              const min = minExpiryDate || localYyyyMmDd(new Date());
              if (v && v < min) return;
              setValidity(v);
            }}
            min={minExpiryDate || undefined}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 pt-2">
          {message ? (
            <p
              className={`m-0 text-center sm:text-start sm:flex-1 sm:mr-auto font-sans font-medium text-xs sm:text-sm leading-[18px] ${
                isError ? "text-[#CB262E]" : "text-[#3D743A]"
              }`}
            >
              {message}
            </p>
          ) : (
            <span className="hidden sm:block sm:flex-1" aria-hidden />
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-[210px] h-12 flex items-center justify-center rounded-[5px] border-0 bg-[#CB262E] font-sans font-semibold text-base leading-6 capitalize text-white px-6 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
          >
            {submitting ? t("creatingCoupon") : t("create")}
          </button>
        </div>
      </form>
    </AccountPanelSurface>
  );
}

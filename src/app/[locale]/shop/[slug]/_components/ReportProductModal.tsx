"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

export default function ReportProductModal({
  open,
  productUuid,
  onClose,
}: {
  open: boolean;
  productUuid?: string | number | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const [reason, setReason] = useState<string>("other");
  const [details, setDetails] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const reasons = [
    ["incorrect_product_information", t("incorrect_product_information")],
    ["product_quality_concerns", t("product_quality_concerns")],
    ["safety_concerns", t("safety_concerns")],
    ["incorrect_pricing", t("incorrect_pricing")],
    ["duplicate_listing", t("duplicate_listing")],
    ["inappropriate_offensive_content", t("inappropriate_offensive_content")],
    ["legal_regulatory_concern", t("legal_regulatory_concern")],
    ["other", t("other")],
  ] as [string, string][];

  const onFiles = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(ev.target.files);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const submit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setError(null);
    if (!productUuid) return setError(t("reportNoProduct"));
    const d = String(details || "").trim();
    if (d.length < 10 || d.length > 1024) return setError(t("reportDetailsLength"));
    if (!reason) return setError(t("reportReasonRequired"));
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("productUuid", String(productUuid));
      form.append("reason", reason);
      form.append("details", d);
      if (orderNumber) form.append("orderNumber", orderNumber);
      if (files && files.length) {
        for (let i = 0; i < files.length; i++) {
          form.append("attachments", files[i]);
        }
      }

      const res = await fetch(`/v1/product-reports`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || res.statusText || "error");
      }
      // success — show confirmation within modal
      setSubmitted(true);
    } catch (e: any) {
      setError(String(e?.message || t("reportSubmitError")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded bg-white p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-sans text-lg font-semibold">{t("reportProductHeading")}</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-600">
            {t("close")}
          </button>
        </div>

        {!submitted ? (
          <>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">
                {t("reportReason")}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border p-2"
              >
                {reasons.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">
                {t("reportDetails")}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("reportDetailsPlaceholder")}
                className="w-full min-h-[120px] rounded border p-2 text-sm"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">
                {t("reportOrderNumber")}
              </label>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full rounded border p-2 text-sm"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">
                {t("reportAttachments")}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="rounded border border-[#CB262E] bg-white px-3 py-2 text-sm font-medium text-[#CB262E] hover:bg-[#FBF4F4]"
                >
                  {t("chooseFiles")}
                </button>
                <span className="text-sm text-gray-600">
                  {files?.length
                    ? `${files.length} ${t("filesSelected")}`
                    : t("noFilesSelected")}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFiles}
                className="hidden"
              />
            </div>

            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded border px-4 py-2 text-sm"
              >
                {t("reportCancel")}
              </button>
              <button
                disabled={submitting}
                type="submit"
                className="w-full sm:w-auto rounded bg-[#CB262E] px-4 py-2 text-sm text-white"
              >
                {submitting ? t("reportSubmitting") : t("reportSubmit")}
              </button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="mb-4 text-lg font-medium">{t("reportSubmittedMessage")}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-[#CB262E] px-4 py-2 text-white"
            >
              {t("ok")}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

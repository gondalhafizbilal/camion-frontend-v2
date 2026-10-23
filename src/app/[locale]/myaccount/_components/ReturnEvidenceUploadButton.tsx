"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import { uploadReturnRequestEvidence } from "@/services/returns/uploadReturnRequestEvidence";

type Props = {
  returnRequestUuid: string;
  onUploaded: () => void | Promise<void>;
  className?: string;
  variant?: "primary" | "outline";
};

export default function ReturnEvidenceUploadButton({
  returnRequestUuid,
  onUploaded,
  className = "",
  variant = "primary",
}: Props) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const uuid = String(returnRequestUuid || "").trim();
  const baseBtn =
    "inline-flex min-h-[40px] w-full sm:w-auto sm:min-w-[180px] items-center justify-center rounded-[5px] px-4 font-sans font-semibold text-sm leading-6 capitalize transition-opacity disabled:opacity-60 disabled:pointer-events-none";
  const variantClass =
    variant === "outline"
      ? "border border-[#CB262E] bg-transparent text-[#CB262E] hover:opacity-90"
      : "border border-[#CB262E] bg-[#CB262E] text-white hover:opacity-90";

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("loginRequired"));
      return;
    }
    if (!uuid) return;

    setBusy(true);
    try {
      const picked = Array.from(list);
      for (const file of picked) {
        await uploadReturnRequestEvidence(token, uuid, file);
      }
      toast.success(t("evidenceUploaded"));
      await onUploaded();
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 400) {
        toast.error(t("evidenceUploadNotAllowed"));
      } else {
        const msg = err instanceof Error ? err.message : t("evidenceUploadFailed");
        toast.error(msg || t("evidenceUploadFailed"));
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        tabIndex={-1}
        onChange={onChange}
      />
      <button
        type="button"
        disabled={busy}
        aria-label={t("uploadEvidenceRequired")}
        onClick={() => inputRef.current?.click()}
        className={`${baseBtn} ${variantClass} ${className}`.trim()}
      >
        {busy ? t("loading") : t("uploadEvidenceRequired")}
      </button>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

export type ProductSizeChartDialogProps = {
  open: boolean;
  url: string;
  onClose: () => void;
  title?: string;
};

function isLikelyPdf(url: string): boolean {
  return String(url).toLowerCase().includes(".pdf");
}

function isLikelyImage(url: string): boolean {
  const s = String(url).toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg)$/.test(s);
}

export default function ProductSizeChartDialog({
  open,
  url,
  onClose,
  title = "Size Chart",
}: ProductSizeChartDialogProps) {
  const t = useTranslations();
  const closeLabel = t("close") || "Close";
  const [mounted, setMounted] = useState(false);

  const embedType = useMemo(() => {
    if (!url) return "none";
    if (isLikelyPdf(url)) return "iframe";
    if (isLikelyImage(url)) return "img";
    return "iframe";
  }, [url]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-[1] flex w-full max-w-[980px] max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div
              className="text-sm font-semibold text-[#CB262E] sm:text-base"
              style={{ letterSpacing: "-0.2px" }}
            >
              {title}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#CB262E]/20 bg-white px-3 py-1.5 font-sans text-sm text-[#CB262E] hover:bg-[#CB262E]/5"
          >
            {closeLabel}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {embedType === "img" ? (
            <img
              src={url}
              alt={title}
              className="h-auto w-full object-contain"
              loading="eager"
            />
          ) : (
            <iframe
              src={url}
              title={title}
              className="h-[min(78vh,720px)] w-full min-h-[320px] border-0"
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { GqlReturnRequest } from "@/services/graphql";
import { getTransformedImageUrl } from "@/lib/images/getTransformedImageUrl";
import ReturnEvidenceUploadButton from "./ReturnEvidenceUploadButton";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { gqlMoneyToNumberOrZero } from "@/services/graphql/money";

type IntlT = ReturnType<typeof useTranslations>;

function normalizeReturnStatus(s: string | undefined | null) {
  const x = String(s || "").toLowerCase();
  if (x.includes("refund")) return "refunded";
  if (x.includes("approv")) return "approved";
  if (x.includes("reject")) return "rejected";
  return "pending";
}

function reasonLabel(reason: string | null | undefined, t: IntlT): string {
  const r = String(reason || "").toLowerCase();
  if (r === "wrong_variation") return t("returnReasonWrongVariation") || "Wrong Variation";
  if (r === "damaged_broken") return t("returnReasonDamagedBroken") || "Damaged / Broken";
  if (r === "wrong_product") return t("returnReasonWrongProduct") || "Wrong Product";
  return r || "—";
}

function moneyText(m: unknown, fallbackCurrency: string, locale: string): string {
  if (!m || typeof m !== "object") {
    return formatAmountWithCurrency(0, fallbackCurrency, locale);
  }
  const amount = gqlMoneyToNumberOrZero(
    m as { amount?: number | string | null; minorAmount?: number | string | null },
  );
  const c = String(
    (m as { currencyCode?: unknown }).currencyCode ?? fallbackCurrency,
  ).toUpperCase();
  return formatAmountWithCurrency(amount, c, locale);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full flex-row items-start justify-between gap-3">
      <span
        className="shrink-0"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 13,
          lineHeight: "20px",
          color: "rgba(0,0,0,0.7)",
        }}
      >
        {label}
      </span>
      <span
        className="min-w-0 flex-1 break-words text-end"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 13,
          lineHeight: "20px",
          color: "#000000",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function resolveEvidenceHref(rawUrl: string, assetsHost: string): string {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  const transformed = getTransformedImageUrl(trimmed, assetsHost);
  return transformed || trimmed;
}

function isImageEvidence(mime: string | null | undefined, href: string): boolean {
  const m = String(mime || "").toLowerCase();
  if (m.startsWith("image/")) return true;
  if (/\.(jpe?g|png|gif|webp|avif|bmp)(\?|$)/i.test(href)) return true;
  return false;
}

function isVideoEvidence(mime: string | null | undefined, href: string): boolean {
  const m = String(mime || "").toLowerCase();
  if (m.startsWith("video/")) return true;
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(href)) return true;
  return false;
}

export default function ReturnRefundRequestDetailCenterContent({
  req,
  onEvidenceUploaded,
}: {
  req: GqlReturnRequest;
  onEvidenceUploaded?: () => void | Promise<void>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const currencyCode =
    String(req.refundAmount?.currencyCode ?? "").trim().toUpperCase() || "QAR";
  const assetsHost =
    process.env.NEXT_PUBLIC_ASSETS_HOST || "https://assets.camiontrading.com";

  const status = normalizeReturnStatus(req.status);
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isRefunded = status === "refunded";
  const isPending = status === "pending";
  const badgeBg = isRefunded ? "#E3FFD5" : isRejected ? "#FFE5E5" : isApproved ? "#E8F4FF" : "#FFF4E5";
  const badgeColor = isRefunded ? "#3D743A" : isRejected ? "#A61B1B" : isApproved ? "#1B4FA6" : "#B8860B";
  const badgeLabel = status.charAt(0).toUpperCase() + status.slice(1);

  const orderUuid = String(req.order?.uuid ?? "").trim();
  const evidence = Array.isArray(req.evidence) ? req.evidence : [];
  const refundText = moneyText(req.refundAmount, currencyCode, locale);
  const showMandatoryUpload = isPending && evidence.length === 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="flex w-full max-w-[710px] flex-col"
        style={{ gap: 16, display: "flex", flexDirection: "column" }}
      >
        <div className="flex w-full flex-col gap-3 rounded-[10px] border border-black/10 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 16,
                lineHeight: "24px",
                color: "#000000",
              }}
            >
              {t("returnRequestPrefix") || "Return Request #"}
              {req.uuid}
            </span>
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 12,
                lineHeight: "18px",
                color: "rgba(0,0,0,0.7)",
              }}
            >
              {t("orderPrefix") || "Order #"}
              {orderUuid || "—"}
            </span>
          </div>
          <span
            className="inline-flex shrink-0 items-center justify-center self-start"
            style={{
              minWidth: 110,
              height: 24,
              padding: "5px 13px",
              background: badgeBg,
              borderRadius: 5,
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 12,
              lineHeight: "15px",
              letterSpacing: "-0.19px",
              color: badgeColor,
            }}
          >
            {badgeLabel}
          </span>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-[10px] border border-black/10 p-4">
          <InfoRow label={t("returnReasonLabel") || "Reason"} value={reasonLabel(req.reason, t)} />
          <InfoRow label={t("refundAmount") || "Refund Amount"} value={refundText} />
          {req.reasonDetail ? (
            <InfoRow label={t("returnReasonDetails") || "Details"} value={String(req.reasonDetail)} />
          ) : null}
          {req.adminNote ? (
            <InfoRow label={t("adminNote") || "Admin note"} value={String(req.adminNote)} />
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-4 rounded-[10px] border border-black/10 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: "20px",
                color: "#000000",
              }}
            >
              {t("evidenceCount") || "Evidence"} ({evidence.length})
            </span>
          </div>

          {showMandatoryUpload ? (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[#CB262E]/40 bg-[#FFF5F5] p-4">
              <p
                className="m-0 text-sm text-black/80"
                style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif" }}
              >
                {t("returnEvidenceRequired")}
              </p>
              {onEvidenceUploaded ? (
                <ReturnEvidenceUploadButton
                  returnRequestUuid={String(req.uuid)}
                  onUploaded={onEvidenceUploaded}
                  variant="primary"
                  className="max-w-sm"
                />
              ) : null}
            </div>
          ) : null}

          {evidence.length === 0 && !showMandatoryUpload ? (
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 13,
                lineHeight: "20px",
                color: "rgba(0,0,0,0.65)",
              }}
            >
              {t("noEvidenceUploaded") || "No evidence uploaded yet."}
            </span>
          ) : null}

          {evidence.length > 0 ? (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {evidence.map((ev) => {
                const rawUrl = String(ev.url || "").trim();
                const href = resolveEvidenceHref(rawUrl, String(assetsHost));
                const image = href && isImageEvidence(ev.mimeType, href);
                const video = href && isVideoEvidence(ev.mimeType, href);

                return (
                  <li key={ev.uuid} className="min-w-0">
                    {href && image ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("evidenceOpenFullSize")}
                        className="block overflow-hidden rounded-lg border border-black/10 bg-black/[0.03] transition-opacity hover:opacity-95"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic evidence URLs (S3 / assets) */}
                        <img
                          src={href}
                          alt=""
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                        <div className="border-t border-black/10 bg-white px-2 py-1.5 text-center text-[11px] text-black/60">
                          {t("evidenceOpenFullSize")}
                        </div>
                      </a>
                    ) : null}
                    {href && video ? (
                      <div className="overflow-hidden rounded-lg border border-black/10 bg-black/[0.03]">
                        <video
                          src={href}
                          className="aspect-square w-full bg-black object-contain"
                          controls
                          playsInline
                          preload="metadata"
                        />
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border-t border-black/10 bg-white px-2 py-2 text-center text-[11px] font-medium text-[#CB262E] underline"
                        >
                          {t("evidenceOpenFullSize")}
                        </a>
                      </div>
                    ) : null}
                    {href && !image && !video ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-black/10 bg-[#FAFAFA] p-4 text-center text-sm font-medium text-[#CB262E] underline transition-opacity hover:opacity-90"
                      >
                        {t("evidenceOpenFullSize")}
                        <span className="break-all text-[11px] font-normal text-black/50">{ev.uuid}</span>
                      </a>
                    ) : null}
                    {!href ? <span className="text-xs text-black/50">{ev.uuid}</span> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {evidence.length > 0 && isPending && onEvidenceUploaded ? (
            <div className="border-t border-black/10 pt-4">
              <ReturnEvidenceUploadButton
                returnRequestUuid={String(req.uuid)}
                onUploaded={onEvidenceUploaded}
                variant="outline"
                className="max-w-xs"
              />
            </div>
          ) : null}
        </div>

        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-center sm:gap-4">
          <Link
            href="/myaccount/returns-refunds"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-[5px] border border-[#CB262E] px-4 font-sans text-sm font-semibold capitalize leading-6 text-[#CB262E] transition-opacity hover:opacity-90 sm:min-w-[200px] sm:max-w-[280px] sm:flex-1"
          >
            {t("backToReturnsRefunds") || "Back"}
          </Link>
          <Link
            href={orderUuid ? `/myaccount/orders/${orderUuid}` : "/myaccount/orders"}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-[5px] bg-[#CB262E] px-4 font-sans text-sm font-semibold capitalize leading-6 text-white transition-opacity hover:opacity-90 sm:min-w-[200px] sm:max-w-[280px] sm:flex-1"
          >
            {t("orderDetails") || "Order details"}
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useUser } from "@/componentsedit/context/UserContext";
import { fetchCurrentCustomerReturnRequests } from "@/services/graphql";
import type { GqlReturnRequest } from "@/services/graphql";
import ReturnEvidenceUploadButton from "./ReturnEvidenceUploadButton";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { gqlMoneyToNumberOrZero } from "@/services/graphql/money";

type IntlT = ReturnType<typeof useTranslations>;

const RETURN_FILTER_KEYS = ["all", "pending", "approved", "rejected", "refunded"] as const;

function returnRequestStatusLabel(status: string, t: IntlT): string {
  switch (status) {
    case "pending":
      return t("pending");
    case "approved":
      return t("statusApproved");
    case "rejected":
      return t("rejected");
    case "refunded":
      return t("refunded");
    default:
      return status;
  }
}

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

function StatCard({ count, label }: { count: number; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center flex-shrink-0 min-w-0 box-border bg-white w-full min-h-[72px] sm:min-h-[82px] px-1 py-2 sm:px-2 sm:py-3"
      style={{
        border: "1px solid rgba(0,0,0,0.15)",
        borderRadius: 5,
        gap: 6,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          background: "#CB262E",
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 16,
          lineHeight: "24px",
        }}
      >
        {count}
      </div>
      <span
        className="text-[9px] leading-[13px] sm:text-[10px] sm:leading-[18px] text-center break-words max-w-full"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 600,
          textTransform: "capitalize",
          color: "#000000",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function RequestRow({
  req,
  t,
  currency,
  locale,
  onRefresh,
}: {
  req: GqlReturnRequest;
  t: IntlT;
  currency: string;
  locale: string;
  onRefresh: () => void | Promise<void>;
}) {
  const status = normalizeReturnStatus(req.status);
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isRefunded = status === "refunded";
  const badgeBg = isRefunded ? "#E3FFD5" : isRejected ? "#FFE5E5" : isApproved ? "#E8F4FF" : "#FFF4E5";
  const badgeColor = isRefunded ? "#3D743A" : isRejected ? "#A61B1B" : isApproved ? "#1B4FA6" : "#B8860B";
  const badgeLabel = returnRequestStatusLabel(status, t);

  const orderUuid = String(req.order?.uuid ?? "").trim();
  const evidenceCount = Array.isArray(req.evidence) ? req.evidence.length : 0;
  const refundText = moneyText(req.refundAmount, currency, locale);
  const needsEvidenceUpload = evidenceCount === 0 && status === "pending";

  return (
    <div className="relative w-full max-w-[710px] box-border bg-white min-h-0 border border-[#D9D9D9] rounded-[5px] p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("returnRequestPrefix") || "Return Request #"}
            {req.uuid}
          </span>
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("orderPrefix") || "Order #"}
            {orderUuid || "—"}
          </span>
        </div>
        <span
          className="inline-flex items-center justify-center self-start shrink-0"
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

      <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-4 max-w-md sm:max-w-none">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("returnReasonLabel") || "Reason"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              lineHeight: "22px",
              color: "#000000",
            }}
          >
            {reasonLabel(req.reason, t)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("refundAmount") || "Refund Amount"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 16,
              lineHeight: "24px",
              color: "#000000",
            }}
          >
            {refundText}
          </span>
        </div>
      </div>

      {req.reasonDetail ? (
        <p
          className="mt-3 text-sm text-black/70"
          style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif" }}
        >
          {String(req.reasonDetail)}
        </p>
      ) : null}

      <div className="mt-4 flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div
            className="flex h-10 min-w-0 flex-1 items-center justify-center border border-black/10 rounded-[5px] px-2 text-sm font-semibold sm:max-w-[200px] sm:flex-none sm:px-3"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              color: "#000",
            }}
          >
            <span className="truncate">
              {t("evidenceCount") || "Evidence"}: {evidenceCount}
            </span>
          </div>
          {needsEvidenceUpload ? (
            <ReturnEvidenceUploadButton
              returnRequestUuid={String(req.uuid)}
              onUploaded={onRefresh}
              variant="outline"
              className="sm:max-w-[220px]"
            />
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 lg:justify-center">
          <Link
            href={`/myaccount/returns-refunds/${encodeURIComponent(String(req.uuid))}`}
            className="flex h-10 w-full min-w-0 items-center justify-center rounded-[5px] bg-[#CB262E] px-4 font-sans text-sm font-semibold capitalize leading-6 text-white hover:opacity-90 sm:w-[min(100%,200px)] sm:shrink-0 lg:min-w-[200px]"
          >
            {t("details") || "Details"}
          </Link>
          <Link
            href={orderUuid ? `/myaccount/orders/${orderUuid}` : "/myaccount/orders"}
            className="flex h-10 w-full min-w-0 items-center justify-center rounded-[5px] bg-[#CB262E] px-4 font-sans text-sm font-semibold capitalize leading-6 text-white hover:opacity-90 sm:w-[min(100%,200px)] sm:shrink-0 lg:min-w-[200px]"
          >
            {t("orderDetails") || "Order details"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MyReturnsRefundsCenterContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { loading: userLoading } = useUser();
  const token = Cookies.get("token");
  const [requests, setRequests] = useState<GqlReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState<string>("QAR");

  const fetchRequests = useCallback(async () => {
    if (!token) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCurrentCustomerReturnRequests(
        { currency: "qar", language: locale === "ar" ? "ar" : "en" },
        token ?? null,
      );
      const list = Array.isArray(data?.getCurrentCustomerReturnRequests)
        ? data.getCurrentCustomerReturnRequests
        : [];
      setRequests(list);
      const code =
        list[0]?.refundAmount?.currencyCode ||
        list[0]?.order?.total?.currencyCode ||
        "QAR";
      setCurrency(String(code).toUpperCase());
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token, locale]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let refunded = 0;
    requests.forEach((r) => {
      const s = normalizeReturnStatus(r.status);
      if (s === "approved") approved += 1;
      else if (s === "refunded") refunded += 1;
      else pending += 1;
    });
    return { pending, approved, refunded };
  }, [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => normalizeReturnStatus(r.status) === filter);
  }, [requests, filter]);

  const totalPages = useMemo(() => {
    const n = Math.ceil(filtered.length / PER_PAGE);
    return Math.max(1, n);
  }, [filtered.length]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedRequests = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  return (
    <section className="w-full bg-white shadow-[0px_1px_13px_rgba(0,0,0,0.05)] rounded-[4px] min-h-0 lg:min-h-[600px] p-4 sm:p-6 md:p-8 lg:px-10 lg:py-10">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-[710px] mb-6 sm:mb-8">
        <StatCard count={stats.pending} label={t("pending") || "Pending"} />
        <StatCard count={stats.approved} label={t("statusApproved") || "Approved"} />
        <StatCard count={stats.refunded} label={t("refunded") || "Refunded"} />
      </div>

      <div
        className="flex flex-row items-start gap-4 overflow-x-auto scrollbar-hide pb-2 mb-6"
        style={{ maxWidth: 710, gap: 16 }}
      >
        {RETURN_FILTER_KEYS.map((fKey) => {
          const active = filter === fKey;
          return (
            <button
              key={fKey}
              type="button"
              onClick={() => setFilter(fKey)}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                minWidth: 90,
                height: 30,
                padding: 12,
                gap: 4,
                background: active ? "#CB262E" : "#FFFFFF",
                border: active ? "none" : "1px solid rgba(0,0,0,0.15)",
                borderRadius: 5,
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 12,
                lineHeight: "24px",
                textTransform: "capitalize",
                color: active ? "#FFFFFF" : "#000000",
              }}
            >
              {t(fKey)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3" style={{ maxWidth: 710 }}>
        {loading || userLoading ? (
          <p style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif", fontSize: 14, color: "#666" }}>
            {t("loading") || "Loading..."}
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif", fontSize: 14, color: "#666" }}>
            {t("noReturnsFound") || "No return requests found."}
          </p>
        ) : (
          pagedRequests.map((req) => (
            <RequestRow
              key={req.uuid}
              req={req}
              t={t}
              currency={currency}
              locale={locale}
              onRefresh={fetchRequests}
            />
          ))
        )}
      </div>

      {!loading && !userLoading && filtered.length > 0 ? (
        <div
          className="mt-6 flex w-full max-w-[710px] flex-row items-center justify-between gap-3"
          aria-label={t("returnsPaginationAria")}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="min-h-[40px] rounded-[5px] border border-black/15 bg-white px-4 font-sans text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("prev") || "Prev"}
          </button>
          <span
            className="font-sans text-sm text-black/70"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {(t("page") || "Page") + ` ${page} / ${totalPages}`}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="min-h-[40px] rounded-[5px] border border-black/15 bg-white px-4 font-sans text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("next") || "Next"}
          </button>
        </div>
      ) : null}
    </section>
  );
}


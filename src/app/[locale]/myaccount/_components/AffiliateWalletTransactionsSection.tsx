"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useLocale, useTranslations } from "next-intl";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import {
  fetchCurrentAffiliateWalletTransactions,
  gqlMoneyToNumber,
  type GqlAffiliateWalletTransaction,
} from "@/services/graphql";
import AccountPanelSurface from "./AccountPanelSurface";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";

const PAGE_SIZE = 20;

function formatMoney(row: GqlAffiliateWalletTransaction, locale: string) {
  const a = row.amount;
  if (!a) return "—";
  const n = gqlMoneyToNumber(a);
  const c = a.currencyCode ?? "QAR";
  if (n == null) return c || "—";
  return formatAmountWithCurrency(n, c, locale);
}

function formatWhen(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale === "ar" ? "ar" : "en");
}

function typeClass(type: string | null | undefined) {
  const t = String(type || "").toLowerCase();
  if (t === "credit") return "text-emerald-700";
  if (t === "debit") return "text-amber-800";
  return "text-black";
}

function formatTransactionType(
  type: string | null | undefined,
  t: (key: string) => string,
) {
  const key = String(type || "").toLowerCase();
  if (key === "credit") return t("partnerWalletTypeCredit");
  if (key === "debit") return t("partnerWalletTypeDebit");
  return type || "—";
}

export default function AffiliateWalletTransactionsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const [pageNumber, setPageNumber] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [rows, setRows] = useState<GqlAffiliateWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const bumpSessionReload = useCallback(() => {
    setPageNumber(1);
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const token = Cookies.get("token");
      if (!token) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const data = await fetchCurrentAffiliateWalletTransactions(
          { pageNumber, itemsPerPage: PAGE_SIZE },
          token,
        );
        if (!cancelled) {
          setRows(data.getCurrentAffiliateWalletTransactions);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [pageNumber, reloadNonce]);

  useEffect(() => {
    const onSession = () => bumpSessionReload();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  }, [bumpSessionReload]);

  const hasPrevPage = pageNumber > 1;
  const hasNextPage = !loading && rows.length === PAGE_SIZE;

  return (
    <AccountPanelSurface className="min-h-0 lg:min-h-[520px]">
      <h2 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
        {t("walletTransactions")}
      </h2>
      <p className="mt-2 max-w-[710px] font-sans text-xs sm:text-sm leading-[18px] text-black/80">
        {t("partnerWalletIntro", { pageSize: PAGE_SIZE })}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-sans text-sm text-black/80" aria-live="polite">
          {loading ? t("loading") : `${t("page")} ${pageNumber}`}
        </span>
        <WalletPagination
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          loading={loading}
          onPrev={() => setPageNumber((p) => Math.max(1, p - 1))}
          onNext={() => setPageNumber((p) => p + 1)}
          t={t}
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-black/70">
          {pageNumber <= 1
            ? t("partnerWalletEmptyFirst")
            : t("partnerWalletEmptyPage")}
        </p>
      ) : (
        <div className="mt-4 w-full overflow-x-auto rounded-[10px] border border-black/15">
          <table className="min-w-[640px] w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.02]">
                <th className="px-3 py-2.5 font-sans font-semibold text-black">
                  {t("partnerWalletColDate")}
                </th>
                <th className="px-3 py-2.5 font-sans font-semibold text-black">
                  {t("partnerWalletColType")}
                </th>
                <th className="px-3 py-2.5 font-sans font-semibold text-black">
                  {t("partnerWalletColAmount")}
                </th>
                <th className="px-3 py-2.5 font-sans font-semibold text-black">
                  {t("partnerWalletColDescription")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.uuid} className="border-b border-black/10 last:border-b-0">
                  <td className="px-3 py-2.5 font-sans text-black whitespace-nowrap">
                    {formatWhen(row.createdAt, locale)}
                  </td>
                  <td className="px-3 py-2.5 font-sans whitespace-nowrap">
                    <span className={typeClass(row.type)}>
                      {formatTransactionType(row.type, t)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-sans text-black whitespace-nowrap">
                    {formatMoney(row, locale)}
                  </td>
                  <td className="px-3 py-2.5 font-sans text-black min-w-[200px]">
                    {row.description || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountPanelSurface>
  );
}

function WalletPagination({
  hasPrevPage,
  hasNextPage,
  loading,
  onPrev,
  onNext,
  t,
}: {
  hasPrevPage: boolean;
  hasNextPage: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      <button
        type="button"
        disabled={!hasPrevPage || loading}
        onClick={onPrev}
        className="min-h-[44px] px-4 rounded-[5px] font-sans font-semibold text-sm capitalize text-[#CB262E] border border-[#CB262E] hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
      >
        {t("previous")}
      </button>
      <button
        type="button"
        disabled={!hasNextPage}
        onClick={onNext}
        className="min-h-[44px] px-4 rounded-[5px] font-sans font-semibold text-sm capitalize text-white bg-[#CB262E] hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
      >
        {t("next")}
      </button>
    </div>
  );
}

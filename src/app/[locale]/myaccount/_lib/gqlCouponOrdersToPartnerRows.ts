import type { GqlCouponOrder } from "@/services/graphql/types/affiliate";
import type { GqlMoney } from "@/services/graphql/types/product";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { gqlMoneyToNumberOrZero } from "@/services/graphql/money";

export type PartnerCouponOrderRow = {
  uuid: string;
  total: number;
  totalCurrency: string;
  commission: number;
  commissionCurrency: string;
  status: string;
  createdAt: string | null;
};

function moneyAmount(m: GqlMoney | null | undefined): number {
  return gqlMoneyToNumberOrZero(m);
}

function moneyCurrency(m: GqlMoney | null | undefined, fallback: string): string {
  const c = String(m?.currencyCode ?? "").trim();
  return c ? c.toUpperCase() : fallback;
}

export function gqlCouponOrdersToPartnerRows(
  rows: GqlCouponOrder[] | null | undefined,
  fallbackCurrency = "QAR",
): PartnerCouponOrderRow[] {
  if (!rows?.length) return [];
  return rows.map((row) => ({
    uuid: String(row.uuid ?? "").trim(),
    total: moneyAmount(row.total),
    totalCurrency: moneyCurrency(row.total, fallbackCurrency),
    commission: moneyAmount(row.commission),
    commissionCurrency: moneyCurrency(row.commission, fallbackCurrency),
    status: String(row.status ?? "").trim(),
    createdAt: row.createdAt ?? null,
  }));
}

export function formatPartnerCouponOrderMoney(
  amount: number,
  currencyCode: string,
  locale = "en",
): string {
  return formatAmountWithCurrency(amount, currencyCode, locale);
}

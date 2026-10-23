import type { GqlAffiliateCoupon } from "@/services/graphql";
import type { GqlMoney } from "@/services/graphql/types/product";
import type { PartnerCouponListRow } from "../_types/partnerCoupon";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { gqlMoneyToNumberOrZero } from "@/services/graphql/money";

/** GraphQL coupon, GET `v1/referral/coupons` item, or similar. */
export type CouponLike = {
  uuid: string;
  code?: string | null;
  discountPercentage?: number | null;
  ordersCount?: number | null;
  totalSales?: GqlMoney | null;
  totalCommission?: GqlMoney | null;
  expiresAt?: string | null;
  createdAt?: string | null;
};

function parseMoneyAmount(m: GqlMoney | null | undefined): number {
  return gqlMoneyToNumberOrZero(m);
}

function parseMoneyCurrency(
  m: GqlMoney | null | undefined,
  fallback = "QAR",
): string {
  const c = String(m?.currencyCode ?? "").trim();
  return c ? c.toUpperCase() : fallback;
}

export function couponLikeToPartnerRow(c: CouponLike): PartnerCouponListRow {
  const expiryDate = c.expiresAt ?? null;
  const exp = expiryDate ? new Date(expiryDate) : null;
  const expired =
    exp !== null && !Number.isNaN(exp.getTime()) && exp.getTime() < Date.now();
  const usage = Number(c.ordersCount ?? 0);

  return {
    id: c.uuid,
    code: String(c.code ?? "—"),
    status: expired ? "expired" : "active",
    discount: String(c.discountPercentage ?? 0),
    discountPercentage: c.discountPercentage ?? 0,
    createdAt: c.createdAt ?? null,
    expiryDate,
    isActive: !expired,
    usage: Number.isNaN(usage) ? 0 : usage,
    ordersCount: Number.isNaN(usage) ? 0 : usage,
    totalSalesAmount: parseMoneyAmount(c.totalSales),
    totalSalesCurrency: parseMoneyCurrency(c.totalSales),
    totalCommissionAmount: parseMoneyAmount(c.totalCommission),
    totalCommissionCurrency: parseMoneyCurrency(c.totalCommission),
  };
}

export function gqlAffiliateCouponToPartnerRow(c: GqlAffiliateCoupon): PartnerCouponListRow {
  return couponLikeToPartnerRow(c);
}

export function formatCouponListMoney(
  amount: number,
  currencyCode: string,
  locale = "en",
): string {
  return formatAmountWithCurrency(amount, currencyCode, locale);
}

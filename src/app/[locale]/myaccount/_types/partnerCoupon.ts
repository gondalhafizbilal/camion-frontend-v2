/** Normalized coupon row for partner (affiliator/influencer) UI */
export type PartnerCouponListRow = {
  id: string | number | undefined;
  _id?: string | number;
  code: string;
  status: string;
  discount: string;
  discountPercentage: string | number;
  /** When omitted (e.g. GraphQL affiliate coupons), commission is not shown in the UI. */
  commissionPercentage?: string | number;
  createdAt: string | null;
  expiryDate: string | null;
  isActive: boolean;
  usage: number;
  /** Optional alias for display when different from `usage`. */
  ordersCount?: number;
  /** Some API payloads use `active` instead of `isActive`. */
  active?: boolean;
  amount?: string | number;
  commission?: string | number;
  totalSalesAmount?: number;
  totalSalesCurrency?: string;
  totalCommissionAmount?: number;
  totalCommissionCurrency?: string;
};

export type PartnerCouponStatsRow = PartnerCouponListRow & {
  orders: unknown[];
};

export type RawCoupon = Record<string, unknown>;

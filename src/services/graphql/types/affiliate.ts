import type { GqlMoney } from "./product";

/** Row from `getCurrentAffiliate`. */

export type GqlAffiliateWallet = {
  uuid: string;
  amount?: GqlMoney | null;
};

export type GqlCurrentAffiliate = {
  uuid: string;
  fullName?: string | null;
  gender?: string | null;
  nationality?: string | null;
  bio?: string | null;
  type?: string | null;
  /** Application state: `pending` | `accepted` | `rejected` (legacy: `approved` → accepted). */
  status?: string | null;
  totalCommission?: GqlMoney | null;
  totalPaid?: GqlMoney | null;
  remainingBalance?: GqlMoney | null;
  couponsCreated?: number | null;
  couponsUsed?: number | null;
  trendingCoupon?: { uuid: string } | null;
  topProduct?: { uuid: string } | null;
  wallet?: GqlAffiliateWallet | null;
  createdAt?: string | null;
};

export type GetCurrentAffiliateData = {
  getCurrentAffiliate: GqlCurrentAffiliate | null;
};

export type GqlAffiliateWalletTransaction = {
  uuid: string;
  amount?: GqlMoney | null;
  type?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

export type GetCurrentAffiliateWalletTransactionsData = {
  getCurrentAffiliateWalletTransactions: GqlAffiliateWalletTransaction[] | null;
};

export type GqlAffiliateBankAccount = {
  uuid: string;
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  swiftCode?: string | null;
  isDefault?: boolean | null;
};

export type GetCurrentAffiliateBankAccountsData = {
  getCurrentAffiliateBankAccounts: GqlAffiliateBankAccount[] | null;
};

export type GqlAffiliateCoupon = {
  uuid: string;
  code?: string | null;
  discountPercentage?: number | null;
  ordersCount?: number | null;
  totalSales?: GqlMoney | null;
  totalCommission?: GqlMoney | null;
  expiresAt?: string | null;
  createdAt?: string | null;
};

export type GetCurrentAffiliateCouponsData = {
  getCurrentAffiliateCoupons: GqlAffiliateCoupon[] | null;
};

export type GqlCouponOrder = {
  uuid: string;
  total?: GqlMoney | null;
  commission?: GqlMoney | null;
  status?: string | null;
  createdAt?: string | null;
};

export type GetCouponOrdersData = {
  getCouponOrders: GqlCouponOrder[] | null;
};

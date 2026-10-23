import { graphqlRequest } from "../client";
import {
  GET_COUPON_ORDERS,
  GET_CURRENT_AFFILIATE,
  GET_CURRENT_AFFILIATE_BANK_ACCOUNTS,
  GET_CURRENT_AFFILIATE_COUPONS,
  GET_CURRENT_AFFILIATE_WALLET_TRANSACTIONS,
  type GetCouponOrdersVariables,
  type GetCurrentAffiliateBankAccountsVariables,
  type GetCurrentAffiliateCouponsVariables,
  type GetCurrentAffiliateWalletTransactionsVariables,
} from "../queries/affiliate";
import type {
  GetCouponOrdersData,
  GetCurrentAffiliateData,
  GetCurrentAffiliateBankAccountsData,
  GetCurrentAffiliateCouponsData,
  GetCurrentAffiliateWalletTransactionsData,
  GqlAffiliateBankAccount,
  GqlAffiliateCoupon,
  GqlAffiliateWalletTransaction,
  GqlCouponOrder,
} from "../types/affiliate";

const empty: GetCurrentAffiliateData = { getCurrentAffiliate: null };

const emptyWalletTx: GetCurrentAffiliateWalletTransactionsData = {
  getCurrentAffiliateWalletTransactions: [],
};

const emptyBankAccounts: GetCurrentAffiliateBankAccountsData = {
  getCurrentAffiliateBankAccounts: [],
};

const emptyCoupons: GetCurrentAffiliateCouponsData = {
  getCurrentAffiliateCoupons: [],
};

const emptyCouponOrders: GetCouponOrdersData = {
  getCouponOrders: [],
};

const DEFAULT_COUPON_PAGE = 20;
const DEFAULT_COUPON_MAX_PAGES = 50;

export async function fetchCouponOrders(
  variables: GetCouponOrdersVariables,
  authToken?: string | null,
): Promise<{ getCouponOrders: GqlCouponOrder[] }> {
  const data =
    (await graphqlRequest<GetCouponOrdersData>(
      {
        query: GET_COUPON_ORDERS,
        operationName: "GetCouponOrders",
        variables: {
          uuid: variables.uuid ?? null,
          pageNumber: variables.pageNumber ?? null,
          itemsPerPage: variables.itemsPerPage ?? null,
        },
      },
      { authToken },
    )) ?? emptyCouponOrders;

  return {
    getCouponOrders: data.getCouponOrders ?? [],
  };
}

export async function fetchCurrentAffiliateCoupons(
  variables: GetCurrentAffiliateCouponsVariables,
  authToken?: string | null,
): Promise<{ getCurrentAffiliateCoupons: GqlAffiliateCoupon[] }> {
  const data =
    (await graphqlRequest<GetCurrentAffiliateCouponsData>(
      {
        query: GET_CURRENT_AFFILIATE_COUPONS,
        operationName: "GetCurrentAffiliateCoupons",
        variables: {
          pageNumber: variables.pageNumber ?? null,
          itemsPerPage: variables.itemsPerPage ?? null,
        },
      },
      { authToken },
    )) ?? emptyCoupons;

  return {
    getCurrentAffiliateCoupons: data.getCurrentAffiliateCoupons ?? [],
  };
}

/** Loads affiliate coupons by walking pages until a short page or `maxPages`. */
export async function fetchAllCurrentAffiliateCoupons(
  authToken: string,
  options?: { pageSize?: number; maxPages?: number },
): Promise<GqlAffiliateCoupon[]> {
  const pageSize = options?.pageSize ?? DEFAULT_COUPON_PAGE;
  const maxPages = options?.maxPages ?? DEFAULT_COUPON_MAX_PAGES;
  const out: GqlAffiliateCoupon[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const { getCurrentAffiliateCoupons } = await fetchCurrentAffiliateCoupons(
      { pageNumber: page, itemsPerPage: pageSize },
      authToken,
    );
    out.push(...getCurrentAffiliateCoupons);
    if (getCurrentAffiliateCoupons.length < pageSize) break;
  }

  return out;
}

export async function fetchCurrentAffiliate(
  authToken?: string | null,
): Promise<GetCurrentAffiliateData> {
  return (
    (await graphqlRequest<GetCurrentAffiliateData>(
      {
        query: GET_CURRENT_AFFILIATE,
        operationName: "GetCurrentAffiliate",
      },
      { authToken },
    )) ?? empty
  );
}

export async function fetchCurrentAffiliateWalletTransactions(
  variables: GetCurrentAffiliateWalletTransactionsVariables,
  authToken?: string | null,
): Promise<{ getCurrentAffiliateWalletTransactions: GqlAffiliateWalletTransaction[] }> {
  const data =
    (await graphqlRequest<GetCurrentAffiliateWalletTransactionsData>(
      {
        query: GET_CURRENT_AFFILIATE_WALLET_TRANSACTIONS,
        operationName: "GetCurrentAffiliateWalletTransactions",
        variables: {
          pageNumber: variables.pageNumber ?? null,
          itemsPerPage: variables.itemsPerPage ?? null,
        },
      },
      { authToken },
    )) ?? emptyWalletTx;

  return {
    getCurrentAffiliateWalletTransactions:
      data.getCurrentAffiliateWalletTransactions ?? [],
  };
}

export async function fetchCurrentAffiliateBankAccounts(
  variables: GetCurrentAffiliateBankAccountsVariables,
  authToken?: string | null,
): Promise<{ getCurrentAffiliateBankAccounts: GqlAffiliateBankAccount[] }> {
  const data =
    (await graphqlRequest<GetCurrentAffiliateBankAccountsData>(
      {
        query: GET_CURRENT_AFFILIATE_BANK_ACCOUNTS,
        operationName: "GetCurrentAffiliateBankAccounts",
        variables: {
          pageNumber: variables.pageNumber ?? null,
          itemsPerPage: variables.itemsPerPage ?? null,
        },
      },
      { authToken },
    )) ?? emptyBankAccounts;

  return {
    getCurrentAffiliateBankAccounts: data.getCurrentAffiliateBankAccounts ?? [],
  };
}

export type GetCurrentAffiliateWalletTransactionsVariables = {
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export type GetCurrentAffiliateBankAccountsVariables = {
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export type GetCurrentAffiliateCouponsVariables = {
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export type GetCouponOrdersVariables = {
  uuid?: string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export const GET_COUPON_ORDERS = `
query GetCouponOrders($uuid: String, $pageNumber: Int, $itemsPerPage: Int) {
  getCouponOrders(uuid: $uuid, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    total {
      amount
      minorAmount
      currencyCode
    }
    commission {
      amount
      minorAmount
      currencyCode
    }
    status
    createdAt
  }
}
`.trim();

export const GET_CURRENT_AFFILIATE_COUPONS = `
query GetCurrentAffiliateCoupons($pageNumber: Int, $itemsPerPage: Int) {
  getCurrentAffiliateCoupons(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    code
    discountPercentage
    ordersCount
    totalSales {
      amount
      minorAmount
      currencyCode
    }
    totalCommission {
      amount
      minorAmount
      currencyCode
    }
    expiresAt
    createdAt
  }
}
`.trim();

export const GET_CURRENT_AFFILIATE_BANK_ACCOUNTS = `
query GetCurrentAffiliateBankAccounts($pageNumber: Int, $itemsPerPage: Int) {
  getCurrentAffiliateBankAccounts(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    bankName
    accountHolderName
    accountNumber
    iban
    swiftCode
    isDefault
  }
}
`.trim();

export const GET_CURRENT_AFFILIATE_WALLET_TRANSACTIONS = `
query GetCurrentAffiliateWalletTransactions($pageNumber: Int, $itemsPerPage: Int) {
  getCurrentAffiliateWalletTransactions(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    amount {
      amount
      minorAmount
      currencyCode
    }
    type
    description
    createdAt
  }
}
`.trim();

export const GET_CURRENT_AFFILIATE = `
query GetCurrentAffiliate {
  getCurrentAffiliate {
    uuid
    fullName
    gender
    nationality
    bio
    type
    status
    totalCommission {
      amount
      minorAmount
      currencyCode
    }
    totalPaid {
      amount
      minorAmount
      currencyCode
    }
    remainingBalance {
      amount
      minorAmount
      currencyCode
    }
    couponsCreated
    couponsUsed
    trendingCoupon {
      uuid
    }
    topProduct {
      uuid
    }
    wallet {
      uuid
      amount {
        amount
        minorAmount
        currencyCode
      }
    }
  }
}
`.trim();

export const BASE_URL_CART = process.env.NEXT_PUBLIC_CART_BASE_URL;
export const BASE_URL_AUTH = process.env.NEXT_PUBLIC_API_BASE_URL;
export const BASE_URL_CHATBOT = process.env.NEXT_PUBLIC_CHATBOT_BASE_URL;
export const BASE_URL_CHATBOT_PROXY = process.env.NEXT_PUBLIC_CHATBOT_PROXY_BASE;
export const AUTH_SUCCESS_ROUTE = process.env.NEXT_PUBLIC_AUTH_SUCCESS_ROUTE;

/**
 * Same-origin URL that proxies to `NEXT_PUBLIC_API_BASE_URL` on the server (avoids CORS).
 * @param relativePath Path after the API host, e.g. `v1/auth/customer/register`
 */
export function apiAuthPath(relativePath: string): string {
  const p = relativePath.replace(/^\/+/, "");
  return `/api/upstream/${p}`;
}

/**
 * Same-origin URL that proxies to `NEXT_PUBLIC_CART_BASE_URL` (passes `base=cart` to the route).
 */
export function apiCartPath(relativePath: string): string {
  const p = relativePath.replace(/^\/+/, "");
  return `/api/upstream/${p}?base=cart`;
}

/** Social / static URLs and API path builders used across the app. */
export type ApiEndpointsMap = {
  readonly LOGIN_EMAIL: string;
  readonly LOGIN_PHONE: string;
  readonly REGISTER: string;
  readonly VERIFY_EMAIL: string;
  readonly VERIFY_PHONE: string;
  readonly AUTH_GOOGLE: string;
  readonly AUTH_GUEST_REGISTER: string;
  readonly AUTH_LOGOUT: string;
  readonly CUSTOMER_SELF: string;
  readonly AUTH_ME: string;
  readonly USER_PROFILE: string;
  readonly DELETE_ACCOUNT: string;
  readonly NOTOCTOCKEN: string;
  readonly GET_USERS: string;
  readonly ADD_TO_CART: string;
  readonly UPDATE_CART: string;
  readonly REMOVE_TO_CART: string;
  readonly ORDERS: string;
  /** GET order preview (cart + address + shipping totals) for checkout review. */
  readonly ORDER_PREVIEW: string;
  /** POST create order (`v1/orders`) — cart line UUIDs + payment method. */
  readonly ORDERS_CREATE: string;
  /** DELETE cancel order (`v1/orders/{orderUuid}`). */
  readonly ORDER_BY_UUID: (orderUuid: string) => string;
  /** POST retry payment for unpaid order (`v1/orders/{orderUuid}/retry-payment`). */
  readonly ORDER_RETRY_PAYMENT: (orderUuid: string) => string;
  /** POST payment result for providers like SkipCash (`v1/payments/result`). */
  readonly PAYMENTS_RESULT: string;
  readonly REQUEST: string;
  /** POST create affiliate profile (referral API). */
  readonly AFFILIATE_REFERRAL_REGISTER: string;
  readonly CHECKOUT_USER: string;
  readonly CHECKOUT_COMPLETE: string;
  readonly CHECKOUT: string;
  readonly SNAP_CHAT: string;
  readonly INSTAGRAM: string;
  readonly FACEBOOK: string;
  readonly LINKEDIN: string;
  readonly TIKTOK: string;
  readonly YOUTUBE: string;
  readonly GOOGLE_PLAYSTORE: string;
  readonly APPLE_APPSTORE: string;
  readonly REQUESTSTATUS: string;
  readonly COUPON: string;
  readonly NEWCOUPON: string;
  /** POST create coupon (referral API; affiliate & influencer). */
  readonly REFERRAL_COUPON_CREATE: string;
  /** POST add bank account (referral API; affiliate & influencer). */
  readonly REFERRAL_BANK_ACCOUNTS: string;
  /** GET one bank account by UUID (`v1/referral/bank-accounts/{uuid}`). */
  readonly REFERRAL_BANK_ACCOUNT_BY_ID: (uuid: string) => string;
  /** GET list coupons (referral API; affiliate & influencer). */
  readonly REFERRAL_COUPONS: string;
  /** GET one coupon by UUID (`v1/referral/coupons/{uuid}`). */
  readonly REFERRAL_COUPON_BY_ID: (uuid: string) => string;
  readonly AFFILIATE_GET_WALLET: string;
  readonly AFFILIATE_GET_WALLET_TRANSACTIONS: string;
  readonly AFFILIATE_GET_COUPON_STATUS_COUNT: string;
  readonly AFFILIATE_UPDATE_PROFILE: string;
  readonly AFFILIATE_STATS_ME: string;
  readonly AFFILIATE_COUPON_SEARCH: string;
  readonly AFFILIATE_DELETE_COUPON: string;
  readonly INFLUENCER_REQUESTSTATUS: string;
  readonly INFLUENCER_GET_COUPON_STATUS_COUNT: string;
  readonly INFLUENCER_GET_WALLET: string;
  readonly INFLUENCER_GET_WALLET_TRANSACTIONS: string;
  readonly INFLUENCER_STATS_ME: string;
  readonly INFLUENCER_COUPON_ME: string;
  readonly INFLUENCER_NEWCOUPON: string;
  readonly INFLUENCER_REQUEST: string;
  /** POST create influencer profile (referral API). */
  readonly INFLUENCER_REFERRAL_REGISTER: string;
  readonly NOTOC: string;
  readonly APPLYCOUPON: string;
  readonly NEWS_LETTER: string;
  readonly PROMOTIONS: string;
  readonly PROMOTION: string;
  readonly CHATBOT_ASK: string;
  readonly CHATBOT_GET_SESSIONS: string;
  readonly CHATBOT_CREATE_SESSION: string;
  readonly CHATBOT_ASK_IN_SESSION: (sessionId: string) => string;
  readonly CHATBOT_SESSION_HISTORY: (sessionId: string) => string;
  readonly CHATBOT_DELETE_SESSION: (sessionId: string) => string;
  readonly CHATBOT_LIST_SESSIONS: (userId: string) => string;
  readonly CHATBOT_UPLOAD_CONTENT: string;
  readonly CHATBOT_UPLOAD_FILE: string;
  readonly CHATBOT_DELETE_ALL_DOCUMENTS: string;
  readonly AUTH_FACEBOOK: string;
  /** Same-origin proxy to `POST .../graphql` on the API host. */
  readonly GRAPHQL: string;
  /** Same-origin proxy to `v1/customer-addresses` on the API host. */
  readonly CUSTOMER_ADDRESSES: string;
  /** Saved customer cards (My Account) `v1/customers/me/saved-cards`. */
  readonly CUSTOMER_SAVED_CARDS: string;
  readonly CUSTOMER_SAVED_CARD_BY_UUID: (uuid: string) => string;
  readonly CUSTOMER_SAVED_CARD_DEFAULT: (uuid: string) => string;
  /** POST add product to wishlist (`{ productUUID, variantUUID }`). */
  readonly WISHLIST: string;
  /** DELETE remove wishlist entry (`v1/wishlist/{wishlistItemUuid}`). */
  readonly WISHLIST_ITEM_BY_UUID: (wishlistItemUuid: string) => string;
  /**
   * Legacy: DELETE remove product from wishlist (`v1/wishlist/{productUuid}`).
   * Some backends actually require the wishlist entry UUID instead.
   */
  readonly WISHLIST_BY_PRODUCT_ID: (productUuid: string) => string;
  /** Cart line items (`v1/cart-items`): POST add, DELETE clear entire cart. Cart lines are loaded via GraphQL `GetCustomerCart`. */
  readonly CART_ITEMS: string;
  /** PATCH update line quantity / variant, DELETE remove one line (`v1/cart-items/{uuid}`). */
  readonly CART_ITEM_BY_UUID: (cartItemUuid: string) => string;
  /** POST create return request (`v1/return-requests`). */
  readonly RETURN_REQUESTS: string;
  /** POST upload evidence for return request (`v1/return-requests/{uuid}/evidence`). */
  readonly RETURN_REQUEST_EVIDENCE: (returnRequestUuid: string) => string;
  /** POST create product review (`v1/products/{productUuid}/reviews`). */
  readonly PRODUCT_REVIEWS: (productUuid: string) => string;
  /** POST upload image for product review (`v1/products/{productUuid}/reviews/{reviewUuid}/images`). */
  readonly PRODUCT_REVIEW_IMAGES: (productUuid: string, reviewUuid: string) => string;
  readonly API_TOKEN: string | undefined;
};

export const API_ENDPOINTS: ApiEndpointsMap = {
  LOGIN_EMAIL: apiAuthPath("v1/auth/customer/login/email-address"),
  LOGIN_PHONE: apiAuthPath("v1/auth/customer/login/phone-number"),
  REGISTER: apiAuthPath("v1/auth/customer/register"),
  VERIFY_EMAIL: apiAuthPath("v1/auth/customer/verify/email-address"),
  VERIFY_PHONE: apiAuthPath("v1/auth/customer/verify/phone-number"),
  AUTH_GOOGLE: `/api/auth/google`,
  AUTH_GUEST_REGISTER: apiAuthPath("v1/auth/guest/register"),
  AUTH_LOGOUT: apiAuthPath("v1/auth/customer/logout"),
  CUSTOMER_SELF: apiAuthPath("v1/auth/customer/self"),
  AUTH_ME: apiAuthPath("users/address/me"),
  USER_PROFILE: apiAuthPath("users/me"),
  DELETE_ACCOUNT: apiAuthPath("v1/customers"),
  NOTOCTOCKEN: apiAuthPath("users/notifications/token"),
  GET_USERS: apiAuthPath("users"),
  ADD_TO_CART: apiCartPath("cart/add"),
  UPDATE_CART: apiCartPath("cart/update"),
  REMOVE_TO_CART: apiCartPath("cart/remove"),
  ORDERS: apiCartPath("orders"),
  ORDER_PREVIEW: apiAuthPath("v1/orders/order-preview"),
  ORDERS_CREATE: apiAuthPath("v1/orders"),
  ORDER_BY_UUID: (orderUuid: string) =>
    apiAuthPath(`v1/orders/${encodeURIComponent(String(orderUuid).replace(/^\/+/, ""))}`),
  ORDER_RETRY_PAYMENT: (orderUuid: string) =>
    apiAuthPath(
      `v1/orders/${encodeURIComponent(String(orderUuid).replace(/^\/+/, ""))}/retry-payment`,
    ),
  PAYMENTS_RESULT: apiAuthPath("v1/payments/result"),
  REQUEST: apiAuthPath("affiliates/request"),
  AFFILIATE_REFERRAL_REGISTER: apiAuthPath("v1/referral/affiliates/affiliate"),
  CHECKOUT_USER: apiCartPath("checkout/user"),
  CHECKOUT_COMPLETE: apiCartPath("checkout/complete"),
  CHECKOUT: apiCartPath("checkout"),
  SNAP_CHAT: "https://www.snapchat.com/@camion.shop",
  INSTAGRAM: "https://www.instagram.com/camion.shop/",
  FACEBOOK: "https://www.facebook.com/camion.shop/",
  LINKEDIN: "https://www.linkedin.com/company/camiontrading/",
  TIKTOK: "https://www.tiktok.com/@camion.shop",
  YOUTUBE: "https://www.youtube.com/@Camion-shop",
  GOOGLE_PLAYSTORE:
    "https://play.google.com/store/apps/details?id=com.camiontrading.app&hl=en",
  APPLE_APPSTORE:
    "https://apps.apple.com/pk/app/camion-trading-%D9%83%D9%85%D9%8A%D9%88%D9%86/id6758658533",

  REQUESTSTATUS: apiAuthPath("affiliates/me/status"),

  COUPON: apiAuthPath("affiliates/coupon/me"),

  NEWCOUPON: apiAuthPath("affiliates/coupon"),
  REFERRAL_COUPON_CREATE: apiAuthPath("v1/referral/coupons"),
  REFERRAL_BANK_ACCOUNTS: apiAuthPath("v1/referral/bank-accounts"),
  REFERRAL_BANK_ACCOUNT_BY_ID: (uuid: string) =>
    apiAuthPath(
      `v1/referral/bank-accounts/${encodeURIComponent(String(uuid).replace(/^\/+/, ""))}`,
    ),
  REFERRAL_COUPONS: apiAuthPath("v1/referral/coupons"),
  REFERRAL_COUPON_BY_ID: (uuid: string) =>
    apiAuthPath(
      `v1/referral/coupons/${encodeURIComponent(String(uuid).replace(/^\/+/, ""))}`,
    ),

  AFFILIATE_GET_WALLET: apiAuthPath("affiliates/wallet"),

  AFFILIATE_GET_WALLET_TRANSACTIONS: apiAuthPath("affiliates/wallet/transactions"),

  AFFILIATE_GET_COUPON_STATUS_COUNT: apiAuthPath("affiliates/count/coupons"),

  AFFILIATE_UPDATE_PROFILE: apiAuthPath("affiliates/:id"),
  AFFILIATE_STATS_ME: apiAuthPath("affiliates/stats/me"),
  AFFILIATE_COUPON_SEARCH: apiAuthPath("affiliates/coupon/search"),
  AFFILIATE_DELETE_COUPON: apiAuthPath("affiliates/coupon/:id"),

  INFLUENCER_REQUESTSTATUS: apiAuthPath("influencers/me/status"),

  INFLUENCER_GET_COUPON_STATUS_COUNT: apiAuthPath("influencers/count/coupons"),

  INFLUENCER_GET_WALLET: apiAuthPath("influencers/wallet"),
  INFLUENCER_GET_WALLET_TRANSACTIONS: apiAuthPath("influencers/wallet/transactions"),

  INFLUENCER_STATS_ME: apiAuthPath("influencers/stats/me"),

  INFLUENCER_COUPON_ME: apiAuthPath("influencers/coupon/me"),

  INFLUENCER_NEWCOUPON: apiAuthPath("influencers/coupon"),

  INFLUENCER_REQUEST: apiAuthPath("influencers/request"),
  INFLUENCER_REFERRAL_REGISTER: apiAuthPath("v1/referral/affiliates/influencer"),

  NOTOC: apiAuthPath("users/notifications/me"),
  APPLYCOUPON: apiAuthPath("cart/apply-coupon"),

  NEWS_LETTER: apiAuthPath("v1/newsletter/subscribe"),
  PROMOTIONS: apiAuthPath("site-settings"),
  PROMOTION: `${apiAuthPath("site-settings")}?slugs=promotion_name`,

  CHATBOT_ASK: `${BASE_URL_CHATBOT}/api/chatbot/ask`,
  CHATBOT_GET_SESSIONS: `${BASE_URL_CHATBOT}/api/chatbot/sessions`,
  CHATBOT_CREATE_SESSION: "/api/chatbot-proxy/sessions",
  CHATBOT_ASK_IN_SESSION: (sessionId: string) =>
    `/api/chatbot-proxy/sessions/${sessionId}/ask`,
  CHATBOT_SESSION_HISTORY: (sessionId: string) =>
    `/api/chatbot-proxy/sessions/${sessionId}/history`,
  CHATBOT_DELETE_SESSION: (sessionId: string) =>
    `/api/chatbot-proxy/sessions/${sessionId}`,

  CHATBOT_LIST_SESSIONS: (userId: string) =>
    `/api/chatbot-proxy/sessions/list?customerUUID=${encodeURIComponent(userId)}`,
  CHATBOT_UPLOAD_CONTENT: `${BASE_URL_CHATBOT}/api/chatbot/upload`,
  CHATBOT_UPLOAD_FILE: `${BASE_URL_CHATBOT}/api/chatbot/upload-file`,
  CHATBOT_DELETE_ALL_DOCUMENTS: `${BASE_URL_CHATBOT}/api/chatbot/documents`,
  AUTH_FACEBOOK: "/api/auth/facebook",
  GRAPHQL: apiAuthPath("graphql"),
  CUSTOMER_ADDRESSES: apiAuthPath("v1/customer-addresses"),
  CUSTOMER_SAVED_CARDS: apiAuthPath("v1/customers/me/saved-cards"),
  CUSTOMER_SAVED_CARD_BY_UUID: (uuid: string) =>
    apiAuthPath(
      `v1/customers/me/saved-cards/${encodeURIComponent(String(uuid).replace(/^\/+/, ""))}`,
    ),
  CUSTOMER_SAVED_CARD_DEFAULT: (uuid: string) =>
    apiAuthPath(
      `v1/customers/me/saved-cards/${encodeURIComponent(String(uuid).replace(/^\/+/, ""))}/default`,
    ),
  WISHLIST: apiAuthPath("v1/wishlist"),
  WISHLIST_ITEM_BY_UUID: (wishlistItemUuid: string) =>
    apiAuthPath(
      `v1/wishlist/${encodeURIComponent(String(wishlistItemUuid).replace(/^\/+/, ""))}`,
    ),
  WISHLIST_BY_PRODUCT_ID: (productUuid: string) =>
    apiAuthPath(
      `v1/wishlist/${encodeURIComponent(String(productUuid).replace(/^\/+/, ""))}`,
    ),
  CART_ITEMS: apiAuthPath("v1/cart-items"),
  CART_ITEM_BY_UUID: (cartItemUuid: string) =>
    apiAuthPath(
      `v1/cart-items/${encodeURIComponent(String(cartItemUuid).replace(/^\/+/, ""))}`,
    ),
  RETURN_REQUESTS: apiAuthPath("v1/return-requests"),
  RETURN_REQUEST_EVIDENCE: (returnRequestUuid: string) =>
    apiAuthPath(
      `v1/return-requests/${encodeURIComponent(String(returnRequestUuid).replace(/^\/+/, ""))}/evidence`,
    ),
  PRODUCT_REVIEWS: (productUuid: string) =>
    apiAuthPath(
      `v1/products/${encodeURIComponent(String(productUuid).replace(/^\/+/, ""))}/reviews`,
    ),
  PRODUCT_REVIEW_IMAGES: (productUuid: string, reviewUuid: string) =>
    apiAuthPath(
      `v1/products/${encodeURIComponent(String(productUuid).replace(/^\/+/, ""))}/reviews/${encodeURIComponent(String(reviewUuid).replace(/^\/+/, ""))}/images`,
    ),
  API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN,
};

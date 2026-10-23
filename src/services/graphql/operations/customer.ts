import { graphqlRequest } from "../client";
import { clampProductListItemsPerPage } from "../constants/productListPageSize";
import {
  GET_CURRENT_CUSTOMER,
  GET_CUSTOMER_ADDRESSES,
  GET_CUSTOMER_CART,
  GET_CUSTOMER_CART_COUNT,
  GET_CUSTOMER_SAVED_CARDS,
  GET_CUSTOMER_WISHLIST,
  GET_CUSTOMER_WISHLIST_COUNT,
  type GetCustomerAddressesVariables,
  type GetCustomerCartVariables,
  type GetCustomerWishlistVariables,
} from "../queries/customer";
import type {
  GetCurrentCustomerData,
  GetCustomerAddressesData,
  GetCustomerCartData,
  GetCustomerCartCountData,
  GetCustomerSavedCardsData,
  GetCustomerWishlistData,
  GetCustomerWishlistCountData,
} from "../types/customer";

const emptyCurrentCustomer: GetCurrentCustomerData = {
  getCurrentCustomer: null,
};

export type FetchCurrentCustomerResult = GetCurrentCustomerData & {
  /** True when GraphQL failed the token with auth-only errors (invalid/expired session). */
  authRejected: boolean;
};

export async function fetchCurrentCustomer(
  authToken: string | null | undefined,
): Promise<FetchCurrentCustomerResult> {
  const authFailureOut = { value: false };
  const data =
    (await graphqlRequest<GetCurrentCustomerData>(
      {
        query: GET_CURRENT_CUSTOMER,
        operationName: "GetCurrentCustomer",
      },
      { authToken, authFailureOut },
    )) ?? emptyCurrentCustomer;
  return { ...data, authRejected: authFailureOut.value };
}

const DEFAULT_ADDRESS_PAGE = 1;
const DEFAULT_ADDRESS_PAGE_SIZE = 10;

export async function fetchCustomerAddresses(
  variables: GetCustomerAddressesVariables | undefined,
  authToken: string | null | undefined,
): Promise<GetCustomerAddressesData> {
  const pageNumber = variables?.pageNumber ?? DEFAULT_ADDRESS_PAGE;
  const itemsPerPage = variables?.itemsPerPage ?? DEFAULT_ADDRESS_PAGE_SIZE;
  return (
    (await graphqlRequest<GetCustomerAddressesData>(
      {
        query: GET_CUSTOMER_ADDRESSES,
        operationName: "GetCustomerAddresses",
        variables: { pageNumber, itemsPerPage },
      },
      { authToken },
    )) ?? { getCustomerAddresses: [] }
  );
}

/**
 * Some backends cap `getCustomerAddresses` to a small fixed size regardless of `itemsPerPage`.
 * This helper walks pages until an empty page or no new UUIDs are returned.
 */
export async function fetchAllCustomerAddresses(
  authToken: string | null | undefined,
  options?: { pageSize?: number; maxPages?: number },
): Promise<GetCustomerAddressesData> {
  const pageSize = options?.pageSize ?? 50;
  const maxPages = options?.maxPages ?? 50;
  const out: GetCustomerAddressesData["getCustomerAddresses"] = [];
  const seen = new Set<string>();

  if (!authToken) return { getCustomerAddresses: [] };

  for (let page = 1; page <= maxPages; page += 1) {
    const { getCustomerAddresses } = await fetchCustomerAddresses(
      { pageNumber: page, itemsPerPage: pageSize },
      authToken,
    );
    const rows = Array.isArray(getCustomerAddresses) ? getCustomerAddresses : [];
    if (rows.length === 0) break;

    let added = 0;
    for (const a of rows) {
      const id = String(a?.uuid ?? "");
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(a);
      added += 1;
    }
    if (added === 0) break;
  }

  return { getCustomerAddresses: out };
}

const emptyWishlist: GetCustomerWishlistData = { getCustomerWishlist: [] };

export async function fetchCustomerWishlist(
  variables: GetCustomerWishlistVariables | undefined,
  authToken: string | null | undefined,
): Promise<GetCustomerWishlistData> {
  const language = variables?.language ?? "en";
  const currency = variables?.currency ?? "USD";
  const pageNumber = variables?.pageNumber ?? 1;
  const itemsPerPage = clampProductListItemsPerPage(variables?.itemsPerPage);
  const data =
    (await graphqlRequest<GetCustomerWishlistData>(
      {
        query: GET_CUSTOMER_WISHLIST,
        operationName: "GetCustomerWishlist",
        variables: { language, currency, pageNumber, itemsPerPage },
      },
      { authToken },
    )) ?? emptyWishlist;

  // API may ignore `itemsPerPage`; enforce client-side cap for stability.
  const rows = data.getCustomerWishlist;
  if (!Array.isArray(rows)) return emptyWishlist;
  return { ...data, getCustomerWishlist: rows.slice(0, itemsPerPage) };
}

/**
 * Fetches all wishlist rows by paging `getCustomerWishlist`.
 * We cannot reuse `fetchCustomerWishlist()` because it intentionally clamps page size to 5
 * (shared product-list stability cap).
 */
export async function fetchAllCustomerWishlist(
  variables:
    | Omit<GetCustomerWishlistVariables, "pageNumber" | "itemsPerPage">
    | undefined,
  authToken: string | null | undefined,
  options?: { pageSize?: number; maxPages?: number },
): Promise<GetCustomerWishlistData> {
  const language = variables?.language ?? "en";
  const currency = variables?.currency ?? "USD";
  const pageSizeRaw = options?.pageSize ?? 50;
  const pageSize =
    Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Math.min(200, Math.max(1, Math.floor(Number(pageSizeRaw))))
      : 50;
  const maxPagesRaw = options?.maxPages ?? 50;
  const maxPages =
    Number.isFinite(Number(maxPagesRaw)) && Number(maxPagesRaw) > 0
      ? Math.min(200, Math.max(1, Math.floor(Number(maxPagesRaw))))
      : 50;

  if (!authToken) return emptyWishlist;

  const out: NonNullable<GetCustomerWishlistData["getCustomerWishlist"]> = [];
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const data =
      (await graphqlRequest<GetCustomerWishlistData>(
        {
          query: GET_CUSTOMER_WISHLIST,
          operationName: "GetCustomerWishlist",
          variables: { language, currency, pageNumber: page, itemsPerPage: pageSize },
        },
        { authToken },
      )) ?? emptyWishlist;

    const rows = Array.isArray(data.getCustomerWishlist) ? data.getCustomerWishlist : [];
    if (rows.length === 0) break;

    let added = 0;
    for (const row of rows) {
      const id = String(row?.uuid ?? "");
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(row);
      added += 1;
    }
    if (added === 0) break;
    // If backend respects `itemsPerPage`, a short page implies end.
    if (rows.length < pageSize) break;
  }

  return { getCustomerWishlist: out };
}

const emptyWishlistCount: GetCustomerWishlistCountData = {
  getCustomerWishlistCount: 0,
};

export async function fetchCustomerWishlistCount(
  authToken: string | null | undefined,
): Promise<GetCustomerWishlistCountData> {
  return (
    (await graphqlRequest<GetCustomerWishlistCountData>(
      {
        query: GET_CUSTOMER_WISHLIST_COUNT,
        operationName: "GetCustomerWishlistCount",
      },
      { authToken },
    )) ?? emptyWishlistCount
  );
}

const emptyCustomerCart: GetCustomerCartData = { getCustomerCart: [] };

export async function fetchCustomerCart(
  variables: GetCustomerCartVariables | undefined,
  authToken: string | null | undefined,
): Promise<GetCustomerCartData> {
  const language = variables?.language ?? "en";
  const currency = variables?.currency ?? "USD";
  return (
    (await graphqlRequest<GetCustomerCartData>(
      {
        query: GET_CUSTOMER_CART,
        operationName: "GetCustomerCart",
        variables: { language, currency },
      },
      { authToken },
    )) ?? emptyCustomerCart
  );
}

const emptyCartCount: GetCustomerCartCountData = {
  getCustomerCartCount: 0,
};

export async function fetchCustomerCartCount(
  authToken: string | null | undefined,
): Promise<GetCustomerCartCountData> {
  return (
    (await graphqlRequest<GetCustomerCartCountData>(
      {
        query: GET_CUSTOMER_CART_COUNT,
        operationName: "GetCustomerCartCount",
      },
      { authToken },
    )) ?? emptyCartCount
  );
}

const emptySavedCards: GetCustomerSavedCardsData = { getCustomerSavedCards: [] };

export async function fetchCustomerSavedCards(
  authToken: string | null | undefined,
): Promise<GetCustomerSavedCardsData> {
  if (!authToken) return emptySavedCards;

  const data =
    (await graphqlRequest<GetCustomerSavedCardsData>(
      {
        query: GET_CUSTOMER_SAVED_CARDS,
        operationName: "GetCustomerSavedCards",
      },
      { authToken, allowErrors: true },
    )) ?? emptySavedCards;

  return data.getCustomerSavedCards
    ? data
    : { ...emptySavedCards, getCustomerSavedCards: data.getCustomerSavedCards ?? [] };
}

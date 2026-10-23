import { graphqlRequest } from "../client";
import {
  GET_CURRENT_CUSTOMER_ORDERS,
  GET_CURRENT_CUSTOMER_ORDER,
  GET_CURRENT_CUSTOMER_ORDER_PREVIEW,
  GET_CURRENT_CUSTOMER_ORDER_PREVIEW_V2,
  GET_ORDER_TRACKING,
  type GetCurrentCustomerOrdersVariables,
  type GetCurrentCustomerOrderVariables,
  type GetCurrentCustomerOrderPreviewVariables,
  type GetCurrentCustomerOrderPreviewV2Variables,
  type GetOrderTrackingVariables,
} from "../queries/orders";
import type {
  GetCurrentCustomerOrderData,
  GetCurrentCustomerOrdersData,
  GetCurrentCustomerOrderPreviewData,
  GetCurrentCustomerOrderPreviewV2Data,
  GetOrderTrackingData,
} from "../types/responses";

const emptyOrders: GetCurrentCustomerOrdersData = { getCurrentCustomerOrders: [] };
const emptyOrder: GetCurrentCustomerOrderData = { getCurrentCustomerOrder: null };
const emptyPreview: GetCurrentCustomerOrderPreviewData = {
  getCurrentCustomerOrderPreview: null,
};
const emptyPreviewV2: GetCurrentCustomerOrderPreviewV2Data = {
  getCurrentCustomerOrderPreviewV2: null,
};
const emptyTracking: GetOrderTrackingData = { getOrderTracking: [] };

export async function fetchCurrentCustomerOrders(
  variables: GetCurrentCustomerOrdersVariables,
  authToken?: string | null,
): Promise<GetCurrentCustomerOrdersData> {
  return (
    (await graphqlRequest<GetCurrentCustomerOrdersData>(
      {
        query: GET_CURRENT_CUSTOMER_ORDERS,
        operationName: "GetCurrentCustomerOrders",
        variables: {
          pageNumber: variables.pageNumber,
          itemsPerPage: variables.itemsPerPage,
          currency: variables.currency,
          language: variables.language,
        } as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    )) ?? emptyOrders
  );
}

export async function fetchCurrentCustomerOrder(
  variables: GetCurrentCustomerOrderVariables,
  authToken?: string | null,
): Promise<GetCurrentCustomerOrderData> {
  return (
    (await graphqlRequest<GetCurrentCustomerOrderData>(
      {
        query: GET_CURRENT_CUSTOMER_ORDER,
        operationName: "GetCurrentCustomerOrder",
        variables: {
          uuid: variables.uuid,
          currency: variables.currency,
          language: variables.language,
        } as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    )) ?? emptyOrder
  );
}

export async function fetchOrderTracking(
  variables: GetOrderTrackingVariables,
  authToken?: string | null,
): Promise<GetOrderTrackingData> {
  return (
    (await graphqlRequest<GetOrderTrackingData>(
      {
        query: GET_ORDER_TRACKING,
        operationName: "GetOrderTracking",
        variables: {
          uuid: variables.uuid,
          language: variables.language,
        } as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    )) ?? emptyTracking
  );
}

export async function fetchCurrentCustomerOrderPreview(
  variables: GetCurrentCustomerOrderPreviewVariables | undefined,
  authToken?: string | null,
  errorMessageOut?: { value: string | null },
): Promise<GetCurrentCustomerOrderPreviewData> {
  const language = variables?.language ?? "en";
  const currency = variables?.currency ?? "QAR";
  const couponCode = variables?.couponCode ?? null;
  return (
    (await graphqlRequest<GetCurrentCustomerOrderPreviewData>(
      {
        query: GET_CURRENT_CUSTOMER_ORDER_PREVIEW,
        operationName: "GetCurrentCustomerOrderPreview",
        variables: { language, currency, couponCode } as Record<string, unknown>,
      },
      { authToken, allowErrors: true, errorMessageOut },
    )) ?? emptyPreview
  );
}

export async function fetchCurrentCustomerOrderPreviewV2(
  variables: GetCurrentCustomerOrderPreviewV2Variables | undefined,
  authToken?: string | null,
  errorMessageOut?: { value: string | null },
): Promise<GetCurrentCustomerOrderPreviewV2Data> {
  const language = variables?.language ?? "en";
  const currency = variables?.currency ?? "QAR";
  const couponCode = variables?.couponCode ?? null;
  const cartItemUuids = variables?.cartItemUuids ?? null;
  return (
    (await graphqlRequest<GetCurrentCustomerOrderPreviewV2Data>(
      {
        query: GET_CURRENT_CUSTOMER_ORDER_PREVIEW_V2,
        operationName: "GetCurrentCustomerOrderPreviewV2",
        variables: { language, currency, couponCode, cartItemUuids } as Record<
          string,
          unknown
        >,
      },
      { authToken, allowErrors: true, errorMessageOut },
    )) ?? emptyPreviewV2
  );
}


import { graphqlRequest } from "../client";
import {
  GET_FREE_SHIPPING_VALUE,
  GET_MINIMUM_ORDER_VALUE,
  type GetFreeShippingValueVariables,
  type GetMinimumOrderValueVariables,
} from "../queries/settings";
import type {
  GetFreeShippingValueData,
  GetMinimumOrderValueData,
} from "../types/settings";

const emptyMinimumOrder: GetMinimumOrderValueData = { getMinimumOrderValue: null };
const emptyFreeShipping: GetFreeShippingValueData = { getFreeShippingValue: null };

export async function fetchMinimumOrderValue(
  variables: GetMinimumOrderValueVariables,
  authToken?: string | null,
): Promise<GetMinimumOrderValueData> {
  const currency = String(variables.currency ?? "").trim();
  return (
    (await graphqlRequest<GetMinimumOrderValueData>(
      {
        query: GET_MINIMUM_ORDER_VALUE,
        operationName: "GetMinimumOrderValue",
        variables: { currency: currency || null },
      },
      { authToken },
    )) ?? emptyMinimumOrder
  );
}

export async function fetchFreeShippingValue(
  variables: GetFreeShippingValueVariables,
  authToken?: string | null,
): Promise<GetFreeShippingValueData> {
  const currency = String(variables.currency ?? "").trim();
  return (
    (await graphqlRequest<GetFreeShippingValueData>(
      {
        query: GET_FREE_SHIPPING_VALUE,
        operationName: "GetFreeShippingValue",
        variables: { currency: currency || null },
      },
      { authToken },
    )) ?? emptyFreeShipping
  );
}

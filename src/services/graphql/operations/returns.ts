import { graphqlRequest } from "../client";
import {
  GET_CURRENT_CUSTOMER_RETURN_REQUESTS,
  GET_CURRENT_CUSTOMER_RETURN_REQUEST,
  type GetCurrentCustomerReturnRequestsVariables,
  type GetCurrentCustomerReturnRequestVariables,
} from "../queries/returns";
import type {
  GetCurrentCustomerReturnRequestsData,
  GetCurrentCustomerReturnRequestData,
} from "../types/responses";

const empty: GetCurrentCustomerReturnRequestsData = {
  getCurrentCustomerReturnRequests: [],
};
const emptyOne: GetCurrentCustomerReturnRequestData = {
  getCurrentCustomerReturnRequest: null,
};

export async function fetchCurrentCustomerReturnRequests(
  variables: GetCurrentCustomerReturnRequestsVariables,
  authToken?: string | null,
): Promise<GetCurrentCustomerReturnRequestsData> {
  return (
    (await graphqlRequest<GetCurrentCustomerReturnRequestsData>(
      {
        query: GET_CURRENT_CUSTOMER_RETURN_REQUESTS,
        operationName: "GetCurrentCustomerReturnRequests",
        variables: {
          currency: variables.currency,
          language: variables.language,
        } as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    )) ?? empty
  );
}

export async function fetchCurrentCustomerReturnRequest(
  variables: GetCurrentCustomerReturnRequestVariables,
  authToken?: string | null,
): Promise<GetCurrentCustomerReturnRequestData> {
  return (
    (await graphqlRequest<GetCurrentCustomerReturnRequestData>(
      {
        query: GET_CURRENT_CUSTOMER_RETURN_REQUEST,
        operationName: "GetCurrentCustomerReturnRequest",
        variables: {
          uuid: variables.uuid,
          currency: variables.currency,
          language: variables.language,
        } as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    )) ?? emptyOne
  );
}


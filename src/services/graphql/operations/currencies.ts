import { graphqlRequest } from "../client";
import { GET_CURRENCIES } from "../queries/currencies";
import type { GetCurrenciesData } from "../types/currency";

const emptyCurrencies: GetCurrenciesData = { getCurrencies: [] };

export async function fetchCurrencies(
  authToken?: string | null,
): Promise<GetCurrenciesData> {
  return (
    (await graphqlRequest<GetCurrenciesData>(
      {
        query: GET_CURRENCIES,
        operationName: "GetCurrencies",
      },
      { authToken },
    )) ?? emptyCurrencies
  );
}

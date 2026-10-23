import { graphqlRequest } from "../client";
import { GET_PROMOS, type GetPromosVariables } from "../queries/promos";
import type { GetPromosData } from "../types/responses";

const emptyPromos: GetPromosData = { getPromos: [] };

export async function fetchPromos(
  variables: GetPromosVariables,
  authToken?: string | null,
): Promise<GetPromosData> {
  return (
    (await graphqlRequest<GetPromosData>(
      {
        query: GET_PROMOS,
        operationName: "Promos",
        variables: {
          pageNumber: variables.pageNumber,
          itemsPerPage: variables.itemsPerPage,
        } as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    )) ?? emptyPromos
  );
}


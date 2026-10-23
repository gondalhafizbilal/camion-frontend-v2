import { graphqlRequest } from "../client";
import { GET_CATEGORIES, type GetCategoriesVariables } from "../queries/categories";
import type { GetCategoriesData } from "../types/category";

const emptyCategories: GetCategoriesData = { getCategories: [] };

export async function fetchCategories(
  variables: GetCategoriesVariables,
  authToken?: string | null,
): Promise<GetCategoriesData> {
  try {
    const data = await graphqlRequest<GetCategoriesData>(
      {
        query: GET_CATEGORIES,
        operationName: "GetCategories",
        variables: variables as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    );
    return data ?? emptyCategories;
  } catch (e) {
    console.warn("[categories] GraphQL unavailable; using empty category list:", e);
    return emptyCategories;
  }
}

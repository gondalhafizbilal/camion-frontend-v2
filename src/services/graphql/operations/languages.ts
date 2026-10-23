import { graphqlRequest } from "../client";
import { GET_LANGUAGES } from "../queries/languages";
import type { GetLanguagesData } from "../types/language";

const emptyLanguages: GetLanguagesData = { getLanguages: [] };

export async function fetchLanguages(
  authToken?: string | null,
): Promise<GetLanguagesData> {
  return (
    (await graphqlRequest<GetLanguagesData>(
      {
        query: GET_LANGUAGES,
        operationName: "GetLanguages",
      },
      { authToken },
    )) ?? emptyLanguages
  );
}

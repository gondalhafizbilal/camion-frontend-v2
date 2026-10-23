import { STORIES_ENABLED } from "@/lib/features/storiesEnabled";
import { graphqlRequest } from "../client";
import { GET_STORIES, type GetStoriesVariables } from "../queries/stories";
import type { GetStoriesData } from "../types/story";

const emptyStories: GetStoriesData = { getStories: [] };

export async function fetchStories(
  variables: GetStoriesVariables,
  authToken?: string | null,
): Promise<GetStoriesData> {
  if (!STORIES_ENABLED) {
    return emptyStories;
  }

  return (
    (await graphqlRequest<GetStoriesData>(
      {
        query: GET_STORIES,
        operationName: "GetStories",
        variables: variables as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyStories
  );
}

import { STORIES_ENABLED } from "@/lib/features/storiesEnabled";
import { HOME_GRAPHQL_REVALIDATE_SECONDS } from "@/lib/home/homeCacheConfig";
import { graphqlRequest } from "../client";
import { GET_HOME_PAGE, type HomePageVariables } from "../queries/home";
import type { GqlProduct } from "../types/product";
import type { GqlStory } from "../types/story";

export type HomePageData = {
  stories: GqlStory[];
  popularProducts: GqlProduct[];
  featuredProducts: GqlProduct[];
  featuredCampaignProducts: GqlProduct[];
};

const emptyHome: HomePageData = {
  stories: [],
  popularProducts: [],
  featuredProducts: [],
  featuredCampaignProducts: [],
};

export async function fetchHomePage(
  variables: HomePageVariables,
  authToken?: string | null,
): Promise<HomePageData> {
  const isServer = typeof window === "undefined";
  const data =
    (await graphqlRequest<HomePageData>(
      {
        query: GET_HOME_PAGE,
        operationName: "HomePage",
        variables: variables as Record<string, unknown>,
      },
      {
        authToken,
        allowErrors: true,
        ...(isServer
          ? {
              nextCache: {
                revalidate: HOME_GRAPHQL_REVALIDATE_SECONDS,
                tags: ["home", "home-graphql"],
              },
            }
          : {}),
      },
    )) ?? emptyHome;

  return {
    stories: STORIES_ENABLED ? (data.stories ?? []) : [],
    popularProducts: data.popularProducts ?? [],
    featuredProducts: data.featuredProducts ?? [],
    featuredCampaignProducts: data.featuredCampaignProducts ?? [],
  };
}


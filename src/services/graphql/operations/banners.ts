import { graphqlRequest } from "../client";
import { GET_BANNERS, type GetBannersVariables } from "../queries/banners";
import type { GetBannersData, GqlBanner } from "../types/banner";

const emptyBanners: GetBannersData = { getBanners: [] };

/** Request size per page — backend may cap lower (e.g. ~24). */
export const BANNERS_ITEMS_PER_PAGE = 100;

/** Safety cap so a bad paginator cannot loop forever. */
const MAX_BANNER_PAGES = 50;

export async function fetchBanners(
  variables: GetBannersVariables,
  authToken?: string | null,
): Promise<GetBannersData> {
  return (
    (await graphqlRequest<GetBannersData>(
      {
        query: GET_BANNERS,
        operationName: "GetBanners",
        variables: variables as Record<string, unknown>,
      },
      { authToken },
    )) ?? emptyBanners
  );
}

type FetchAllBannersOptions = {
  language?: string | null;
  itemsPerPage?: number;
  authToken?: string | null;
};

/**
 * Walks `getBanners` pages until the API returns an empty batch.
 * De-duplicates by `uuid` when the upstream paginator overlaps pages.
 */
export async function fetchAllBanners(
  options: FetchAllBannersOptions = {},
): Promise<GqlBanner[]> {
  const {
    language = null,
    itemsPerPage = BANNERS_ITEMS_PER_PAGE,
    authToken = null,
  } = options;

  const merged: GqlBanner[] = [];
  const seen = new Set<string>();

  for (let pageNumber = 1; pageNumber <= MAX_BANNER_PAGES; pageNumber += 1) {
    const { getBanners } = await fetchBanners(
      { language, pageNumber, itemsPerPage },
      authToken,
    );
    const batch = getBanners ?? [];
    if (batch.length === 0) break;

    let added = 0;
    for (const banner of batch) {
      const id = banner?.uuid?.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(banner);
      added += 1;
    }

    // Guard: stop if a page repeats data instead of advancing.
    if (added === 0) break;
  }

  return merged;
}

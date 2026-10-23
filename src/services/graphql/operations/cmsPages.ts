import { graphqlRequest } from "../client";
import { GET_POST, GET_POSTS, type GetPostVariables } from "../queries/posts";
import {
  GET_CMS_PAGE,
  GET_CMS_PAGES,
  type GetCmsPageVariables,
} from "../queries/cmsPages";
import type { GetCmsPageData, GetCmsPagesData, GqlCmsPage } from "../types/cmsPage";

type FallbackPostData = {
  getPost?: {
    uuid?: string | null;
    slug?: string | null;
    title?: string | null;
    brief?: string | null;
    content?: string | null;
    enabled?: boolean | null;
    createdBy?: { uuid?: string | null; fullName?: string | null } | null;
  } | null;
};

type FallbackPostsData = {
  getPosts?: Array<{
    uuid?: string | null;
    slug?: string | null;
    title?: string | null;
    brief?: string | null;
    content?: string | null;
    enabled?: boolean | null;
  }> | null;
};

export type FetchCmsLegalPageResult = {
  page: GqlCmsPage | null;
  source: "cms" | "post" | "none";
};

export async function fetchCmsPages(
  authToken?: string | null,
  locale = "en",
): Promise<{ pages: GqlCmsPage[]; source: "cms" | "none" }> {
  const cms =
    (await graphqlRequest<GetCmsPagesData>(
      {
        query: GET_CMS_PAGES,
        operationName: "GetCmsPages",
        variables: { language: locale },
      },
      { authToken, allowErrors: true },
    )) ?? null;

  const rows = (cms?.getCmsPages ?? [])
    .filter((page): page is GqlCmsPage => Boolean(page))
    .map((page) => page as GqlCmsPage);
  if (rows.length) return { pages: rows, source: "cms" };

  // Temporary fallback: treat legacy `getPosts` as “CMS pages”.
  const posts =
    (await graphqlRequest<FallbackPostsData>(
      {
        query: GET_POSTS,
        operationName: "GetPosts",
        variables: { language: locale },
      },
      { authToken, allowErrors: true },
    )) ?? null;

  const mapped: GqlCmsPage[] = (posts?.getPosts ?? [])
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      uuid: p.uuid ?? null,
      slug: p.slug ?? null,
      title: p.title ?? null,
      brief: p.brief ?? null,
      content: p.content ?? null,
      enabled: p.enabled ?? null,
      createdAt: null,
      updatedAt: null,
    }));

  return { pages: mapped, source: mapped.length ? "cms" : "none" };
}

/**
 * Fetch a CMS page by slug.
 * - Tries `getCmsPage(slug)` first.
 * - Falls back to `getCmsPages` list match, then legacy `getPost(slug)`.
 */
export async function fetchCmsPageBySlug(
  variables: GetCmsPageVariables,
  authToken?: string | null,
  locale = "en",
): Promise<FetchCmsLegalPageResult> {
  const slug = String(variables.slug ?? "").trim();
  const targetSlug = slug.toLowerCase();

  const cmsBySlug =
    (await graphqlRequest<GetCmsPageData>(
      {
        query: GET_CMS_PAGE,
        operationName: "GetCmsPage",
        variables: {
          slug,
          language: locale,
        } satisfies GetCmsPageVariables & { language: string } as unknown as Record<
          string,
          unknown
        >,
      },
      { authToken, allowErrors: true },
    )) ?? null;

  const directPage = cmsBySlug?.getCmsPage ?? null;
  if (directPage && (directPage.enabled ?? true) !== false) {
    return { page: directPage, source: "cms" };
  }

  const { pages: rows } = await fetchCmsPages(authToken, locale);
  const cmsPage =
    rows.find(
      (p) =>
        String(p.slug ?? "")
          .trim()
          .toLowerCase() === targetSlug,
    ) ?? null;
  if (cmsPage && (cmsPage.enabled ?? true) !== false)
    return { page: cmsPage, source: "cms" };

  const post =
    (await graphqlRequest<FallbackPostData>(
      {
        query: GET_POST,
        operationName: "GetPost",
        variables: {
          slug: variables.slug,
          language: locale,
        } satisfies GetPostVariables as unknown as Record<string, unknown>,
      },
      { authToken, allowErrors: true },
    )) ?? null;

  const p = post?.getPost ?? null;
  if (p && (p.enabled ?? true) !== false) {
    return {
      page: {
        uuid: p.uuid ?? null,
        slug: p.slug ?? null,
        title: p.title ?? null,
        brief: p.brief ?? null,
        content: p.content ?? null,
        enabled: p.enabled ?? null,
        createdAt: null,
        updatedAt: null,
      },
      source: "post",
    };
  }

  return { page: null, source: "none" };
}

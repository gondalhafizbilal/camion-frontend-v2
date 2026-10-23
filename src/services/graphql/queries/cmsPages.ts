export type GetCmsPageVariables = {
  slug: string;
};

/**
 * CMS pages (legal, static pages, etc.).
 *
 * Note: some environments may not expose these fields; callers should use
 * `allowErrors: true` and fall back to `getPost` if needed.
 */
export const GET_CMS_PAGES = `
query GetCmsPages($language: String!) {
  getCmsPages {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    content(language: $language)
    updatedAt
    createdAt
    enabled
  }
}
`.trim();

export const GET_CMS_PAGE = `
query GetCmsPage($slug: String!, $language: String!) {
  getCmsPage(slug: $slug) {
    uuid
    slug
    title(language: $language)
    brief(language: $language)
    content(language: $language)
    updatedAt
    createdAt
    enabled
  }
}
`.trim();

export const GET_CATEGORIES = `
query GetCategories($language: String, $pageNumber: Int, $itemsPerPage: Int) {
  getCategories(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    slug
    name(language: $language)
    thumbnailUrl
    children {
      uuid
      slug
      name(language: $language)
      thumbnailUrl
      children {
        uuid
        slug
        name(language: $language)
        thumbnailUrl
      }
    }
  }
}
`.trim();

export type GetCategoriesVariables = {
  language?: string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

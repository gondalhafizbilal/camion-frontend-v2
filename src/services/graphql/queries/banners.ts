export const GET_BANNERS = `
query GetBanners($language: String, $pageNumber: Int, $itemsPerPage: Int) {
  getBanners(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    title(language: $language)
    imageUrl(language: $language)
    linkUrl
    placement
    color
    isActive
  }
}
`.trim();

export type GetBannersVariables = {
  language?: string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

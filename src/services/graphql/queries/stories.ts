export const GET_STORIES = `
query GetStories($language: String, $pageNumber: Int, $itemsPerPage: Int) {
  getStories(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    caption(language: $language)
    isHighlighted
    frames {
      uuid
      mediaType
      mediaUrl
      thumbnailUrl
      duration
      order
    }
  }
}
`.trim();

export type GetStoriesVariables = {
  language?: string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

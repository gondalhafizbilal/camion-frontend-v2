export type GetPromosVariables = {
  pageNumber?: number;
  itemsPerPage?: number;
};

export const GET_PROMOS = `
query Promos($pageNumber: Int, $itemsPerPage: Int) {
  getPromos(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
    uuid
    name
    text
    callToActionText
    callToActionLink
  }
}
`.trim();


export const GET_LANGUAGES = `
query GetLanguages {
  getLanguages {
    uuid
    name
    shortCode
  }
}
`.trim();

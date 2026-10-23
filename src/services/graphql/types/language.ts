/** Row from `getLanguages`. */

export type GqlLanguage = {
  uuid: string;
  name?: string | null;
  shortCode?: string | null;
};

export type GetLanguagesData = {
  getLanguages: GqlLanguage[];
};

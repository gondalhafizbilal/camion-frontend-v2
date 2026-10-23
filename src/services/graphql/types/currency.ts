/** Row from `getCurrencies`. */

export type GqlCurrency = {
  uuid: string;
  name?: string | null;
  alphaCode?: string | null;
};

export type GetCurrenciesData = {
  getCurrencies: GqlCurrency[];
};

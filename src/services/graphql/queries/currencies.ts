export const GET_CURRENCIES = `
query GetCurrencies {
  getCurrencies {
    uuid
    name
    alphaCode
  }
}
`.trim();

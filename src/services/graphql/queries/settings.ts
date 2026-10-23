const siteSettingValueFields = `
    uuid
    name
    type
    integerValue
    decimalValue
    stringValue
    booleanValue
    sensitive
`;

export type GetMinimumOrderValueVariables = {
  currency?: string | null;
};

export type GetFreeShippingValueVariables = {
  currency?: string | null;
};

export const GET_MINIMUM_ORDER_VALUE = `
query GetMinimumOrderValue($currency: String) {
  getMinimumOrderValue(currency: $currency) {
${siteSettingValueFields}
  }
}
`.trim();

export const GET_FREE_SHIPPING_VALUE = `
query GetFreeShippingValue($currency: String) {
  getFreeShippingValue(currency: $currency) {
${siteSettingValueFields}
  }
}
`.trim();

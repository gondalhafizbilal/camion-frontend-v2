/** Numeric site setting row returned by `getMinimumOrderValue` / `getFreeShippingValue`. */
export type GqlSiteSettingValue = {
  uuid?: string | null;
  name?: string | null;
  type?: string | null;
  integerValue?: number | null;
  decimalValue?: number | null;
  stringValue?: string | null;
  booleanValue?: boolean | null;
  sensitive?: boolean | null;
};

export type GqlMinimumOrderValue = GqlSiteSettingValue;
export type GqlFreeShippingValue = GqlSiteSettingValue;

export type GetMinimumOrderValueData = {
  getMinimumOrderValue: GqlMinimumOrderValue | null;
};

export type GetFreeShippingValueData = {
  getFreeShippingValue: GqlFreeShippingValue | null;
};

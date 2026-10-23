/** Static PDP delivery estimates until product-level shipping API is available. */

export const PRODUCT_DELIVERY_FASTEST_DAYS = 4;
export const PRODUCT_DELIVERY_MIN_DAYS = 4;
export const PRODUCT_DELIVERY_MAX_DAYS = 11;

export type ProductDeliveryDistributionRow = {
  /** i18n key for the row label */
  labelKey: "productShippingDaysOrLess" | "productShippingDaysExact";
  days: number;
  percentage: number;
};

/** Historical delivery-time distribution shown in the shipping details modal. */
export const PRODUCT_DELIVERY_DISTRIBUTION: ProductDeliveryDistributionRow[] = [
  { labelKey: "productShippingDaysOrLess", days: 4, percentage: 5 },
  { labelKey: "productShippingDaysExact", days: 5, percentage: 6 },
  { labelKey: "productShippingDaysExact", days: 6, percentage: 7 },
  { labelKey: "productShippingDaysExact", days: 7, percentage: 8 },
  { labelKey: "productShippingDaysExact", days: 8, percentage: 9 },
  { labelKey: "productShippingDaysExact", days: 9, percentage: 10 },
  { labelKey: "productShippingDaysExact", days: 10, percentage: 11 },
  { labelKey: "productShippingDaysExact", days: 11, percentage: 12 },
];

export function maxDeliveryDistributionPercentage(
  rows: ProductDeliveryDistributionRow[] = PRODUCT_DELIVERY_DISTRIBUTION,
): number {
  return rows.reduce((max, row) => Math.max(max, row.percentage), 0);
}

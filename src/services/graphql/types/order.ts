import type {
  GqlDimensions,
  GqlMoney,
  GqlProductCategoryRow,
  GqlVariantImage,
  GqlWeight,
} from "./product";
import type { GqlCustomerAddress } from "./customer";

export type GqlOrderProduct = {
  uuid: string;
  slug?: string | null;
  title?: string | null;
  brief?: string | null;
  description?: string | null;
  descriptionHtml?: string | null;
  featuredImageUrl?: string | null;
  featuredThumbnailUrl?: string | null;
  status?: string | null;
  productCategories?: GqlProductCategoryRow[] | null;
};

/** Variant option row on `getCurrentCustomerOrder` when `optionValues` is requested. */
export type GqlOrderVariantOptionRow = {
  optionValue?: {
    uuid: string;
    value?: string | null;
    position?: number | null;
    option?: {
      uuid: string;
      name?: string | null;
      position?: number | null;
    } | null;
  } | null;
};

export type GqlOrderVariant = {
  uuid: string;
  title?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price?: GqlMoney | null;
  discountedPrice?: GqlMoney | null;
  weight?: GqlWeight | null;
  dimensions?: GqlDimensions | null;
  images?: GqlVariantImage[] | null;
  optionValues?: GqlOrderVariantOptionRow[] | null;
};

export type GqlOrderItem = {
  uuid: string;
  price?: GqlMoney | null;
  discountedPrice?: GqlMoney | null;
  quantity?: number | null;
  total?: GqlMoney | null;
  product?: GqlOrderProduct | null;
  variant?: GqlOrderVariant | null;
};

/**
 * WMS fulfillment tracking on customer orders.
 * - `stage`: `order` | `inbound` | `outbound` (furthest stage reached)
 * - `status`: customer-facing label for the current stage
 * - `waybillNo`: carrier number once shipped (outbound)
 */
export type GqlOrderTracking = {
  stage?: string | null;
  status?: string | null;
  waybillNo?: string | null;
};

export type GqlCustomerOrder = {
  uuid: string;
  status?: string | null;
  subTotal?: GqlMoney | null;
  shippingCost?: GqlMoney | null;
  discount?: GqlMoney | null;
  total?: GqlMoney | null;
  eta?: string | null;
  tracking?: GqlOrderTracking | null;
  /** ISO / RFC3339 / numeric epoch from API — displayed on My Orders. */
  orderPlacementDate?: string | number | null;
  shippingAddress?: GqlCustomerAddress | null;
  orderItems?: GqlOrderItem[] | null;
};

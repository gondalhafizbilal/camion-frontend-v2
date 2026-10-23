import type { GqlMoney, GqlVariantImage, GqlWeight, GqlDimensions } from "./product";
import type { GqlCustomerOrder } from "./order";

export type GqlReturnEvidence = {
  uuid: string;
  url?: string | null;
  mimeType?: string | null;
};

export type GqlReturnOrderItem = {
  uuid: string;
  price?: GqlMoney | null;
  discountedPrice?: GqlMoney | null;
  quantity?: number | null;
  total?: GqlMoney | null;
  product?: {
    uuid: string;
    slug?: string | null;
    title?: string | null;
    brief?: string | null;
    description?: string | null;
    descriptionHtml?: string | null;
    featuredImageUrl?: string | null;
    featuredThumbnailUrl?: string | null;
    status?: string | null;
    productCategories?: unknown[] | null;
  } | null;
  variant?: {
    uuid: string;
    title?: string | null;
    sku?: string | null;
    barcode?: string | null;
    price?: GqlMoney | null;
    discountedPrice?: GqlMoney | null;
    weight?: GqlWeight | null;
    dimensions?: GqlDimensions | null;
    images?: GqlVariantImage[] | null;
  } | null;
};

export type GqlReturnRequest = {
  uuid: string;
  order?: GqlCustomerOrder | null;
  orderItem?: GqlReturnOrderItem | null;
  reason?: string | null;
  reasonDetail?: string | null;
  status?: "pending" | "approved" | "rejected" | "refunded" | string | null;
  adminNote?: string | null;
  refundAmount?: GqlMoney | null;
  evidence?: GqlReturnEvidence[] | null;
};


import type { GqlCustomerAddress } from "./customer";
import type { GqlDimensions, GqlMoney, GqlWeight } from "./product";

export type GqlOrderPreviewItem = {
  uuid: string;
  quantity?: number | null;
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
    salesCount?: number | null;
    likesCount?: number | null;
    reviewsCount?: number | null;
    ratingAvg?: number | null;
    ratingOneStarCount?: number | null;
    ratingTwoStarCount?: number | null;
    ratingThreeStarCount?: number | null;
    ratingFourStarCount?: number | null;
    ratingFiveStarCount?: number | null;
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
    images?: Array<{
      uuid?: string | null;
      imageUrl?: string | null;
      thumbnailUrl?: string | null;
      alt?: string | null;
      isFeatured?: boolean | null;
      position?: number | null;
    }> | null;
    optionValues?: Array<{
      optionValue?: {
        uuid?: string | null;
        value?: string | null;
        position?: number | null;
        option?: {
          uuid?: string | null;
          name?: string | null;
          position?: number | null;
        } | null;
      } | null;
    }> | null;
  } | null;
};

export type GqlCurrentCustomerOrderPreview = {
  items?: GqlOrderPreviewItem[] | null;
  shippingAddress?: GqlCustomerAddress | null;
  cart_total?: number | string | null;
  discount?: number | string | null;
  shippingTotal?: number | string | null;
  grand_total?: number | string | null;
  eta?: string | null;
  orderTotalWarning?: string | string[] | null;
};

/** Line item on `getCurrentCustomerOrderPreviewV2` (includes stock, quantity, and line totals). */
export type GqlOrderPreviewItemV2 = GqlOrderPreviewItem & {
  availableStock?: number | null;
  subTotal?: GqlMoney | null;
  discountPrice?: GqlMoney | null;
  total?: GqlMoney | null;
};

export type GqlCurrentCustomerOrderPreviewV2 = {
  items?: GqlOrderPreviewItemV2[] | null;
  shippingAddress?: GqlCustomerAddress | null;
  cart_total?: number | string | null;
  discount?: number | string | null;
  shippingTotal?: number | string | null;
  grand_total?: number | string | null;
  eta?: string | null;
  orderTotalWarning?: string | string[] | null;
};

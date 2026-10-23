/** Types aligned with the product selection set used in catalog GraphQL queries. */

export type GqlMoney = {
  amount: number | string;
  /** Fractional part in hundredths (e.g. 25 with amount 20 → 20.25). */
  minorAmount?: number | string | null;
  currencyCode: string;
};

export type GqlWeight = {
  amount: number | string;
  unit: string;
};

export type GqlDimensions = {
  width: number | string;
  height: number | string;
  length: number | string;
  /** May be null/absent depending on API; requested on catalog + search list queries. */
  unit?: string | null;
};

export type GqlOptionValue = {
  uuid: string;
  value?: string | null;
  position?: number | null;
};

export type GqlProductOption = {
  uuid: string;
  name?: string | null;
  position?: number | null;
  values: GqlOptionValue[];
};

/** `getProduct` → `productCategories` (join rows with nested `category`). */
export type GqlProductCategoryRow = {
  category?: {
    uuid: string;
    slug?: string | null;
    name?: string | null;
    /** Present on order/return payloads that select raw `nameEn` / `nameAr`. */
    nameEn?: string | null;
    nameAr?: string | null;
    thumbnailUrl?: string | null;
  } | null;
};

export type GqlVariantOptionValueRef = {
  optionValue: {
    uuid: string;
  };
};

/** Present when variant `images` are requested (search, catalog lists, …). */
export type GqlVariantImage = {
  uuid: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  alt?: string | null;
  isFeatured?: boolean | null;
  position?: number | null;
};

export type GqlProductVariant = {
  uuid: string;
  title?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price?: GqlMoney | null;
  /** Present when requested; can be null/absent if no discount applies. */
  discountedPrice?: GqlMoney | null;
  weight?: GqlWeight | null;
  dimensions?: GqlDimensions | null;
  optionValues?: GqlVariantOptionValueRef[] | null;
  /** Present when the query requests variant `images` (`getProduct`, search, catalog lists, …). */
  images?: GqlVariantImage[] | null;
};

export type GqlProductReviewCustomer = {
  uuid: string;
  fullName?: string | null;
};

/** Media attached to a product review (`GetProduct` → `reviews.images`). */
export type GqlProductReviewImage = {
  uuid: string;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
};

export type GqlProductReview = {
  uuid: string;
  rating: number | string;
  comment?: string | null;
  customer?: GqlProductReviewCustomer | null;
  images?: GqlProductReviewImage[] | null;
};

/** Active promotion on a product (`searchProducts` → `campaign`). */
export type GqlProductCampaign = {
  uuid: string;
  name?: string | null;
  brief?: string | null;
  slug?: string | null;
  discountPercentage?: number | string | null;
  startsAt?: string | null;
  finishesAt?: string | null;
};

export type GqlProductAttachment = {
  uuid: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
};

export type GqlProductBundleItem = {
  quantity?: number | string | null;
  product?: {
    uuid: string;
    slug?: string | null;
    titleEn?: string | null;
    titleAr?: string | null;
    briefEn?: string | null;
    briefAr?: string | null;
    featuredImageUrl?: string | null;
    featuredThumbnailUrl?: string | null;
    status?: string | null;
  } | null;
  variant?: {
    uuid?: string | null;
    sku?: string | null;
    titleEn?: string | null;
    titleAr?: string | null;
    price?: GqlMoney | null;
    discountedPrice?: GqlMoney | null;
  } | null;
};

export type GqlProductBundle = {
  uuid: string;
  slug?: string | null;
  mode?: string | null;
  title?: string | null;
  brief?: string | null;
  imageUrl?: string | null;
  discountType?: string | null;
  flatPriceValue?: number | string | null;
  discountPercentage?: number | string | null;
  discountAmountValue?: number | string | null;
  amountCurrencyCode?: string | null;
  minimumSelectionCount?: number | string | null;
  isActive?: boolean | null;
  anchorProductUuid?: string | null;
  sourceCategoryUuids?: string[] | null;
  autoFillCount?: number | string | null;
  startsAt?: string | null;
  finishesAt?: string | null;
  items?: GqlProductBundleItem[] | null;
};

export type GqlProduct = {
  uuid: string;
  slug: string;
  title?: string | null;
  brief?: string | null;
  description?: string | null;
  /** Product size chart URL (PDP only, `GetProduct`). */
  sizechartUrl?: string | null;
  descriptionHtml?: string | null;
  /** Product-level hero / list image (full). */
  featuredImageUrl?: string | null;
  /** Product-level hero / list image (thumb). */
  featuredThumbnailUrl?: string | null;
  status?: string | null;
  salesCount?: number | string | null;
  likesCount?: number | string | null;
  reviewsCount?: number | string | null;
  ratingAvg?: number | string | null;
  /** Fake urgency count for product cards (`getRecommendedProducts`, …). */
  stockCount?: number | string | null;
  ratingOneStarCount?: number | string | null;
  ratingTwoStarCount?: number | string | null;
  ratingThreeStarCount?: number | string | null;
  ratingFourStarCount?: number | string | null;
  ratingFiveStarCount?: number | string | null;
  productCategories?: GqlProductCategoryRow[] | null;
  options?: GqlProductOption[] | null;
  variants?: GqlProductVariant[] | null;
  /** Present on product detail (`GetProduct`) when requested. */
  reviews?: GqlProductReview[] | null;
  /** Present on product detail (`GetProduct`) and catalog lists when requested. */
  campaign?: GqlProductCampaign | null;
  /** Optional product attachments (media) */
  attachments?: GqlProductAttachment[] | null;
};

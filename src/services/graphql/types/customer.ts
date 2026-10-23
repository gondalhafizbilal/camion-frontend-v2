export type GqlCurrentCustomer = {
  uuid: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
};

export type GetCurrentCustomerData = {
  getCurrentCustomer: GqlCurrentCustomer | null;
};

export type GqlCustomerAddress = {
  uuid: string;
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  apartment: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
};

export type GetCustomerAddressesData = {
  getCustomerAddresses: GqlCustomerAddress[];
};

export type GqlWishlistProduct = {
  uuid: string;
  slug: string;
  title: string;
  brief: string;
  description: string;
  descriptionHtml: string;
  featuredImageUrl?: string | null;
  featuredThumbnailUrl?: string | null;
  status: string;
  salesCount?: number | null;
  likesCount?: number | null;
  reviewsCount?: number | null;
  ratingAvg?: number | null;
  ratingOneStarCount?: number | null;
  ratingTwoStarCount?: number | null;
  ratingThreeStarCount?: number | null;
  ratingFourStarCount?: number | null;
  ratingFiveStarCount?: number | null;
  campaign?: GqlCustomerCartProductCampaign | null;
};

export type GqlCustomerWishlistRow = {
  uuid: string;
  product: GqlWishlistProduct | null;
  variant?: {
    uuid: string;
    title?: string | null;
    sku?: string | null;
    barcode?: string | null;
    price?: GqlMoneyAmount | null;
    discountedPrice?: GqlMoneyAmount | null;
    weight?: { amount?: unknown; unit?: string | null } | null;
    dimensions?: {
      width?: unknown;
      height?: unknown;
      length?: unknown;
      unit?: string | null;
    } | null;
    images?: Array<{
      uuid?: string | null;
      imageUrl?: string | null;
      thumbnailUrl?: string | null;
      alt?: string | null;
      isFeatured?: boolean | null;
      position?: number | null;
    }> | null;
  } | null;
};

export type GetCustomerWishlistData = {
  getCustomerWishlist: GqlCustomerWishlistRow[] | null;
};

export type GetCustomerWishlistCountData = {
  getCustomerWishlistCount: number | null;
};

export type GqlMoneyAmount = {
  amount?: number | string | null;
  /** Fractional part in hundredths (e.g. 25 with amount 20 → 20.25). */
  minorAmount?: number | string | null;
  currencyCode?: string | null;
};

export type GqlCustomerCartProductCampaign = {
  uuid: string;
  name?: string | null;
  brief?: string | null;
  slug?: string | null;
  discountPercentage?: number | string | null;
  startsAt?: string | null;
  finishesAt?: string | null;
};

export type GqlCustomerCartProduct = {
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
  campaign?: GqlCustomerCartProductCampaign | null;
};

export type GqlCustomerCartVariant = {
  uuid: string;
  title?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price?: GqlMoneyAmount | null;
  discountedPrice?: GqlMoneyAmount | null;
  weight?: { amount?: unknown; unit?: string | null } | null;
  dimensions?: {
    width?: unknown;
    height?: unknown;
    length?: unknown;
    unit?: string | null;
  } | null;
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
};

export type GqlCustomerCartRow = {
  uuid: string;
  product?: GqlCustomerCartProduct | null;
  variant?: GqlCustomerCartVariant | null;
  quantity?: number | null;
  availableStock?: number | null;
  subTotal?: GqlMoneyAmount | null;
  discountPrice?: GqlMoneyAmount | null;
  total?: GqlMoneyAmount | null;
};

export type GetCustomerCartData = {
  getCustomerCart: GqlCustomerCartRow[] | null;
};

export type GetCustomerCartCountData = {
  getCustomerCartCount: number | null;
};

export type GqlCustomerSavedCard = {
  uuid: string;
  tokenId: string;
  cardBrand?: string | null;
  last4?: number | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  isActive?: boolean | null;
  isDefault?: boolean | null;
  customer?: {
    uuid?: string | null;
    fullName?: string | null;
  } | null;
};

export type GetCustomerSavedCardsData = {
  getCustomerSavedCards: GqlCustomerSavedCard[] | null;
};

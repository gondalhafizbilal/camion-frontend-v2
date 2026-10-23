import type {
  ProductSearchSort,
  ProductPopularSort,
} from "../constants/productSearchSort";

/**
 * Product catalog GraphQL documents (shared field set for consistent typing).
 * Add new operations here; keep fragments in sync with {@link GqlProduct} in `types/product.ts`.
 */

/** Shared product fields for `getProduct` (variants + images). `reviews` are selected only in {@link GET_PRODUCT}. */
const productFields = `
  uuid
  slug
  title(language: $language)
  brief(language: $language)
  description(language: $language)
  featuredImageUrl
  featuredThumbnailUrl
  sizechartUrl
  stockCount
  status
  salesCount
  likesCount
  reviewsCount
  ratingAvg
  ratingOneStarCount
  ratingTwoStarCount
  ratingThreeStarCount
  ratingFourStarCount
  ratingFiveStarCount
  productCategories {
    category {
      uuid
      slug
      name(language: $language)
    }
  }
  options {
    uuid
    name(language: $language)
    position
    values {
      uuid
      value(language: $language)
      position
    }
  }
  variants {
    uuid
    title(language: $language)
    sku
    barcode
    price(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    discountedPrice(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    weight {
      amount
      unit
    }
    dimensions {
      width
      height
      length
      unit
    }
    optionValues {
      optionValue {
        uuid
      }
    }
    images {
      uuid
      imageUrl
      thumbnailUrl
      alt
      isFeatured
      position
    }
  }
  campaign {
    uuid
    name(language: $language)
    brief(language: $language)
    slug
    discountPercentage
    startsAt
    finishesAt
  }
  attachments {
    uuid
    mediaUrl
    mediaType
  }
`;

/** Single product: {@link productFields} plus `reviews`. */
export const GET_PRODUCT = `
query GetProduct($slug: String, $language: String, $currency: String) {
  getProduct(slug: $slug, language: $language, currency: $currency) {
${productFields}
    reviews {
      uuid
      rating
      comment
      customer {
        uuid
        fullName
      }
      images {
        uuid
        thumbnailUrl
        imageUrl
      }
    }
  }
}
`.trim();

export type GetBundlesForProductVariables = {
  productUUID: string;
  currency: string;
  countryCode?: string | null;
  language: string;
};

export const GET_BUNDLES_FOR_PRODUCT = `
query GetBundlesForProduct(
  $productUUID: String!
  $currency: String!
  $countryCode: String
  $language: String!
) {
  getBundlesForProduct(
    productUUID: $productUUID
    currency: $currency
    countryCode: $countryCode
    language: $language
  ) {
    uuid
    slug
    mode
    title(language: $language)
    brief(language: $language)
    discountType
    flatPriceValue
    discountPercentage
    discountAmountValue
    amountCurrencyCode
    isActive
    anchorProductUuid
    sourceCategoryUuids
    autoFillCount
    startsAt
    finishesAt
    items {
      quantity
      product {
        uuid
        slug
        titleEn
        titleAr
        briefEn
        briefAr
        featuredImageUrl
        featuredThumbnailUrl
        status
      }
      variant {
        uuid
        sku
        titleEn
        titleAr
        price {
          amount
          minorAmount
          currencyCode
        }
        discountedPrice {
          amount
          minorAmount
          currencyCode
        }
      }
    }
  }
}
`.trim();

export type AddBundleToCartSelectionItemInput = {
  productUuid: string;
  variantUuid?: string | null;
};

export type AddBundleToCartVariables = {
  bundleUuid: string;
  currency: string;
  countryCode?: string | null;
  items?: AddBundleToCartSelectionItemInput[] | null;
  quantity: number;
};

export const ADD_BUNDLE_TO_CART = `
mutation AddBundleToCart(
  $bundleUuid: String!,
  $currency: String!,
  $countryCode: String,
  $items: [AddBundleToCartSelectionItemInput!],
  $quantity: Int!
) {
  addBundleToCart(
    bundleUuid: $bundleUuid,
    currency: $currency,
    countryCode: $countryCode,
    items: $items,
    quantity: $quantity
  ) {
    uuid
    quantity
    subTotal {
      amount
      currencyCode
    }
    discountPrice {
      amount
      currencyCode
    }
    total {
      amount
      currencyCode
    }
    bundleUuid
    bundleQuantity
    bundleAllocations {
      bundleUuid
      bundleTitle
      quantity
      discountMinor
    }
    product {
      uuid
      slug
    }
    variant {
      uuid
      sku
    }
  }
}
`.trim();

/**
 * `searchProducts` selection set — lean list + optional `campaign`.
 * Omits long text and product-level featured images (variant `images` only).
 */
const searchProductsQueryFields = `
  uuid
  slug
  title(language: $language)
  brief(language: $language)
  salesCount
  likesCount
  reviewsCount
  ratingAvg
  stockCount
  status
  variants {
    uuid
    title(language: $language)
    sku
    price(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    discountedPrice(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    images {
      uuid
      imageUrl
      thumbnailUrl
      alt
      isFeatured
      position
    }
  }
  campaign {
    uuid
    name(language: $language)
    brief(language: $language)
    slug
    discountPercentage
    startsAt
    finishesAt
  }
`;

export const SEARCH_PRODUCTS = `
query SearchProducts($query: String!, $language: String, $currency: String!, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  searchProducts(query: $query, language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${searchProductsQueryFields}
  }
}
`.trim();

/**
 * `getPopularProducts` selection set — descriptions + `status` + optional `campaign`.
 * Omits product-level featured images (variant `images` only).
 */
const popularProductsQueryFields = `
  uuid
  slug
  title(language: $language)
  brief(language: $language)
  description(language: $language)
  descriptionHtml(language: $language)
  salesCount
  likesCount
  reviewsCount
  ratingAvg
  stockCount
  status
  variants {
    uuid
    title(language: $language)
    sku
    price(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    discountedPrice(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    images {
      uuid
      imageUrl
      thumbnailUrl
      alt
      isFeatured
      position
    }
  }
  campaign {
    uuid
    name(language: $language)
    brief(language: $language)
    slug
    discountPercentage
    startsAt
    finishesAt
  }
`;

export const GET_POPULAR_PRODUCTS = `
query GetPopularProducts($language: String, $currency: String!, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getPopularProducts(language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${popularProductsQueryFields}
  }
}
`.trim();

/**
 * Shared selection set for recommended / related / recently viewed products —
 * includes fake urgency `stockCount`.
 */
const recommendedProductsQueryFields = `
  uuid
  slug
  title(language: $language)
  brief(language: $language)
  description(language: $language)
  descriptionHtml(language: $language)
  salesCount
  likesCount
  reviewsCount
  ratingAvg
  stockCount
  status
  variants {
    uuid
    title(language: $language)
    sku
    price(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    discountedPrice(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    images {
      uuid
      imageUrl
      thumbnailUrl
      alt
      isFeatured
      position
    }
  }
  campaign {
    uuid
    name(language: $language)
    brief(language: $language)
    slug
    discountPercentage
    startsAt
    finishesAt
  }
`;

export const GET_RECOMMENDED_PRODUCTS = `
query GetRecommendedProducts($slug: String!, $language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getRecommendedProducts(slug: $slug, language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${recommendedProductsQueryFields}
  }
}
`.trim();

export const GET_RELATED_PRODUCTS = `
query GetRelatedProducts($slug: String!, $language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getRelatedProducts(slug: $slug, language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${recommendedProductsQueryFields}
  }
}
`.trim();

/**
 * `getFeaturedProducts` selection set — description + variant `images` + optional `campaign`.
 * Omits `descriptionHtml` and product-level featured images.
 */
const featuredProductsQueryFields = `
  uuid
  slug
  title(language: $language)
  brief(language: $language)
  description(language: $language)
  salesCount
  likesCount
  reviewsCount
  ratingAvg
  stockCount
  variants {
    uuid
    title(language: $language)
    sku
    price(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    discountedPrice(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    images {
      uuid
      imageUrl
      thumbnailUrl
      alt
      isFeatured
      position
    }
  }
  campaign {
    uuid
    name(language: $language)
    brief(language: $language)
    slug
    discountPercentage
    startsAt
    finishesAt
  }
`;

export const GET_FEATURED_PRODUCTS = `
query GetFeaturedProducts($language: String, $sort: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getFeaturedProducts(language: $language, sort: $sort, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${featuredProductsQueryFields}
  }
}
`.trim();

export const GET_RECENTLY_VIEWED_PRODUCTS = `
query GetRecentlyViewedProducts($language: String, $currency: String!, $pageNumber: Int, $itemsPerPage: Int) {
  getRecentlyViewedProducts(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${recommendedProductsQueryFields}
  }
}
`.trim();

/** `getProductsByCategory` — descriptions + variant `images` + optional `campaign`. */
const categoryProductsQueryFields = `
  uuid
  slug
  title(language: $language)
  brief(language: $language)
  description(language: $language)
  descriptionHtml(language: $language)
  salesCount
  likesCount
  reviewsCount
  ratingAvg
  stockCount
  variants {
    uuid
    title(language: $language)
    sku
    price(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    discountedPrice(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    images {
      uuid
      imageUrl
      thumbnailUrl
      alt
      isFeatured
      position
    }
  }
  campaign {
    uuid
    name(language: $language)
    brief(language: $language)
    slug
    discountPercentage
    startsAt
    finishesAt
  }
`;

/**
 * `getProducts` selection set — lean catalog list + `status` + optional `campaign`.
 * Omits brief, descriptions, and product-level featured images.
 */
const catalogProductsQueryFields = `
  uuid
  slug
  title(language: $language)
  salesCount
  likesCount
  reviewsCount
  ratingAvg
  stockCount
  status
  variants {
    uuid
    title(language: $language)
    sku
    price(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    discountedPrice(currency: $currency) {
      amount
      minorAmount
      currencyCode
    }
    images {
      uuid
      imageUrl
      thumbnailUrl
      alt
      isFeatured
      position
    }
  }
  campaign {
    uuid
    name(language: $language)
    brief(language: $language)
    slug
    discountPercentage
    startsAt
    finishesAt
  }
`;

export const GET_PRODUCTS = `
query GetProducts($language: String, $currency: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getProducts(language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${catalogProductsQueryFields}
  }
}
`.trim();

export const GET_PRODUCTS_IN_FEATURED_CAMPAIGN = `
query GetProductsInFeaturedCampaign($language: String, $currency: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getProductsInFeaturedCampaign(language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${catalogProductsQueryFields}
  }
}
`.trim();

export const GET_PRODUCTS_BY_CATEGORY = `
query GetProductsByCategory($slug: String!, $language: String, $currency: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getProductsByCategory(slug: $slug, language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${categoryProductsQueryFields}
  }
}
`.trim();

export const GET_PRODUCTS_BY_CATEGORIES = `
query GetProductsByCategories($slugs: [String!]!, $language: String, $currency: String, $sort: String, $pageNumber: Int, $itemsPerPage: Int) {
  getProductsByCategories(slugs: $slugs, language: $language, currency: $currency, sort: $sort, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${categoryProductsQueryFields}
  }
}
`.trim();

export type SearchProductsVariables = {
  query: string;
  language?: string | null;
  currency: string;
  /** e.g. {@link ProductSearchSort} / `PRODUCT_SEARCH_SORT` — `fetchSearchProducts` defaults to best match when omitted. */
  sort?: ProductSearchSort | string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export type GetPopularProductsVariables = {
  language?: string | null;
  currency: string;
  /** {@link ProductPopularSort} — defaults to `most-viewed` in `fetchPopularProducts`. */
  sort?: ProductPopularSort | string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

export type GetRecommendedProductsVariables = {
  slug: string;
  language?: string | null;
  currency: string;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

/** Same variables as {@link GetRecommendedProductsVariables} (slug + locale + currency + pagination). */
export type GetRelatedProductsVariables = GetRecommendedProductsVariables;

/** Same shape as {@link GetProductsVariables} (locale + currency + optional sort + pagination). */
export type GetFeaturedProductsVariables = {
  language?: string | null;
  currency: string;
  sort?: ProductSearchSort | string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

/** Same shape as {@link GetPopularProductsVariables}. */
export type GetRecentlyViewedProductsVariables = GetPopularProductsVariables;

export type GetProductVariables = {
  slug?: string | null;
  language?: string | null;
  currency?: string | null;
};

/** `pageNumber` / `itemsPerPage` default to 1 / 5 in `fetchProductsByCategory`. */
export type GetProductsByCategoryVariables = {
  slug: string;
  language?: string | null;
  currency?: string | null;
  sort?: ProductSearchSort | string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

/** Same as {@link GetProductsByCategoryVariables} but with multiple category slugs. */
export type GetProductsByCategoriesVariables = {
  slugs: string[];
  language?: string | null;
  currency?: string | null;
  sort?: ProductSearchSort | string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

/** `pageNumber` / `itemsPerPage` default to 1 / 5 in `fetchProducts`. */
export type GetProductsVariables = {
  language?: string | null;
  currency?: string | null;
  sort?: ProductSearchSort | string | null;
  pageNumber?: number | null;
  itemsPerPage?: number | null;
};

/** Same shape as {@link GetProductsVariables}. */
export type GetProductsInFeaturedCampaignVariables = GetProductsVariables;

/**
 * Home page aggregation query.
 *
 * Goal: one upstream GraphQL round-trip for the SSR Home payload.
 * Uses aliases so the response matches the Home shape directly.
 */

/** Stories disabled site-wide — see {@link STORIES_ENABLED}. Restore in `GET_HOME_PAGE` when re-enabling. */

/**
 * Minimal list fields for home carousels (SSR). Omits long text/HTML to cut upstream DB work.
 */
const homeProductListFieldsLite = `
  uuid
  slug
  title(language: $language)
  featuredImageUrl
  featuredThumbnailUrl
  likesCount
  reviewsCount
  ratingAvg
  variants {
    uuid
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

export const GET_HOME_PAGE = `
query HomePage(
  $language: String
  $currency: String!

  $popularPageNumber: Int
  $popularItemsPerPage: Int
  $popularSort: String

  $featuredPageNumber: Int
  $featuredItemsPerPage: Int

  $featuredCampaignPageNumber: Int
  $featuredCampaignItemsPerPage: Int
  $featuredCampaignSort: String
) {
  popularProducts: getPopularProducts(
    language: $language
    currency: $currency
    sort: $popularSort
    pageNumber: $popularPageNumber
    itemsPerPage: $popularItemsPerPage
  ) {
${homeProductListFieldsLite}
  }

  featuredProducts: getFeaturedProducts(
    language: $language
    currency: $currency
    pageNumber: $featuredPageNumber
    itemsPerPage: $featuredItemsPerPage
  ) {
${homeProductListFieldsLite}
  }

  featuredCampaignProducts: getProductsInFeaturedCampaign(
    language: $language
    currency: $currency
    sort: $featuredCampaignSort
    pageNumber: $featuredCampaignPageNumber
    itemsPerPage: $featuredCampaignItemsPerPage
  ) {
${homeProductListFieldsLite}
  }
}
`.trim();

export type HomePageVariables = {
  language?: string | null;
  currency: string;

  storiesPageNumber?: number | null;
  storiesItemsPerPage?: number | null;

  popularPageNumber?: number | null;
  popularItemsPerPage?: number | null;
  popularSort?: string | null;

  featuredPageNumber?: number | null;
  featuredItemsPerPage?: number | null;

  featuredCampaignPageNumber?: number | null;
  featuredCampaignItemsPerPage?: number | null;
  featuredCampaignSort?: string | null;
};


import type { GqlProduct, GqlProductBundle } from "./product";
import type { GqlPromo } from "./promo";
import type { GqlCustomerOrder } from "./order";
import type { GqlOrderTrackingStage } from "./orderTracking";
import type {
  GqlCurrentCustomerOrderPreview,
  GqlCurrentCustomerOrderPreviewV2,
} from "./orderPreview";
import type { GqlReturnRequest } from "./returnRequest";
import type { GqlPost } from "./post";

export type SearchProductsData = {
  searchProducts: GqlProduct[];
};

export type GetPopularProductsData = {
  getPopularProducts: GqlProduct[];
};

export type GetRecommendedProductsData = {
  getRecommendedProducts: GqlProduct[];
};

export type GetRelatedProductsData = {
  getRelatedProducts: GqlProduct[];
};

export type GetFeaturedProductsData = {
  getFeaturedProducts: GqlProduct[];
};

export type GetRecentlyViewedProductsData = {
  getRecentlyViewedProducts: GqlProduct[];
};

export type GetProductData = {
  getProduct: GqlProduct | null;
};

export type GetBundlesForProductData = {
  getBundlesForProduct: GqlProductBundle[];
};

export type AddBundleToCartData = {
  addBundleToCart: {
    uuid?: string | null;
    quantity?: number | string | null;
    subTotal?: {
      amount?: number | string | null;
      currencyCode?: string | null;
    } | null;
    discountPrice?: {
      amount?: number | string | null;
      currencyCode?: string | null;
    } | null;
    total?: {
      amount?: number | string | null;
      currencyCode?: string | null;
    } | null;
    bundleUuid?: string | null;
    bundleQuantity?: number | string | null;
    bundleAllocations?: Array<{
      bundleUuid?: string | null;
      bundleTitle?: string | null;
      quantity?: number | string | null;
      discountMinor?: number | string | null;
    }> | null;
    product?: {
      uuid?: string | null;
      slug?: string | null;
    } | null;
    variant?: {
      uuid?: string | null;
      sku?: string | null;
    } | null;
  } | null;
};

export type GetProductsByCategoryData = {
  getProductsByCategory: GqlProduct[];
};

export type GetProductsByCategoriesData = {
  getProductsByCategories: GqlProduct[];
};

export type GetProductsData = {
  getProducts: GqlProduct[];
};

export type GetProductsInFeaturedCampaignData = {
  getProductsInFeaturedCampaign: GqlProduct[];
};

export type GetPromosData = {
  getPromos: GqlPromo[];
};

export type GetCurrentCustomerOrdersData = {
  getCurrentCustomerOrders: GqlCustomerOrder[];
};

export type GetCurrentCustomerOrderData = {
  getCurrentCustomerOrder: GqlCustomerOrder | null;
};

export type GetOrderTrackingData = {
  getOrderTracking: GqlOrderTrackingStage[];
};

export type GetCurrentCustomerOrderPreviewData = {
  getCurrentCustomerOrderPreview: GqlCurrentCustomerOrderPreview | null;
};

export type GetCurrentCustomerOrderPreviewV2Data = {
  getCurrentCustomerOrderPreviewV2: GqlCurrentCustomerOrderPreviewV2 | null;
};

export type GetCurrentCustomerReturnRequestsData = {
  getCurrentCustomerReturnRequests: GqlReturnRequest[];
};

export type GetCurrentCustomerReturnRequestData = {
  getCurrentCustomerReturnRequest: GqlReturnRequest | null;
};

export type GetPostsData = {
  getPosts: GqlPost[];
};

export type GetPostData = {
  getPost: GqlPost | null;
};

import {
  buildFacebookCommerceParams,
  type FacebookCommerceParams,
  type FacebookProductPrices,
  type FacebookProductVariation,
} from "./facebookProductCommerce";

export type TikTokContentItem = {
  content_id: string;
  content_type: "product";
  content_name: string;
  content_category?: string;
  quantity: number;
  price: number;
};

export type TikTokCommerceParams = {
  contents: TikTokContentItem[];
  value: number;
  currency: string;
};

/** Maps Meta-shaped commerce params to TikTok Pixel `contents` format. */
export function facebookCommerceToTikTok(
  params: FacebookCommerceParams,
): TikTokCommerceParams {
  return {
    contents: params.contents.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: params.content_name,
      ...(params.content_category
        ? { content_category: params.content_category }
        : {}),
      quantity: item.quantity,
      price: item.item_price,
    })),
    value: params.value,
    currency: params.currency,
  };
}

type BuildTikTokCommerceOptions = {
  contentId: string;
  contentName?: string;
  contentCategory?: string;
  prices?: FacebookProductPrices;
  variations?: FacebookProductVariation[];
  variantUuid?: string | null;
  quantity?: number;
  currency?: string;
};

export function buildTikTokCommerceParams(
  options: BuildTikTokCommerceOptions,
): TikTokCommerceParams | null {
  const fb = buildFacebookCommerceParams(options);
  if (!fb) return null;
  return facebookCommerceToTikTok(fb);
}

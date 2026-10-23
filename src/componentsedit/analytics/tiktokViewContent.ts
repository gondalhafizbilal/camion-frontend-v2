import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import {
  buildTikTokCommerceParams,
  type TikTokCommerceParams,
} from "./tiktokProductCommerce";
import type {
  FacebookProductPrices,
  FacebookProductVariation,
} from "./facebookProductCommerce";

export type TikTokViewContentParams = TikTokCommerceParams;

export function buildTikTokViewContentParams(
  product: ProductDetailsCenterProduct,
  variantUuid?: string | null,
): TikTokViewContentParams | null {
  const contentId = String(product.productUuid ?? product.id ?? "").trim();
  const contentName = String(product.name ?? "").trim();
  if (!contentId || !contentName) return null;

  const variations = Array.isArray(product.variations)
    ? (product.variations as FacebookProductVariation[])
    : undefined;
  const prices = product.prices as FacebookProductPrices | undefined;

  return buildTikTokCommerceParams({
    contentId,
    contentName,
    contentCategory: String(product.categories?.[0]?.name ?? "").trim() || undefined,
    prices,
    variations,
    variantUuid,
    quantity: 1,
    currency: String(prices?.currency_code ?? "QAR"),
  });
}

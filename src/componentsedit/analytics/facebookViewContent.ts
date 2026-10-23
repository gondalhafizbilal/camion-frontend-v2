import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import {
  buildFacebookCommerceParams,
  type FacebookCommerceParams,
  type FacebookProductPrices,
  type FacebookProductVariation,
} from "./facebookProductCommerce";

export type FacebookViewContentParams = FacebookCommerceParams;

/** Maps PDP product data to Meta ViewContent parameters. */
export function buildFacebookViewContentParams(
  product: ProductDetailsCenterProduct,
  variantUuid?: string | null,
): FacebookViewContentParams | null {
  const contentId = String(product.productUuid ?? product.id ?? "").trim();
  const contentName = String(product.name ?? "").trim();
  if (!contentId || !contentName) return null;

  const variations = Array.isArray(product.variations)
    ? (product.variations as FacebookProductVariation[])
    : undefined;
  const prices = product.prices as FacebookProductPrices | undefined;

  return buildFacebookCommerceParams({
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

export function trackFacebookViewContent(
  params: FacebookViewContentParams,
): void {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "ViewContent", params);
}

import type { CartProductRef } from "@/services/cart/cartItemsApi";
import { resolveV1CartIdentifiers } from "@/services/cart/cartItemsApi";
import { runWhenFacebookPixelReady } from "./facebookPixelClient";
import {
  buildFacebookCommerceParams,
  type FacebookCommerceParams,
} from "./facebookProductCommerce";

export type FacebookAddToCartParams = FacebookCommerceParams;

export function buildFacebookAddToCartParams(
  options: Parameters<typeof buildFacebookCommerceParams>[0],
): FacebookAddToCartParams | null {
  return buildFacebookCommerceParams(options);
}

export function trackFacebookAddToCart(params: FacebookAddToCartParams): void {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "AddToCart", params);
}

/** Fires AddToCart after a successful cart mutation (central cart path). */
export function trackFacebookAddToCartFromCartRef(
  product: CartProductRef,
  quantity: number,
  currency?: string,
): void {
  const ids = resolveV1CartIdentifiers(product);
  if (!ids) return;

  const params = buildFacebookAddToCartParams({
    contentId: ids.productUuid,
    contentName: product.name,
    contentCategory: product.contentCategory,
    prices: product.prices,
    variantUuid: ids.variantUuid,
    quantity,
    currency,
  });
  if (!params) return;

  runWhenFacebookPixelReady(() => {
    trackFacebookAddToCart(params);
  });
}

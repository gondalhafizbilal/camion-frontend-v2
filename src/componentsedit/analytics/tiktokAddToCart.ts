import type { CartProductRef } from "@/services/cart/cartItemsApi";
import { resolveV1CartIdentifiers } from "@/services/cart/cartItemsApi";
import { buildTikTokCommerceParams } from "./tiktokProductCommerce";
import { runTikTokCommerceEvent } from "./tiktokTrack";

/** Fires TikTok AddToCart after a successful cart mutation. */
export function trackTikTokAddToCartFromCartRef(
  product: CartProductRef,
  quantity: number,
  currency?: string,
): void {
  const ids = resolveV1CartIdentifiers(product);
  if (!ids) return;

  const params = buildTikTokCommerceParams({
    contentId: ids.productUuid,
    contentName: product.name,
    contentCategory: product.contentCategory,
    prices: product.prices,
    variantUuid: ids.variantUuid,
    quantity,
    currency,
  });
  if (!params) return;

  runTikTokCommerceEvent("AddToCart", params);
}

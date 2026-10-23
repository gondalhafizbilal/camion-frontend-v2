import {
  getCheckoutLineSubTotal,
  summarizeCheckoutCart,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";
import type { TikTokCommerceParams, TikTokContentItem } from "./tiktokProductCommerce";
import { runTikTokCommerceEvent } from "./tiktokTrack";

export type TikTokInitiateCheckoutParams = TikTokCommerceParams;

function cartLineContentId(line: CheckoutCartLine): string {
  return String(
    line.productId ?? line.product_id ?? line.variantUuid ?? line.id ?? "",
  ).trim();
}

function cartLineToTikTokContent(
  line: CheckoutCartLine,
): TikTokContentItem | null {
  const content_id = cartLineContentId(line);
  if (!content_id) return null;

  const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
  const lineSubtotal = getCheckoutLineSubTotal(line);
  const price = quantity > 0 ? lineSubtotal / quantity : lineSubtotal;
  const content_name = String(line.title ?? line.name ?? content_id).trim();

  return {
    content_id,
    content_type: "product",
    content_name: content_name || content_id,
    quantity,
    price,
  };
}

export function buildTikTokInitiateCheckoutParams(
  cart: CheckoutCartLine[],
  currency?: string,
): TikTokInitiateCheckoutParams | null {
  if (!cart.length) return null;

  const contents = cart
    .map(cartLineToTikTokContent)
    .filter((entry): entry is TikTokContentItem => entry != null);
  if (!contents.length) return null;

  const { cart_total } = summarizeCheckoutCart(cart);
  const value =
    cart_total != null && Number.isFinite(cart_total)
      ? cart_total
      : contents.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cur = String(currency ?? "QAR").trim().toUpperCase() || "QAR";

  return { contents, value, currency: cur };
}

export function trackTikTokInitiateCheckout(
  params: TikTokInitiateCheckoutParams,
): void {
  runTikTokCommerceEvent("InitiateCheckout", params);
}

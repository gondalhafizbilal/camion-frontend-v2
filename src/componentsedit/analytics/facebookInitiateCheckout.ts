import { runWhenFacebookPixelReady } from "./facebookPixelClient";
import {
  getCheckoutLineSubTotal,
  summarizeCheckoutCart,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";

export type FacebookInitiateCheckoutParams = {
  content_ids: string[];
  content_type: "product";
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  value: number;
  currency: string;
  num_items: number;
};

function cartLineContentId(line: CheckoutCartLine): string {
  return String(
    line.productId ?? line.product_id ?? line.variantUuid ?? line.id ?? "",
  ).trim();
}

function cartLineToContentEntry(
  line: CheckoutCartLine,
): FacebookInitiateCheckoutParams["contents"][number] | null {
  const id = cartLineContentId(line);
  if (!id) return null;

  const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
  const lineSubtotal = getCheckoutLineSubTotal(line);
  const item_price =
    quantity > 0 ? lineSubtotal / quantity : lineSubtotal;

  return { id, quantity, item_price };
}

/** Builds Meta InitiateCheckout payload from checkout cart lines. */
export function buildFacebookInitiateCheckoutParams(
  cart: CheckoutCartLine[],
  currency?: string,
): FacebookInitiateCheckoutParams | null {
  if (!cart.length) return null;

  const contents = cart
    .map(cartLineToContentEntry)
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  if (!contents.length) return null;

  const content_ids = [...new Set(contents.map((c) => c.id))];
  const num_items = contents.reduce((sum, c) => sum + c.quantity, 0);
  const { cart_total } = summarizeCheckoutCart(cart);
  const value =
    cart_total != null && Number.isFinite(cart_total)
      ? cart_total
      : contents.reduce((sum, c) => sum + c.item_price * c.quantity, 0);
  const cur = String(currency ?? "QAR").trim().toUpperCase() || "QAR";

  return {
    content_ids,
    content_type: "product",
    contents,
    value,
    currency: cur,
    num_items,
  };
}

export function trackFacebookInitiateCheckout(
  params: FacebookInitiateCheckoutParams,
): void {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "InitiateCheckout", params);
}

export function trackFacebookInitiateCheckoutFromCart(
  cart: CheckoutCartLine[],
  currency?: string,
): void {
  const params = buildFacebookInitiateCheckoutParams(cart, currency);
  if (!params) return;

  runWhenFacebookPixelReady(() => {
    trackFacebookInitiateCheckout(params);
  });
}

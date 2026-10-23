import {
  getCheckoutLineSubTotal,
  type CartSummaryShape,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";

/** Placeholder image (always present in Next apps). */
const PLACEHOLDER_IMG = "/assets/icons/logo-light.svg";

/**
 * Static cart rows for cart/checkout screens when backend cart APIs are disconnected.
 * Keeps existing layouts populated; replace with API data when integration returns.
 */
export const DISCONNECTED_CHECKOUT_LINES: CheckoutCartLine[] = [
  {
    productId: "__local_cart_1",
    title: "Classic cotton t-shirt",
    price: 45,
    quantity: 1,
    image: PLACEHOLDER_IMG,
    category_name: "Apparel",
    slug: "shop",
  },
  {
    productId: "__local_cart_2",
    title: "Stainless travel bottle",
    price: 32.5,
    quantity: 2,
    image: PLACEHOLDER_IMG,
    category_name: "Accessories",
    slug: "shop",
  },
];

export function disconnectedCartSummary(
  lines: CheckoutCartLine[],
  shippingTotal?: number | null,
  discount = 0,
): CartSummaryShape {
  const cart_total = lines.reduce(
    (acc, item) => acc + getCheckoutLineSubTotal(item),
    0,
  );
  const shippingKnown =
    shippingTotal != null && Number.isFinite(Number(shippingTotal));
  const shipping_total = shippingKnown ? Number(shippingTotal) || 0 : undefined;
  const grand_total = shippingKnown
    ? cart_total - discount + (shipping_total ?? 0)
    : cart_total - discount;
  return { cart_total, discount, shipping_total, grand_total };
}

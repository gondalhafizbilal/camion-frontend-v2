/**
 * Loose shapes for cart/checkout/order UI (API-backed, varied payloads).
 */

import type { CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";

export type CheckoutCartLine = {
  id?: string | number;
  key?: string;
  image?: string;
  thumbnail?: string;
  title?: string;
  name?: string;
  category_name?: string;
  categories?: Array<{ name?: string }>;
  attributes?: Array<{
    name?: string;
    attribute?: string;
    value?: string;
  }>;
  size?: string;
  colour?: string;
  color?: string;
  price?: string | number;
  /** Line subtotal from cart API `subTotal.amount`. */
  subTotal?: number;
  /** Line discount from cart API `discountPrice.amount`. */
  discountPrice?: number;
  /** Line total from cart API `total.amount`. */
  total?: number;
  quantity?: number;
  slug?: string;
  product_slug?: string;
  productId?: string | number;
  product_id?: string | number;
  /** Catalog variant UUID (v1 cart-items). */
  variantUuid?: string;
  /** Cart line UUID from `v1/cart-items` / order preview (`POST v1/orders`). */
  cartItemUuid?: string;
  /** Active campaign from `getCustomerCart.product.campaign`. */
  campaign?: CarouselProductCampaign | null;
  /** Discount badge percent (variant sale or campaign). */
  discountPercentage?: number;
  prices?: {
    regular_price?: string | number;
    sale_price?: string | number;
    price?: string | number;
    currency_code?: string;
  };
  [key: string]: unknown;
};

export function getCheckoutLineCampaign(
  line: CheckoutCartLine,
): CarouselProductCampaign | null {
  const campaign = line.campaign;
  if (!campaign || typeof campaign !== "object") return null;
  if (!campaign.uuid && !campaign.name?.trim() && !campaign.slug?.trim()) return null;
  return campaign;
}

export function getCheckoutLineDiscountPercentage(line: CheckoutCartLine): number {
  const direct = Number(line.discountPercentage);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const campaignPct = Number(getCheckoutLineCampaign(line)?.discountPercentage);
  if (Number.isFinite(campaignPct) && campaignPct > 0) return Math.round(campaignPct);
  const regular = Number(line.prices?.regular_price ?? NaN);
  const sale = Number(line.prices?.sale_price ?? NaN);
  if (
    Number.isFinite(regular) &&
    Number.isFinite(sale) &&
    regular > 0 &&
    sale > 0 &&
    sale < regular
  ) {
    return Math.round((1 - sale / regular) * 100);
  }
  return 0;
}

export function getCheckoutLineUnitPrices(line: CheckoutCartLine): {
  unit: number;
  regular: number;
  onSale: boolean;
} {
  const regular = Number(line.prices?.regular_price ?? line.price ?? 0) || 0;
  const saleRaw = Number(line.prices?.sale_price ?? NaN);
  const unit = Number(line.price ?? regular) || 0;
  const hasSale = Number.isFinite(saleRaw) && saleRaw > 0 && saleRaw < regular;
  return {
    unit: hasSale ? saleRaw : unit,
    regular,
    onSale: hasSale || (regular > 0 && unit > 0 && unit < regular),
  };
}

export type CheckoutLineDisplayOption = {
  label: string;
  value: string;
};

/** Variant options for cart/checkout line rows (same rules as cart page). */
export function getCheckoutLineDisplayOptions(
  item: CheckoutCartLine,
  fallbackLabels?: { size: string; colours: string },
): CheckoutLineDisplayOption[] {
  const size =
    item.attributes?.find(
      (a) =>
        a?.name?.toLowerCase() === "size" || a?.attribute?.toLowerCase() === "pa_size",
    )?.value ||
    item.size ||
    "";
  const colour =
    item.attributes?.find(
      (a) =>
        a?.name?.toLowerCase() === "colour" || a?.attribute?.toLowerCase() === "pa_color",
    )?.value ||
    item.colour ||
    item.color ||
    "";
  const optionAttributes =
    item.attributes
      ?.map((attr) => {
        const label = String(attr?.name || attr?.attribute || "").trim();
        const value = String(attr?.value || "").trim();
        if (!label || !value) return null;
        return { label, value };
      })
      .filter((option): option is CheckoutLineDisplayOption => Boolean(option)) ?? [];

  if (optionAttributes.length > 0) return optionAttributes;

  return [
    size && fallbackLabels?.size
      ? { label: fallbackLabels.size, value: String(size) }
      : null,
    colour && fallbackLabels?.colours
      ? { label: fallbackLabels.colours, value: String(colour) }
      : null,
  ].filter((option): option is CheckoutLineDisplayOption => Boolean(option));
}

function safeMoneyAmount(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Resolves line subtotal: API `subTotal` when set, else unit price × quantity. */
export function getCheckoutLineSubTotal(line: CheckoutCartLine): number {
  const fromApi = safeMoneyAmount(line.subTotal);
  if (fromApi != null) return fromApi;
  const unit = parseFloat(String(line.price ?? 0)) || 0;
  const qty = Number(line.quantity) || 0;
  return unit * qty;
}

/** Resolves line total: API `total` when set, else line subtotal. */
export function getCheckoutLineTotal(line: CheckoutCartLine): number {
  const fromApi = safeMoneyAmount(line.total);
  if (fromApi != null) return fromApi;
  return getCheckoutLineSubTotal(line);
}

/** Order summary from cart API line money fields (`subTotal`, `discountPrice`, `total`). */
export function summarizeCheckoutCart(lines: CheckoutCartLine[]): CartSummaryShape {
  let cartSubtotal = 0;
  let discount = 0;
  let grandTotal = 0;
  let hasLineDiscount = false;
  let hasLineTotal = false;

  for (const line of lines) {
    const sub = safeMoneyAmount(line.subTotal);
    if (sub != null) {
      cartSubtotal += sub;
    } else {
      cartSubtotal += getCheckoutLineSubTotal(line);
    }

    const disc = safeMoneyAmount(line.discountPrice);
    if (disc != null) {
      discount += disc;
      hasLineDiscount = true;
    }

    const tot = safeMoneyAmount(line.total);
    if (tot != null) {
      grandTotal += tot;
      hasLineTotal = true;
    }
  }

  if (!hasLineTotal) {
    grandTotal = Math.max(0, cartSubtotal - (hasLineDiscount ? discount : 0));
  }

  return {
    cart_total: cartSubtotal,
    discount: hasLineDiscount ? discount : 0,
    shipping_total: undefined,
    grand_total: grandTotal,
  };
}

export type CartSummaryShape = {
  cart_total?: number;
  discount?: number;
  shipping_total?: number;
  grand_total?: number;
  [key: string]: unknown;
};

export type OrderDetailLine = {
  id?: string | number;
  categoryName?: string;
  category?: string;
  title?: string;
  name?: string;
  variation?: Array<{ attribute?: string; value?: string }>;
  price?: string | number;
  quantity?: number;
  image?: string;
  productUuid?: string;
  [key: string]: unknown;
};

export type OrderDetailShape = {
  items?: OrderDetailLine[];
  discount?: string | number;
  grandTotal?: string | number;
  isPaid?: boolean;
  skipCashPaymentUrl?: string;
  customer_data?: {
    shipping_option?: { cost?: string | number };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type AddressDraft = {
  /** Personal Information — single full name (syncs to first_name / last_name for legacy). */
  contactFullName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  /** Personal/contact phone (national digits; paired with page-level country code combobox). */
  phone?: string;
  /** Matches customer address API / accounts form. */
  fullName?: string;
  countryCode?: string;
  /** National number for shipping phone (API body field `phoneNumber`). */
  phoneLocal?: string;
  streetAddress?: string;
  apartment?: string;
  zipCode?: string;
  city?: string;
  /** Legacy aliases — prefer `streetAddress` / `zipCode` when present. */
  address_1?: string;
  address_2?: string;
  country?: string;
  state?: string;
  postcode?: string;
  [key: string]: string | undefined;
};

export type OrderReviewData = {
  fullName?: string;
  email?: string;
  phone?: string;
  shippingAddressLine?: string;
  /** Carrier brand (e.g. 4PX). */
  shippingCarrierName?: string;
  /** Transit / destination line from order preview. */
  shippingMethodTransit?: string;
  /** Estimated delivery from order preview `eta`. */
  estimatedDeliveryEta?: string;
  shippingCarrierCost?: string | number;
  /** API payload for place order (e.g. `CARD`). */
  paymentMethod?: string;
  paymentMethodType?: string;
  maskedCardNumber?: string;
  [key: string]: unknown;
};

export type CardDetailsDraft = {
  number?: string;
  name?: string;
  expiry?: string;
  cvv?: string;
  [key: string]: unknown;
};

/** PDP gallery items (matches ProductPhotoGallery filter on `src`) */
export type ProductGalleryImage = {
  src?: string;
  alt?: string;
  thumbnail?: string;
};

/** Category tile on /categories (API-backed) */
export type CategoryNavItem = {
  id?: string | number;
  name?: string;
  slug?: string;
  image?: { thumbnail?: string; src?: string };
  [key: string]: unknown;
};

/** My Orders list row (API-backed) */
export type MyOrdersListItem = {
  id?: string | number;
  wcOrderId?: string | number;
  statusDisplay?: string;
  items?: unknown[];
  grandTotal?: string | number;
  total?: string | number;
  discount?: string | number;
  shippingCost?: string | number;
  createdAt?: string | number;
  [key: string]: unknown;
};

/** First variant specs for PDP detail cards (from GraphQL `getProduct`). */
export type ProductDefaultVariantSpecs = {
  sku?: string;
  barcode?: string;
  weightText?: string;
  dimensionsText?: string;
};

/** PDP center shell — loose API/product shape */
export type ProductDetailsCenterProduct = {
  id?: string | number;
  /** Catalog product UUID from GraphQL `getProduct` (wishlist / cart). */
  productUuid?: string;
  name?: string;
  /** Size chart URL from GraphQL `getProduct` (optional). */
  sizechartUrl?: string | null;
  images?: ProductGalleryImage[];
  /** Product attachments (e.g. PDFs, extra images) surfaced from GraphQL `attachments`. */
  attachments?: ProductGalleryImage[];
  description?: string;
  short_description?: string;
  categories?: Array<{ id?: string | number; slug?: string; name?: string }>;
  defaultVariantSpecs?: ProductDefaultVariantSpecs | null;
  /** Active campaign from `getProduct.campaign` when present. */
  campaign?: CarouselProductCampaign | null;
  [key: string]: unknown;
};

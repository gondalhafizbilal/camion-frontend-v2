import type { CheckoutCartLine } from "@/types/checkoutDisplay";
import { getCheckoutLineSubTotal } from "@/types/checkoutDisplay";
import { pushGtmEvent } from "./gtmDataLayer";

type CommerceRecord = Record<string, unknown>;

type ProductEventOptions = {
  quantity?: number;
  itemValue?: number;
  cartValue?: number;
  currency?: string;
  source?: string;
  threshold?: number | null;
  variantId?: string | number | null;
};

function nonEmpty(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function finiteMoney(value: unknown): number | undefined {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

function firstCategory(product: CommerceRecord): string | undefined {
  const direct = nonEmpty(product.category_name ?? product.category);
  if (direct) return direct;
  const categories = Array.isArray(product.categories) ? product.categories : [];
  const first = categories[0];
  return first && typeof first === "object"
    ? nonEmpty((first as CommerceRecord).name)
    : undefined;
}

function productPrice(product: CommerceRecord): number | undefined {
  const prices =
    product.prices && typeof product.prices === "object"
      ? (product.prices as CommerceRecord)
      : {};
  return finiteMoney(
    prices.price ??
      prices.sale_price ??
      prices.regular_price ??
      product.price,
  );
}

export function pushGtmProductEvent(
  event: string,
  product: CommerceRecord | null | undefined,
  options: ProductEventOptions = {},
): void {
  const item = product ?? {};
  const quantity = Math.max(1, Math.floor(Number(options.quantity) || 1));
  pushGtmEvent(event, {
    product_id: nonEmpty(
      item.productUuid ?? item.product_id ?? item.productId ?? item.uuid,
    ),
    variant_id: nonEmpty(
      options.variantId ?? item.variantUuid ?? item.variant_id ?? item.id,
    ),
    category: firstCategory(item),
    quantity,
    item_value: finiteMoney(options.itemValue) ?? productPrice(item),
    cart_value: finiteMoney(options.cartValue),
    currency: nonEmpty(options.currency),
    threshold: finiteMoney(options.threshold),
    source: nonEmpty(options.source),
  });
}

export function pushGtmCartLineEvent(
  event: string,
  line: CheckoutCartLine,
  options: Pick<ProductEventOptions, "cartValue" | "currency" | "source"> = {},
): void {
  const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
  pushGtmEvent(event, {
    product_id: nonEmpty(line.productId ?? line.product_id),
    variant_id: nonEmpty(line.variantUuid),
    category: firstCategory(line),
    quantity,
    item_value: finiteMoney(line.price),
    cart_value: finiteMoney(options.cartValue),
    currency: nonEmpty(options.currency ?? line.prices?.currency_code),
    source: nonEmpty(options.source),
    value: getCheckoutLineSubTotal(line),
  });
}

export function pushGtmThresholdTransitions({
  previousCartValue,
  nextCartValue,
  minimumOrderThreshold,
  freeShippingThreshold,
  currency,
  source,
}: {
  previousCartValue: number;
  nextCartValue: number;
  minimumOrderThreshold?: number | null;
  freeShippingThreshold?: number | null;
  currency?: string;
  source: string;
}): void {
  const previous = Math.max(0, Number(previousCartValue) || 0);
  const next = Math.max(0, Number(nextCartValue) || 0);
  const minimum = finiteMoney(minimumOrderThreshold);
  const freeShipping = finiteMoney(freeShippingThreshold);

  if (minimum && previous < minimum && next >= minimum) {
    pushGtmEvent("minimum_order_reached", {
      cart_value: next,
      currency: nonEmpty(currency),
      threshold: minimum,
      source,
    });
  }
  if (freeShipping && previous < freeShipping && next >= freeShipping) {
    pushGtmEvent("free_shipping_reached", {
      cart_value: next,
      currency: nonEmpty(currency),
      threshold: freeShipping,
      source,
    });
  }
}

import {
  FOUR_PX_BRAND_NAME,
  getFourPxShippingFromPreview,
} from "@/lib/checkout/fourPxShipping";
import type { CheckoutCartLine, OrderReviewData } from "@/types/checkoutDisplay";
import { getTransformedImageUrl } from "@/lib/images/getTransformedImageUrl";
import {
  coalesceProductImagePair,
  PRODUCT_IMAGE_FALLBACK,
  resolveCartLineImagePair,
} from "@/lib/productImageFallback";
import {
  fetchCurrentCustomerOrderPreview,
  fetchCurrentCustomerOrderPreviewV2,
  gqlMoneyToNumber,
} from "@/services/graphql";
import type {
  GqlOrderPreviewItem,
  GqlOrderPreviewItemV2,
} from "@/services/graphql/types/orderPreview";

type PreviewVariantOptionValues = NonNullable<
  NonNullable<GqlOrderPreviewItem["variant"]>["optionValues"]
>;

type PreviewItemLike = GqlOrderPreviewItem | GqlOrderPreviewItemV2;

function mapPreviewVariantOptionValues(
  rows: PreviewVariantOptionValues | null | undefined,
): NonNullable<OrderPreviewCartLine["variant"]>["optionValues"] {
  if (!rows?.length) return undefined;
  const out: NonNullable<
    NonNullable<OrderPreviewCartLine["variant"]>["optionValues"]
  > = [];
  for (const row of rows) {
    const ov = row?.optionValue;
    if (!ov) continue;
    const name = ov.option?.name ?? undefined;
    out.push({
      optionValue: {
        uuid: ov.uuid ?? undefined,
        value: ov.value ?? undefined,
        position: ov.position ?? undefined,
        ...(ov.option
          ? {
              option: {
                uuid: ov.option.uuid ?? undefined,
                name: name ?? undefined,
                position: ov.option.position ?? undefined,
              },
            }
          : {}),
      },
    });
  }
  return out.length ? out : undefined;
}

export type OrderPreviewAddress = {
  uuid?: string;
  fullName?: string;
  phoneNumber?: string;
  streetAddress?: string;
  apartment?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
  isDefault?: boolean;
};

export type OrderPreviewCartLine = {
  id?: number;
  uuid?: string;
  quantity?: number;
  subTotal?: unknown;
  product?: {
    uuid?: string;
    slug?: string;
    titleEn?: string;
    titleAr?: string;
    briefEn?: string;
    briefAr?: string;
    status?: string;
    featuredImageUrl?: string | null;
    featuredThumbnailUrl?: string | null;
  };
  variant?: {
    uuid?: string;
    titleEn?: string;
    titleAr?: string;
    sku?: string;
    price?: { amount?: number | string; currencyCode?: string } | null;
    cost?: { amount?: number | string; currencyCode?: string } | null;
    images?: Array<{
      uuid?: string;
      imageUrl?: string;
      thumbnailUrl?: string;
      alt?: string;
      isFeatured?: boolean;
      position?: number;
    }> | null;
    optionValues?: Array<{
      optionValue?: {
        uuid?: string;
        value?: string;
        position?: number;
        option?: {
          uuid?: string;
          name?: string;
          position?: number;
        };
      };
    }>;
  };
};

type OrderPreviewVariantImages = NonNullable<OrderPreviewCartLine["variant"]>["images"];

export type OrderPreviewResponse = {
  cart?: OrderPreviewCartLine[];
  address?: OrderPreviewAddress;
  cart_total?: number | string;
  discount?: number | string;
  shipping?: {
    shippingFee?: { amount?: number; currency?: string };
    handlingFee?: { amount?: number; currency?: string };
    transitTime?: {
      minDays?: number;
      maxDays?: number;
      estimatedRange?: string;
    };
    taxesAndFees?: unknown;
    totalShippingCost?: number | string;
    currency?: string;
    country?: string;
    countryCode?: string;
  };
  shippingTotal?: number | string;
  grand_total?: number | string;
  eta?: string;
  orderTotalWarning?: string;
};

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : null;
}

/** One checkout warning string; dedupes when API returns an array (e.g. per cart line). */
export function normalizeOrderTotalWarning(raw: unknown): string | undefined {
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return undefined;
    const lines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const unique = [...new Set(lines)];
    return unique.length ? unique.join("\n") : undefined;
  }
  if (Array.isArray(raw)) {
    const parts = raw
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
    const unique = [...new Set(parts)];
    return unique.length ? unique.join("\n") : undefined;
  }
  return undefined;
}

export type FetchOrderPreviewResult = {
  preview: OrderPreviewResponse | null;
  error: string | null;
};

export type FetchOrderPreviewOptions = {
  currency?: string;
  language?: string;
  couponCode?: string;
  /**
   * When set (non-empty), uses `getCurrentCustomerOrderPreviewV2` for selected cart lines.
   * When omitted / empty, uses full-cart `getCurrentCustomerOrderPreview` (V1).
   */
  cartItemUuids?: string[] | null;
};

function mapPreviewItemsToCartLines(
  items: PreviewItemLike[],
  cartTotal: number | null,
): OrderPreviewCartLine[] {
  return items.map((it) => {
    const product = it.product ?? undefined;
    const variant = it.variant ?? undefined;
    const regularAmount = gqlMoneyToNumber(variant?.price) ?? 0;
    const saleAmountRaw = gqlMoneyToNumber(variant?.discountedPrice) ?? NaN;
    const hasDiscounted =
      Number.isFinite(saleAmountRaw) &&
      saleAmountRaw > 0 &&
      saleAmountRaw < regularAmount;
    const unitAmount = hasDiscounted ? saleAmountRaw : regularAmount;
    const unitCurrency =
      String(
        variant?.discountedPrice?.currencyCode ??
          variant?.price?.currencyCode ??
          "",
      ).trim() || undefined;

    const lineSubTotal = moneyAmountToNumber(
      "subTotal" in it ? it.subTotal : undefined,
    );
    const quantityFromItem =
      typeof it.quantity === "number" && Number.isFinite(it.quantity)
        ? Math.max(1, Math.floor(it.quantity))
        : null;
    // Prefer API quantity (V1/V2). Fall back to subtotal ÷ unit when missing.
    const quantity =
      quantityFromItem ??
      (lineSubTotal != null &&
      Number.isFinite(unitAmount) &&
      unitAmount > 0
        ? Math.max(1, Math.round(lineSubTotal / unitAmount))
        : items.length === 1 &&
            Number.isFinite(unitAmount) &&
            unitAmount > 0 &&
            cartTotal != null
          ? Math.max(1, Math.round(cartTotal / unitAmount))
          : 1);

    const subTotalAmount =
      lineSubTotal != null
        ? lineSubTotal
        : Number.isFinite(unitAmount) && unitAmount >= 0
          ? unitAmount * quantity
          : undefined;
    const subTotalCurrency =
      ("subTotal" in it &&
      it.subTotal &&
      typeof it.subTotal === "object"
        ? String(it.subTotal.currencyCode ?? "").trim()
        : "") || unitCurrency;

    return {
      uuid: it.uuid,
      quantity,
      subTotal:
        subTotalAmount != null
          ? {
              amount: subTotalAmount,
              currencyCode: subTotalCurrency || undefined,
            }
          : undefined,
      product: product
        ? {
            uuid: product.uuid,
            slug: product.slug ?? undefined,
            titleEn: product.title ?? undefined,
            titleAr: product.title ?? undefined,
            briefEn: product.brief ?? undefined,
            briefAr: product.brief ?? undefined,
            status: product.status ?? undefined,
            featuredImageUrl: product.featuredImageUrl ?? undefined,
            featuredThumbnailUrl: product.featuredThumbnailUrl ?? undefined,
          }
        : undefined,
      variant: variant
        ? {
            uuid: variant.uuid,
            titleEn: variant.title ?? undefined,
            titleAr: variant.title ?? undefined,
            sku: variant.sku ?? undefined,
            price: variant.price
              ? {
                  amount: gqlMoneyToNumber(variant.price) ?? undefined,
                  currencyCode: variant.price.currencyCode ?? undefined,
                }
              : null,
            cost: variant.discountedPrice
              ? {
                  amount: gqlMoneyToNumber(variant.discountedPrice) ?? undefined,
                  currencyCode: variant.discountedPrice.currencyCode ?? undefined,
                }
              : null,
            images: variant.images as OrderPreviewVariantImages | null,
            optionValues: mapPreviewVariantOptionValues(variant.optionValues),
          }
        : undefined,
    };
  });
}

/** Order preview via GraphQL; includes API error text when the preview is unavailable. */
export async function fetchOrderPreviewWithError(
  authToken: string,
  opts?: FetchOrderPreviewOptions,
): Promise<FetchOrderPreviewResult> {
  const currency = String(opts?.currency ?? "").trim() || undefined;
  const language = String(opts?.language ?? "").trim() || undefined;
  const couponCode = String(opts?.couponCode ?? "").trim() || undefined;
  const cartItemUuids = (opts?.cartItemUuids ?? [])
    .map((u) => String(u ?? "").trim())
    .filter(Boolean);
  const useSelectedPreview = cartItemUuids.length > 0;
  const errorOut = { value: null as string | null };

  try {
    if (useSelectedPreview) {
      const data = await fetchCurrentCustomerOrderPreviewV2(
        { currency, language, couponCode, cartItemUuids },
        authToken,
        errorOut,
      );
      const preview = data.getCurrentCustomerOrderPreviewV2;
      if (!preview) {
        return { preview: null, error: errorOut.value?.trim() || null };
      }
      const items = Array.isArray(preview.items) ? preview.items : [];
      const cartTotal = moneyAmountToNumber(preview.cart_total) ?? null;
      return {
        preview: {
          cart: mapPreviewItemsToCartLines(items, cartTotal),
          address:
            (preview.shippingAddress as unknown as OrderPreviewAddress) ??
            undefined,
          cart_total: preview.cart_total ?? undefined,
          discount: preview.discount ?? undefined,
          shippingTotal: preview.shippingTotal ?? undefined,
          grand_total: preview.grand_total ?? undefined,
          eta:
            typeof preview.eta === "string" && preview.eta.trim()
              ? preview.eta.trim()
              : undefined,
          orderTotalWarning: normalizeOrderTotalWarning(preview.orderTotalWarning),
        },
        error: null,
      };
    }

    const data = await fetchCurrentCustomerOrderPreview(
      { currency, language, couponCode },
      authToken,
      errorOut,
    );
    const preview = data.getCurrentCustomerOrderPreview;
    if (!preview) {
      return { preview: null, error: errorOut.value?.trim() || null };
    }
    const items = Array.isArray(preview.items) ? preview.items : [];
    const cartTotal = moneyAmountToNumber(preview.cart_total) ?? null;
    return {
      preview: {
        cart: mapPreviewItemsToCartLines(items, cartTotal),
        address:
          (preview.shippingAddress as unknown as OrderPreviewAddress) ?? undefined,
        cart_total: preview.cart_total ?? undefined,
        discount: preview.discount ?? undefined,
        shippingTotal: preview.shippingTotal ?? undefined,
        grand_total: preview.grand_total ?? undefined,
        eta:
          typeof preview.eta === "string" && preview.eta.trim()
            ? preview.eta.trim()
            : undefined,
        orderTotalWarning: normalizeOrderTotalWarning(preview.orderTotalWarning),
      },
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[order-preview] failed to load: ${msg}`);
    return {
      preview: null,
      error: errorOut.value?.trim() || msg.trim() || null,
    };
  }
}

/** Order preview via GraphQL — returns null on failure (no error text). */
export async function fetchOrderPreview(
  authToken: string,
  opts?: FetchOrderPreviewOptions,
): Promise<OrderPreviewResponse | null> {
  const { preview } = await fetchOrderPreviewWithError(authToken, opts);
  return preview;
}

function moneyAmountToNumber(x: unknown): number | null {
  if (x == null) return null;
  if (typeof x === "number") return Number.isFinite(x) ? x : null;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof x === "object") {
    const fromMoney = gqlMoneyToNumber(
      x as {
        amount?: number | string | null;
        minorAmount?: number | string | null;
      },
    );
    if (fromMoney != null) return fromMoney;
  }
  return null;
}

export function formatOrderPreviewAddress(
  addr: OrderPreviewAddress | null | undefined,
): string {
  if (!addr) return "";
  const parts = [
    addr.streetAddress,
    addr.apartment,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

export function mapOrderPreviewCartToCheckoutLines(
  lines: OrderPreviewCartLine[] | undefined,
  locale: string,
): CheckoutCartLine[] {
  if (!Array.isArray(lines) || !lines.length) return [];
  const isAr = locale === "ar";
  const assetsHost =
    process.env.NEXT_PUBLIC_ASSETS_HOST || "https://assets.camiontrading.com";
  return lines.map((line) => {
    const product = line.product;
    const variant = line.variant;
    const title = isAr
      ? (product?.titleAr ?? product?.titleEn ?? "")
      : (product?.titleEn ?? product?.titleAr ?? "");
    const variantTitle = isAr
      ? (variant?.titleAr ?? variant?.titleEn ?? "")
      : (variant?.titleEn ?? variant?.titleAr ?? "");
    const qty = Math.max(1, Number(line.quantity) || 1);
    const subTotalAmount = moneyAmountToNumber(line.subTotal);
    const unitFromSub = subTotalAmount != null ? subTotalAmount / qty : NaN;
    const unit = Number.isFinite(unitFromSub) ? unitFromSub : 0;
    const subTotalCurrency =
      line.subTotal && typeof line.subTotal === "object"
        ? String((line.subTotal as Record<string, unknown>).currencyCode ?? "").trim()
        : "";
    const unitCurrency = subTotalCurrency || undefined;
    const cartItemUuid =
      typeof line.uuid === "string" && line.uuid.trim() ? line.uuid.trim() : undefined;

    const imgs = Array.isArray(variant?.images) ? variant?.images : [];
    const featured =
      imgs.find((x) => x?.isFeatured) ??
      imgs.slice().sort((a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0))[0];
    const rawImgPick = String(featured?.imageUrl ?? featured?.thumbnailUrl ?? "").trim();
    const rawThumbPick = String(featured?.thumbnailUrl ?? featured?.imageUrl ?? "").trim();
    const variantPair = coalesceProductImagePair(rawThumbPick || rawImgPick, rawImgPick || rawThumbPick);
    const resolved = resolveCartLineImagePair({
      featuredThumbnailUrl: product?.featuredThumbnailUrl,
      featuredImageUrl: product?.featuredImageUrl,
      variantPair,
    });
    const rawImg = resolved.src;
    const transformed = rawImg ? getTransformedImageUrl(rawImg, String(assetsHost)) : "";
    const image = transformed || rawImg || PRODUCT_IMAGE_FALLBACK;
    const thumbRaw = resolved.thumb;
    const transformedThumb = thumbRaw
      ? getTransformedImageUrl(thumbRaw, String(assetsHost))
      : "";
    const thumbnail = transformedThumb || thumbRaw || image;

    const row: CheckoutCartLine = {
      id: line.id ?? line.uuid,
      key: line.uuid,
      cartItemUuid,
      slug: product?.slug,
      title,
      name: title,
      price: unit,
      quantity: qty,
      image,
      thumbnail,
      ...(unitCurrency
        ? { prices: { price: unit, currency_code: unitCurrency.toUpperCase() } }
        : {}),
    };
    const optionAttributes =
      variant?.optionValues
        ?.map((row) => {
          const optionValue = row?.optionValue;
          const label = String(optionValue?.option?.name ?? "").trim();
          const value = String(optionValue?.value ?? "").trim();
          if (!label || !value) return null;
          return { name: label, attribute: label, value };
        })
        .filter(
          (option): option is { name: string; attribute: string; value: string } =>
            Boolean(option),
        ) ?? [];
    if (optionAttributes.length > 0) {
      row.attributes = optionAttributes;
    } else if (variantTitle) {
      row.attributes = [{ name: "size", value: variantTitle }];
    }
    return row;
  });
}

export function getOrderPreviewCurrencyCode(
  preview: OrderPreviewResponse | null | undefined,
  fallbackCurrency = "QAR",
): string {
  const fromShipping = String(preview?.shipping?.currency ?? "").trim();
  if (fromShipping) return fromShipping.toUpperCase();
  const first = preview?.cart?.[0];
  const subTotal =
    first?.subTotal && typeof first.subTotal === "object"
      ? String((first.subTotal as Record<string, unknown>).currencyCode ?? "").trim()
      : "";
  if (subTotal) return subTotal.toUpperCase();
  const fromVariant = String(
    first?.variant?.price?.currencyCode ?? first?.variant?.cost?.currencyCode ?? "",
  ).trim();
  if (fromVariant) return fromVariant.toUpperCase();
  const fb = String(fallbackCurrency ?? "").trim();
  return (fb || "QAR").toUpperCase();
}

export function buildOrderReviewDataFromPreview(
  preview: OrderPreviewResponse,
  userEmailFallback: string,
  paymentFromSession: {
    paymentMethod?: string;
    paymentMethodType?: string;
    maskedCardNumber?: string;
  },
  fallbackCurrency = "USD",
): OrderReviewData {
  const addr = preview.address;
  const quote = getFourPxShippingFromPreview(
    preview,
    Number(preview.shippingTotal ?? 0),
    preview.shipping?.currency ?? fallbackCurrency,
  );

  return {
    fullName: addr?.fullName ?? "",
    email: userEmailFallback,
    phone: addr?.phoneNumber ?? "",
    shippingAddressLine: formatOrderPreviewAddress(addr),
    shippingCarrierName: FOUR_PX_BRAND_NAME,
    shippingMethodTransit: quote.transitLine,
    estimatedDeliveryEta:
      typeof preview.eta === "string" && preview.eta.trim()
        ? preview.eta.trim()
        : undefined,
    shippingCarrierCost: quote.fee,
    paymentMethod: paymentFromSession.paymentMethod ?? "CARD",
    paymentMethodType: paymentFromSession.paymentMethodType ?? "mastercard",
    maskedCardNumber: paymentFromSession.maskedCardNumber,
  };
}

/** Optional extra lines for UI (VAT, handling) if present on payload. */
export function extractOrderPreviewMeta(preview: OrderPreviewResponse): {
  previewCurrency?: string;
  vatAmount?: number;
  handlingAmount?: number;
} {
  const shipping = preview.shipping;
  const taxes = asRecord(shipping?.taxesAndFees);
  const vat = taxes ? asRecord(taxes.vat) : null;
  const vatAmount =
    vat && typeof vat.amount === "number"
      ? vat.amount
      : vat && vat.amount != null
        ? Number(vat.amount)
        : undefined;
  const handling = shipping?.handlingFee?.amount;
  return {
    previewCurrency: shipping?.currency,
    vatAmount,
    handlingAmount:
      handling != null && Number.isFinite(Number(handling))
        ? Number(handling)
        : undefined,
  };
}

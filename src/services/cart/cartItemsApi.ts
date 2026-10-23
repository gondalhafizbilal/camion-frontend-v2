import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import type { CheckoutCartLine } from "@/types/checkoutDisplay";
import {
  fetchCustomerCart,
  gqlMoneyToNumber,
  gqlMoneyToNumberOrZero,
  type GqlCustomerCartRow,
} from "@/services/graphql";
import {
  coalesceProductImagePair,
  resolveCartLineImagePair,
} from "@/lib/productImageFallback";
import { CURRENCY_STORAGE_KEY } from "@/lib/currency/currencyStorage";
import { clampCartQuantity } from "@/lib/cart/maxQuantity";

function resolveCurrencyCodeLower(input: unknown): string {
  const raw = typeof input === "string" ? input : "";
  const trimmed = raw.trim();
  if (!trimmed) return "qar";
  return trimmed.toLowerCase();
}

function getDefaultCurrencyLower(): string {
  if (typeof window === "undefined") return "qar";
  const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  return resolveCurrencyCodeLower(stored || "qar");
}

function firstApiErrorMessage(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  const msg = data.message ?? data.error;
  if (typeof msg === "string" && msg.trim()) return msg;
  const errors = data.errors;
  if (errors && typeof errors === "object") {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v) && v[0] != null) return String(v[0]);
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

export type CartProductRef = {
  id: string | number;
  productUuid?: string;
  variantUuid?: string;
  /** Optional analytics fields for Meta AddToCart (ignored by cart API). */
  name?: string;
  prices?: {
    regular_price?: string | number;
    sale_price?: string | number;
    price?: string | number;
    currency_code?: string;
  };
  contentCategory?: string;
};

/** Resolves `POST /v1/cart-items` identifiers from a loose product ref (carousel, PDP, legacy `{ id }`). */
export function resolveV1CartIdentifiers(
  product: CartProductRef,
): { productUuid: string; variantUuid: string } | null {
  const idStr = product.id != null ? String(product.id).trim() : "";
  if (!idStr) return null;
  const productUuid =
    typeof product.productUuid === "string" && product.productUuid.trim()
      ? product.productUuid.trim()
      : idStr;
  const variantUuid =
    typeof product.variantUuid === "string" && product.variantUuid.trim()
      ? product.variantUuid.trim()
      : idStr;
  return { productUuid, variantUuid };
}

function gqlCartMoneyAmount(
  m?: { amount?: unknown; minorAmount?: unknown } | null,
): number | null {
  const n = gqlMoneyToNumber(
    m as {
      amount?: number | string | null;
      minorAmount?: number | string | null;
    } | null,
  );
  return n != null && n >= 0 ? n : null;
}

export function carouselProductToCartRef(
  product: CarouselProduct,
): CartProductRef | null {
  if (product.id == null) return null;
  const productUuid =
    typeof product.productUuid === "string" && product.productUuid.trim()
      ? product.productUuid.trim()
      : undefined;
  const variantUuid =
    typeof product.variantUuid === "string" && product.variantUuid.trim()
      ? product.variantUuid.trim()
      : undefined;
  const name =
    typeof product.name === "string" && product.name.trim()
      ? product.name.trim()
      : undefined;
  const prices = product.prices;
  return {
    id: product.id,
    productUuid,
    variantUuid,
    name,
    ...(prices ? { prices } : {}),
  };
}

export function mapGqlCustomerCartRowToCheckoutLine(
  row: GqlCustomerCartRow,
): CheckoutCartLine | null {
  const lineUuid = String(row.uuid ?? "").trim();
  if (!lineUuid) return null;
  const product = row.product;
  const variant = row.variant;
  if (!product || !variant) return null;

  const productUuid = String(product.uuid ?? "").trim();
  const variantUuid = String(variant.uuid ?? "").trim();
  const qty = Number(row.quantity ?? 1) || 1;
  const regularAmount = gqlMoneyToNumberOrZero(variant.price);
  const saleAmountRaw = gqlMoneyToNumber(variant.discountedPrice) ?? NaN;
  const hasDiscounted =
    Number.isFinite(saleAmountRaw) && saleAmountRaw > 0 && saleAmountRaw < regularAmount;
  /** Unit price for display: `discountedPrice` when on sale, else list `price`. */
  const unit = hasDiscounted ? saleAmountRaw : regularAmount;
  const lineSubTotal = gqlCartMoneyAmount(row.subTotal) ?? unit * qty;
  const lineDiscountPrice = gqlCartMoneyAmount(row.discountPrice);
  const lineTotal = gqlCartMoneyAmount(row.total);
  let displayUnit = unit;
  let displayRegular = regularAmount;
  if (lineTotal != null && qty > 0) {
    const perUnitTotal = lineTotal / qty;
    const perUnitSub = lineSubTotal / qty;
    if (
      perUnitTotal > 0 &&
      perUnitSub > 0 &&
      perUnitTotal < perUnitSub
    ) {
      displayUnit = perUnitTotal;
      displayRegular = perUnitSub;
    }
  }
  const hasDisplaySale = displayUnit < displayRegular && displayRegular > 0;
  const title = String(variant.title ?? product.title ?? "").trim();
  const currencyCode =
    String(
      variant.discountedPrice?.currencyCode ?? variant.price?.currencyCode ?? "",
    ).trim() || undefined;
  const campaignDiscountPct = Number(product.campaign?.discountPercentage ?? NaN);
  const discountPercentage =
    hasDiscounted && regularAmount > 0
      ? Math.round((1 - saleAmountRaw / regularAmount) * 100)
      : hasDisplaySale && displayRegular > 0
        ? Math.round((1 - displayUnit / displayRegular) * 100)
        : Number.isFinite(campaignDiscountPct) && campaignDiscountPct > 0
          ? Math.round(campaignDiscountPct)
          : undefined;
  const images = Array.isArray(variant.images) ? variant.images : [];
  const featuredImg =
    images.find((x) => x?.isFeatured) ??
    images.slice().sort((a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0))[0];
  const rawImg = String(featuredImg?.imageUrl ?? "").trim();
  const rawThumb = String(featuredImg?.thumbnailUrl ?? "").trim();
  const variantPair = coalesceProductImagePair(rawThumb || rawImg, rawImg || rawThumb);
  const { thumb: thumbnailUrl, src: imageUrl } = resolveCartLineImagePair({
    featuredThumbnailUrl: product.featuredThumbnailUrl,
    featuredImageUrl: product.featuredImageUrl,
    variantPair,
  });
  const attributes = (variant.optionValues ?? [])
    .map((row) => row?.optionValue)
    .filter((optionValue): optionValue is NonNullable<typeof optionValue> =>
      Boolean(optionValue),
    )
    .slice()
    .sort((a, b) => {
      const ao = Number(a.option?.position ?? 0);
      const bo = Number(b.option?.position ?? 0);
      if (ao !== bo) return ao - bo;
      return Number(a.position ?? 0) - Number(b.position ?? 0);
    })
    .map((optionValue) => {
      const attribute = String(optionValue.option?.name ?? "").trim();
      const value = String(optionValue.value ?? "").trim();
      if (!attribute || !value) return null;
      return {
        name: attribute,
        attribute,
        value,
      };
    })
    .filter(
      (
        option,
      ): option is {
        name: string;
        attribute: string;
        value: string;
      } => Boolean(option),
    );

  return {
    id: lineUuid,
    key: lineUuid,
    cartItemUuid: lineUuid,
    productId: productUuid || undefined,
    product_id: productUuid,
    variantUuid: variantUuid || undefined,
    quantity: qty,
    price: displayUnit,
    subTotal: lineSubTotal,
    ...(lineDiscountPrice != null ? { discountPrice: lineDiscountPrice } : {}),
    ...(lineTotal != null ? { total: lineTotal } : {}),
    ...(discountPercentage != null && discountPercentage > 0
      ? { discountPercentage }
      : {}),
    ...(product.campaign?.uuid || product.campaign?.name
      ? {
          campaign: {
            uuid: product.campaign.uuid,
            name: product.campaign.name ?? null,
            brief: product.campaign.brief ?? null,
            slug: product.campaign.slug ?? null,
            discountPercentage: product.campaign.discountPercentage ?? null,
            startsAt: product.campaign.startsAt ?? null,
            finishesAt: product.campaign.finishesAt ?? null,
          },
        }
      : {}),
    title,
    name: String(product.title ?? title),
    slug: String(product.slug ?? "").trim() || undefined,
    attributes,
    image: imageUrl,
    thumbnail: thumbnailUrl,
    ...(currencyCode
      ? {
          prices: {
            price: displayUnit,
            regular_price: displayRegular,
            ...(hasDisplaySale || hasDiscounted
              ? { sale_price: displayUnit }
              : {}),
            currency_code: currencyCode,
          },
        }
      : {}),
  };
}

/** Loads cart lines via GraphQL `GetCustomerCart` (REST `GET /v1/cart-items` is not used). */
export async function fetchCartLinesFromApi(
  token: string,
  language: "en" | "ar" = "en",
  currency?: string,
): Promise<CheckoutCartLine[]> {
  const lang = language === "ar" ? "ar" : "en";
  try {
    const data = await fetchCustomerCart(
      { language: lang, currency: resolveCurrencyCodeLower(currency) },
      token,
    );
    const rows = data.getCustomerCart ?? [];
    const out: CheckoutCartLine[] = [];
    for (const row of rows) {
      if (!row) continue;
      const line = mapGqlCustomerCartRowToCheckoutLine(row);
      if (line) out.push(line);
    }
    return out;
  } catch {
    return [];
  }
}

export type CartMutationResult =
  | { ok: true; cartItemUuid?: string }
  | { ok: false; message: string };

export async function postAddCartItem(
  token: string,
  body: {
    productUuid: string;
    variantUuid: string;
    quantity: number;
    /** Lowercase ISO currency (API expects e.g. `qar`). */
    currency?: string;
  },
): Promise<CartMutationResult> {
  const currency = resolveCurrencyCodeLower(body.currency ?? getDefaultCurrencyLower());
  const quantity = clampCartQuantity(body.quantity);
  const res = await apiFetch(API_ENDPOINTS.CART_ITEMS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      productUuid: body.productUuid,
      variantUuid: body.variantUuid,
      quantity,
      currency,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      message: firstApiErrorMessage(data) || `Could not add to cart (${res.status}).`,
    };
  }
  const cartItemUuid =
    typeof data.uuid === "string" && data.uuid.trim() ? data.uuid.trim() : undefined;
  return { ok: true, cartItemUuid };
}

/** PATCH body matches POST `cart-items` identifiers (`productUuid` / `variantUuid`). */
export type PatchCartItemBody = {
  productUuid: string;
  variantUuid: string;
  quantity: number;
  /** Lowercase ISO currency (API expects e.g. `qar`). */
  currency?: string;
};

export async function patchCartItem(
  token: string,
  cartItemUuid: string,
  body: PatchCartItemBody,
): Promise<CartMutationResult> {
  const id = String(cartItemUuid ?? "")
    .trim()
    .replace(/^\/+/, "");
  if (!id) return { ok: false, message: "Missing cart line id." };
  const productUuid = String(body.productUuid ?? "").trim();
  const variantUuid = String(body.variantUuid ?? "").trim();
  const quantity = clampCartQuantity(body.quantity);
  const currency = resolveCurrencyCodeLower(body.currency ?? getDefaultCurrencyLower());
  if (!productUuid || !variantUuid) {
    return { ok: false, message: "Missing product or variant id for update." };
  }
  const res = await apiFetch(API_ENDPOINTS.CART_ITEM_BY_UUID(id), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      productUuid,
      variantUuid,
      quantity,
      currency,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      message:
        firstApiErrorMessage(data) || `Could not update cart line (${res.status}).`,
    };
  }
  const nextUuid =
    typeof data.uuid === "string" && data.uuid.trim() ? data.uuid.trim() : undefined;
  return { ok: true, cartItemUuid: nextUuid };
}

/** When changing variant on a line, send the same PATCH shape with the new variant id. */
export async function patchCartItemVariantAndQuantity(
  token: string,
  cartItemUuid: string,
  productUuid: string,
  variantUuid: string,
  quantity: number,
): Promise<CartMutationResult> {
  return patchCartItem(token, cartItemUuid, {
    productUuid,
    variantUuid,
    quantity,
  });
}

export async function deleteCartItem(
  token: string,
  cartItemUuid: string,
): Promise<CartMutationResult> {
  const id = String(cartItemUuid ?? "")
    .trim()
    .replace(/^\/+/, "");
  if (!id) return { ok: false, message: "Missing cart line id." };
  const res = await apiFetch(API_ENDPOINTS.CART_ITEM_BY_UUID(id), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (res.ok) return { ok: true };
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: false,
    message: firstApiErrorMessage(data) || `Could not remove cart line (${res.status}).`,
  };
}

/** Clears the entire cart: `DELETE /v1/cart-items`. */
export async function clearAllCartItemsViaApi(
  token: string,
): Promise<CartMutationResult> {
  const res = await apiFetch(API_ENDPOINTS.CART_ITEMS, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (res.ok) return { ok: true };
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: false,
    message: firstApiErrorMessage(data) || `Could not clear cart (${res.status}).`,
  };
}

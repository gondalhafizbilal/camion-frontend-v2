import {
  coalesceProductImagePair,
  isUsableProductImageUrl,
  PRODUCT_IMAGE_FALLBACK,
  resolveProductListImagePair,
} from "@/lib/productImageFallback";
import { gqlMoneyToNumber } from "@/services/graphql/money";
import type {
  GqlDimensions,
  GqlProduct,
  GqlProductReview,
  GqlProductVariant,
  GqlWeight,
} from "@/services/graphql/types/product";
import type {
  ProductDefaultVariantSpecs,
  ProductDetailsCenterProduct,
  ProductGalleryImage,
} from "@/types/checkoutDisplay";

function formatGqlWeight(w: GqlWeight | null | undefined): string | undefined {
  if (!w) return undefined;
  const amount = w.amount;
  const unit = String(w.unit ?? "").trim();
  if (amount === undefined || amount === null || String(amount).trim() === "") {
    return undefined;
  }
  return unit ? `${amount} ${unit}`.trim() : String(amount).trim();
}

function formatGqlDimensions(d: GqlDimensions | null | undefined): string | undefined {
  if (!d) return undefined;
  const unit = d.unit != null ? String(d.unit).trim() : "";
  const parts = [d.width, d.height, d.length].filter(
    (x) => x !== undefined && x !== null && String(x).trim() !== "",
  );
  if (!parts.length) return undefined;
  const joined = parts.map((x) => String(x).trim()).join(" × ");
  return unit ? `${joined} ${unit}` : joined;
}

function defaultVariantSpecsFromV0(
  v: GqlProductVariant | undefined,
): ProductDefaultVariantSpecs | undefined {
  if (!v) return undefined;
  const sku = String(v.sku ?? "").trim();
  const barcode = String(v.barcode ?? "").trim();
  const weightText = formatGqlWeight(v.weight ?? undefined);
  const dimensionsText = formatGqlDimensions(v.dimensions ?? undefined);
  const out: ProductDefaultVariantSpecs = {};
  if (sku) out.sku = sku;
  if (barcode) out.barcode = barcode;
  if (weightText) out.weightText = weightText;
  if (dimensionsText) out.dimensionsText = dimensionsText;
  return Object.keys(out).length ? out : undefined;
}

function variantImageUrls(v: GqlProductVariant | undefined): {
  thumb: string;
  src: string;
} {
  const imgs = v?.images;
  if (!imgs?.length) {
    return coalesceProductImagePair("", "");
  }
  const sorted = [...imgs].sort((a, b) => {
    const af = a.isFeatured === true ? 1 : 0;
    const bf = b.isFeatured === true ? 1 : 0;
    if (bf !== af) return bf - af;
    const po = (Number(a.position) || 0) - (Number(b.position) || 0);
    if (po !== 0) return po;
    return String(a.uuid).localeCompare(String(b.uuid));
  });
  const pick = sorted[0];
  const src = (pick?.imageUrl ?? pick?.thumbnailUrl ?? "").trim();
  const thumb = (pick?.thumbnailUrl ?? pick?.imageUrl ?? src).trim();
  return coalesceProductImagePair(thumb, src);
}

function collectGalleryImages(p: GqlProduct): ProductGalleryImage[] {
  const out: ProductGalleryImage[] = [];
  const seen = new Set<string>();

  if (
    isUsableProductImageUrl(p.featuredThumbnailUrl) ||
    isUsableProductImageUrl(p.featuredImageUrl)
  ) {
    const { src, thumb } = resolveProductListImagePair({
      featuredThumbnailUrl: p.featuredThumbnailUrl,
      featuredImageUrl: p.featuredImageUrl,
      variantPair: coalesceProductImagePair("", ""),
    });
    out.push({ src, thumbnail: thumb, alt: p.title ?? undefined });
    seen.add(src);
    seen.add(thumb);
  }

  for (const v of p.variants ?? []) {
    for (const im of v.images ?? []) {
      const src = (im.imageUrl ?? im.thumbnailUrl ?? "").trim();
      if (!isUsableProductImageUrl(src) || seen.has(src)) continue;
      seen.add(src);
      const thumbRaw = (im.thumbnailUrl ?? im.imageUrl ?? "").trim();
      const thumb = isUsableProductImageUrl(thumbRaw) ? thumbRaw : src;
      out.push({
        src,
        thumbnail: thumb,
        alt: im.alt ?? undefined,
      });
    }
  }
  if (!out.length) {
    const { src, thumb } = variantImageUrls(p.variants?.[0]);
    out.push({ src, thumbnail: thumb, alt: p.title ?? undefined });
  }
  return out;
}

/** Slug used for PDP option matching (must match `attributes[].terms[].slug`). */
function optionValueSlug(label: string): string {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normForMatch(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * One row per product option (by `position`), picking the variant's value UUID
 * that belongs to that option. Handles APIs that attach extra `optionValues` on variants.
 */
function variantToAttrRows(
  p: GqlProduct,
  v: GqlProductVariant,
): { name: string; value: string }[] {
  const sortedOpts = [...(p.options ?? [])].sort(
    (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0),
  );
  const rows: { name: string; value: string }[] = [];

  const variantTitle = normForMatch(String(v.title ?? ""));
  const variantUuids = new Set(
    (v.optionValues ?? [])
      .map((ov) => ov.optionValue?.uuid)
      .filter((x): x is string => Boolean(x)),
  );
  const expectedOptionCount = sortedOpts.length;
  const uuidsCount = variantUuids.size;
  const optionValuesLookSuspicious =
    expectedOptionCount > 0 && uuidsCount > expectedOptionCount;

  for (const opt of sortedOpts) {
    const name = String(opt.name ?? "").trim();
    if (!name) continue;
    const vals = [...(opt.values ?? [])].sort(
      (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0),
    );

    // Primary: match by optionValue UUID (works when API returns only chosen values).
    if (!optionValuesLookSuspicious) {
      for (const val of vals) {
        if (val.uuid && variantUuids.has(val.uuid)) {
          const label = String(val.value ?? "").trim();
          rows.push({ name, value: optionValueSlug(label) });
          break;
        }
      }
      if (rows.some((r) => r.name === name)) continue;
    }

    // Fallback: match by variant title containing the option label.
    // Prefer the longest label match to avoid partial overlaps.
    let best: string | null = null;
    let bestLen = 0;
    for (const val of vals) {
      const label = String(val.value ?? "").trim();
      if (!label) continue;
      const needle = normForMatch(label);
      if (!needle) continue;
      if (variantTitle.includes(needle) && needle.length > bestLen) {
        best = label;
        bestLen = needle.length;
      }
    }
    if (best) {
      rows.push({ name, value: optionValueSlug(best) });
    }
  }
  return rows;
}

function variantPriceAmount(v: GqlProductVariant | undefined): number | null {
  if (!v?.price) return null;
  const n = gqlMoneyToNumber(v.price);
  if (n == null || n < 0) return null;
  return n;
}

function variantSaleAmount(v: GqlProductVariant | undefined): number | null {
  if (!v?.discountedPrice) return null;
  const n = gqlMoneyToNumber(v.discountedPrice);
  if (n == null || n < 0) return null;
  return n;
}

export function ratingSummaryFromGqlReviews(
  reviews: GqlProductReview[] | null | undefined,
): { average: number; count: number } {
  const list = reviews ?? [];
  if (!list.length) return { average: 0, count: 0 };
  const sum = list.reduce((s, r) => s + Number(r.rating ?? 0), 0);
  return { average: sum / list.length, count: list.length };
}

/** PDP reviews list UI (REST-shaped rows built from GraphQL). */
export type ProductReviewListRow = {
  id?: string | number;
  product_id?: number;
  rating?: number;
  review?: string;
  content?: string;
  reviewer?: string;
  reviewer_email?: string;
  date_created?: string;
  created_at?: string;
  images?: Array<{
    src: string;
    thumbnail?: string;
    alt?: string;
  }>;
};

export function gqlReviewsToProductReviewRows(
  reviews: GqlProductReview[] | null | undefined,
): ProductReviewListRow[] {
  const list = reviews ?? [];
  return list.map((r) => ({
    id: r.uuid,
    rating: Number(r.rating ?? 0),
    review: r.comment ?? "",
    content: r.comment ?? "",
    reviewer: r.customer?.fullName ?? "",
    reviewer_email: undefined,
    date_created: undefined,
    created_at: undefined,
    images: (r.images ?? []).flatMap((im) => {
      const src = String(im.imageUrl ?? im.thumbnailUrl ?? "").trim();
      const thumb = String(im.thumbnailUrl ?? im.imageUrl ?? "").trim();
      if (!src && !thumb) return [];
      return [
        {
          src: src || thumb,
          thumbnail: thumb || src,
          alt: undefined,
        },
      ];
    }),
  }));
}

/**
 * Maps `getProduct` GraphQL payload to the PDP shell shape (legacy REST field names).
 */
export function gqlProductToProductDetailsCenter(
  p: GqlProduct,
): ProductDetailsCenterProduct {
  const variants = [...(p.variants ?? [])];
  const v0 = variants[0];
  const regularAmount = variantPriceAmount(v0);
  const saleAmountRaw = variantSaleAmount(v0);
  const hasSale =
    regularAmount != null && saleAmountRaw != null && saleAmountRaw < regularAmount;
  const displayAmount =
    hasSale && saleAmountRaw != null
      ? saleAmountRaw
      : regularAmount != null
        ? regularAmount
        : null;
  const code =
    (v0?.price?.currencyCode ?? v0?.discountedPrice?.currencyCode ?? "QAR")
      .toString()
      .trim()
      .toUpperCase() || "QAR";

  const attributes = [...(p.options ?? [])]
    .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0))
    .map((opt) => ({
      name: String(opt.name ?? "").trim(),
      taxonomy: "",
      terms: [...(opt.values ?? [])]
        .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0))
        .map((val) => {
          const label = String(val.value ?? "").trim();
          return {
            slug: optionValueSlug(label),
            name: label,
          };
        }),
    }))
    .filter((a) => a.name);

  const variations = variants.map((v) => {
    const base = variantPriceAmount(v);
    const sale = variantSaleAmount(v);
    const onSale = base != null && sale != null && sale < base ? sale : null;
    const variantPair = variantImageUrls(v);
    const variantHasNoImage =
      variantPair.thumb === PRODUCT_IMAGE_FALLBACK &&
      variantPair.src === PRODUCT_IMAGE_FALLBACK;
    const { src, thumb } = variantHasNoImage
      ? resolveProductListImagePair({
          featuredThumbnailUrl: p.featuredThumbnailUrl,
          featuredImageUrl: p.featuredImageUrl,
          variantPair,
        })
      : variantPair;
    return {
      id: v.uuid,
      attributes: variantToAttrRows(p, v),
      is_in_stock: true,
      is_purchasable: true,
      add_to_cart: { maximum: 99 },
      image: { src, thumbnail: thumb },
      prices: {
        price: onSale ?? base ?? undefined,
        regular_price: base ?? undefined,
        ...(onSale != null ? { sale_price: onSale } : {}),
        currency_code:
          (v.price?.currencyCode ?? code).toString().trim().toUpperCase() || code,
      },
    };
  });

  const variable =
    variants.length > 1 || (p.options ?? []).some((o) => (o.values?.length ?? 0) > 1);

  const categories = (p.productCategories ?? [])
    .map((row) => row.category)
    .filter(
      (c): c is NonNullable<typeof c> => c != null && String(c.uuid ?? "").length > 0,
    )
    .map((c) => ({
      id: c.uuid,
      slug: c.slug ?? undefined,
      name: c.name ?? undefined,
    }));

  return {
    id: p.uuid,
    productUuid: p.uuid,
    name: p.title ?? "",
    slug: p.slug,
    type: variable ? "variable" : "simple",
    // PDP should render plain description (ignore descriptionHtml).
    description: p.description ?? "",
    short_description: p.brief ?? "",
    sizechartUrl: p.sizechartUrl ?? null,
    images: collectGalleryImages(p),
    attachments: (p.attachments ?? []).flatMap((a) => {
      const src = String(a?.mediaUrl ?? "").trim();
      if (!src) return [];
      return [
        {
          src,
          thumbnail: src,
          alt: undefined,
        },
      ];
    }),
    categories,
    attributes,
    variations,
    defaultVariantSpecs: defaultVariantSpecsFromV0(v0),
    prices: {
      price: displayAmount ?? undefined,
      regular_price: regularAmount ?? undefined,
      ...(hasSale && saleAmountRaw != null ? { sale_price: saleAmountRaw } : {}),
      currency_code: code,
    },
    is_in_stock: true,
    ...(p.stockCount != null
      ? { stockCount: p.stockCount, urgency_count: p.stockCount }
      : {}),
    ...(p.campaign?.uuid || p.campaign?.name
      ? {
          campaign: {
            uuid: p.campaign.uuid,
            name: p.campaign.name ?? null,
            brief: p.campaign.brief ?? null,
            slug: p.campaign.slug ?? null,
            discountPercentage: p.campaign.discountPercentage ?? null,
            startsAt: p.campaign.startsAt ?? null,
            finishesAt: p.campaign.finishesAt ?? null,
          },
        }
      : {}),
  };
}

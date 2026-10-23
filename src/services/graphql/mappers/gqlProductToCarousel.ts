import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import {
  coalesceProductImagePair,
  resolveProductListImagePair,
} from "@/lib/productImageFallback";
import { gqlMoneyToNumber, gqlMoneyToNumberOrZero } from "../money";
import type { GqlProduct, GqlProductVariant } from "../types/product";

function readNumericField(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickVariantImageUrls(v: GqlProductVariant | undefined): {
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

/**
 * Maps a GraphQL catalog product to the carousel card shape (REST-era field names).
 * Uses variant `images` when present (`getProduct`, search, shop catalog, …); otherwise a placeholder.
 */
export function gqlProductToCarouselProduct(p: GqlProduct): CarouselProduct {
  const variants = [...(p.variants ?? [])];
  const v0 = variants[0];
  const regularAmount = gqlMoneyToNumberOrZero(v0?.price);
  const saleAmountRaw = gqlMoneyToNumber(v0?.discountedPrice) ?? NaN;
  const hasSale = Number.isFinite(saleAmountRaw) && saleAmountRaw > 0 && saleAmountRaw < regularAmount;
  const displayAmount = hasSale ? saleAmountRaw : regularAmount;
  const code = (v0?.price?.currencyCode ?? v0?.discountedPrice?.currencyCode ?? "QAR")
    .toString()
    .toUpperCase();
  const variantPair = pickVariantImageUrls(v0);
  const { thumb, src } = resolveProductListImagePair({
    featuredThumbnailUrl: p.featuredThumbnailUrl,
    featuredImageUrl: p.featuredImageUrl,
    variantPair,
  });

  const stockCount = readNumericField(p.stockCount);

  return {
    id: v0?.uuid ?? p.uuid,
    productUuid: p.uuid,
    variantUuid: v0?.uuid,
    name: p.title ?? "",
    slug: p.slug,
    images: [{ thumbnail: thumb, src }],
    // `likesCount` can be numeric-like ("12") or already compact ("40M") depending on upstream.
    likes_count: p.likesCount ?? 0,
    ...(stockCount != null && stockCount > 0 ? { urgency_count: p.stockCount } : {}),
    prices: {
      price: displayAmount,
      regular_price: regularAmount,
      ...(hasSale ? { sale_price: saleAmountRaw } : {}),
      currency_code: code,
    },
    on_sale: hasSale,
    variations: variants.length > 1 ? variants : [],
    // Rating fields (REST-era names) used by `ProductCarouselCard`.
    average_rating: Number(p.ratingAvg ?? 0) || 0,
    rating_count: Number(p.reviewsCount ?? 0) || 0,
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

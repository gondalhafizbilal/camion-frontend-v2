import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import {
  coalesceProductImagePair,
  resolveProductListImagePair,
} from "@/lib/productImageFallback";
import { gqlMoneyToNumber, gqlMoneyToNumberOrZero } from "../money";
import type { GqlCustomerWishlistRow } from "../types/customer";

function pickWishlistVariantImageUrls(
  imgs:
    | Array<{
        uuid?: string | null;
        imageUrl?: string | null;
        thumbnailUrl?: string | null;
        isFeatured?: boolean | null;
        position?: number | null;
      }>
    | null
    | undefined,
): { thumb: string; src: string } {
  if (!imgs?.length) return coalesceProductImagePair("", "");
  const sorted = [...imgs].sort((a, b) => {
    const af = a.isFeatured === true ? 1 : 0;
    const bf = b.isFeatured === true ? 1 : 0;
    if (bf !== af) return bf - af;
    const po = (Number(a.position) || 0) - (Number(b.position) || 0);
    if (po !== 0) return po;
    return String(a.uuid ?? "").localeCompare(String(b.uuid ?? ""));
  });
  const pick = sorted[0];
  const src = (pick?.imageUrl ?? pick?.thumbnailUrl ?? "").trim();
  const thumb = (pick?.thumbnailUrl ?? pick?.imageUrl ?? src).trim();
  return coalesceProductImagePair(thumb, src);
}

/**
 * Minimal carousel shape from `getCustomerWishlist` rows when `getProduct` is unavailable.
 */
export function gqlWishlistRowToCarouselProduct(
  row: GqlCustomerWishlistRow,
): CarouselProduct {
  const p = row.product;
  const v = row.variant;
  const slug = (p?.slug ?? "").trim();
  const regularAmount = gqlMoneyToNumberOrZero(v?.price);
  const saleAmountRaw = gqlMoneyToNumber(v?.discountedPrice) ?? NaN;
  const hasSale =
    Number.isFinite(saleAmountRaw) && saleAmountRaw > 0 && saleAmountRaw < regularAmount;
  const displayAmount = hasSale ? (saleAmountRaw as number) : regularAmount;
  const code = (v?.price?.currencyCode ?? v?.discountedPrice?.currencyCode ?? "QAR")
    .toString()
    .toUpperCase();
  const variantPair = pickWishlistVariantImageUrls(v?.images);
  const { thumb, src } = resolveProductListImagePair({
    featuredThumbnailUrl: p?.featuredThumbnailUrl,
    featuredImageUrl: p?.featuredImageUrl,
    variantPair,
  });
  return {
    id: v?.uuid ?? p?.uuid ?? row.uuid,
    productUuid: p?.uuid,
    name: p?.title ?? "",
    slug: slug || undefined,
    images: [{ thumbnail: thumb, src }],
    prices: {
      price: displayAmount,
      regular_price: regularAmount,
      ...(hasSale ? { sale_price: saleAmountRaw as number } : {}),
      currency_code: code,
    },
    on_sale: hasSale,
    variations: [],
    wishlistEntryUuid: row.uuid,
    ...(p?.campaign?.uuid || p?.campaign?.name
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

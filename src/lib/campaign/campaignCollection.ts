import type { CarouselProduct, CarouselProductCampaign } from "@/componentsedit/home/ProductCarouselSection";

/** Canonical path for a featured campaign product collection. */
export function buildCampaignCollectionHref(slug: string | null | undefined): string | null {
  const normalized = String(slug ?? "").trim();
  if (!normalized) return null;
  return `/campaign/${encodeURIComponent(normalized)}`;
}

export function resolveCampaignFromProducts(
  products: CarouselProduct[],
): CarouselProductCampaign | null {
  for (const product of products) {
    const campaign = product?.campaign;
    if (campaign?.name?.trim() || campaign?.uuid || campaign?.slug?.trim()) {
      return campaign;
    }
  }
  return null;
}

export function campaignSlugMatchesRoute(
  campaignSlug: string | null | undefined,
  routeSlug: string | null | undefined,
): boolean {
  const expected = String(campaignSlug ?? "").trim().toLowerCase();
  const actual = String(routeSlug ?? "").trim().toLowerCase();
  if (!expected || !actual) return false;
  return expected === actual;
}

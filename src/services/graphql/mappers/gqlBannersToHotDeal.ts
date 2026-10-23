import { bannerImageUrlOrFallback } from "@/lib/productImageFallback";
import type { GqlBanner } from "../types/banner";
import {
  DEFAULT_BANNER_TEXT_COLOR,
  isHotDealsPlacement,
  normalizeBannerHref,
  normalizeBannerTextColor,
} from "./bannerUtils";

export type HotDealBannerPayload = {
  id: string;
  imageUrl: string;
  tag?: string;
  title?: string;
  linkUrl: string;
  /** Safe CSS color for headline/tag (from API `color`). */
  textColor: string;
};

/** All active banners with placement `hot_deals`, `hotdeals`, or `Hotdeals_Web`. */
export function gqlBannersToHotDealBanners(
  banners: GqlBanner[],
): HotDealBannerPayload[] {
  return banners
    .filter(
      (b) =>
        b.isActive !== false &&
        Boolean(b.imageUrl?.trim()) &&
        isHotDealsPlacement(b.placement),
    )
    .map((b) => {
      const title = b.title?.trim();
      return {
        id: b.uuid,
        imageUrl: bannerImageUrlOrFallback(b.imageUrl),
        ...(title ? { title } : {}),
        linkUrl: normalizeBannerHref(b.linkUrl),
        textColor: normalizeBannerTextColor(b.color, DEFAULT_BANNER_TEXT_COLOR),
      };
    });
}

/** @deprecated Use {@link gqlBannersToHotDealBanners} — first hot-deals banner only. */
export function gqlBannersToHotDealBanner(
  banners: GqlBanner[],
): HotDealBannerPayload | null {
  return gqlBannersToHotDealBanners(banners)[0] ?? null;
}

import { bannerImageUrlOrFallback } from "@/lib/productImageFallback";
import type { GqlBanner } from "../types/banner";
import {
  DEFAULT_BANNER_TEXT_COLOR,
  isHeroPlacement,
  normalizeBannerHref,
  normalizeBannerTextColor,
} from "./bannerUtils";

export type HeroSlideFromBanner = {
  id: string;
  img: string;
  href: string;
  alt: string;
  tag: string;
  title: string;
  subtitle: string;
  /** Safe CSS color for overlay text (from API `color`). */
  textColor: string;
};

/**
 * Hero carousel: all active banners for hero placements (`hero`, `homepage`, `home_hero`, etc.).
 */
export function gqlBannersToHeroSlides(
  banners: GqlBanner[],
): HeroSlideFromBanner[] {
  return banners
    .filter(
      (b) =>
        b.isActive !== false &&
        Boolean(b.imageUrl?.trim()) &&
        isHeroPlacement(b.placement),
    )
    .map((b) => ({
      id: b.uuid,
      img: bannerImageUrlOrFallback(b.imageUrl),
      href: normalizeBannerHref(b.linkUrl),
      alt: "heroBanner",
      tag: "",
      title: b.title?.trim() ?? "",
      subtitle: "",
      textColor: normalizeBannerTextColor(b.color, DEFAULT_BANNER_TEXT_COLOR),
    }));
}

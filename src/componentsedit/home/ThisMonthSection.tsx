"use client";

import ProductCarouselSection, {
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";

export default function ThisMonthSection({
  initialProducts,
}: {
  /** Optional SSR seed; client always refetches recently viewed (popular fallback when empty). */
  initialProducts?: CarouselProduct[];
}) {
  return (
    <ProductCarouselSection
      titleKey="recentlyViewed"
      productPage={1}
      listSource="recent"
      initialProducts={initialProducts}
    />
  );
}

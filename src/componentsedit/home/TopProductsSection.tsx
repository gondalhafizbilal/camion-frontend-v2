"use client";

import ProductCarouselSection, {
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";

export default function TopProductsSection({
  initialProducts,
}: {
  initialProducts?: CarouselProduct[];
}) {
  return (
    <ProductCarouselSection
      titleKey="topProducts"
      productPage={1}
      listSource="featured"
      initialProducts={initialProducts}
    />
  );
}

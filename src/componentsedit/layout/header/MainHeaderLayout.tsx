"use client";

import HeaderDesktopCategoryNav from "./_components/HeaderDesktopCategoryNav";
import { useCustomerWishlistCount } from "@/hooks/useCustomerWishlistCount";
import { useCustomerCartCount } from "@/hooks/useCustomerCartCount";

export type MainHeaderLayoutProps = {
  /** When set, overrides GraphQL cart line count (e.g. Storybook / tests). */
  totalItems?: number;
  wishlistCount?: number;
};

export default function MainHeaderLayout({
  totalItems: totalItemsProp,
  wishlistCount: wishlistCountProp,
}: MainHeaderLayoutProps) {
  const cartCountFromHook = useCustomerCartCount();
  const totalItems = totalItemsProp ?? cartCountFromHook ?? 0;
  const wishlistCountFromHook = useCustomerWishlistCount();
  const wishlistCount = wishlistCountProp ?? wishlistCountFromHook;

  return (
    <div className="w-full">
      <HeaderDesktopCategoryNav
        totalItems={totalItems}
        wishlistCount={wishlistCount}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/componentsedit/context/CartContext";
import { useCartDrawerEnabled } from "@/hooks/useCartDrawerEnabled";
import { isProductDetailPathname } from "@/lib/cart/isProductDetailPathname";
import { shouldCloseCartDrawerForPathname } from "@/lib/cart/cartDrawerRoutes";
import MobileCartAddedSheet from "./MobileCartAddedSheet";

export default function MobileCartAddedSheetHost() {
  const pathname = usePathname();
  const isCartDrawerEnabled = useCartDrawerEnabled();
  const {
    cart,
    loading,
    highlightedLineId,
    isMobileCartAddedSheetOpen,
    closeMobileCartAddedSheet,
    updateQuantity,
  } = useCart();

  useEffect(() => {
    if (!isMobileCartAddedSheetOpen) return;
    if (!isProductDetailPathname(pathname) || shouldCloseCartDrawerForPathname(pathname)) {
      closeMobileCartAddedSheet();
    }
  }, [pathname, isMobileCartAddedSheetOpen, closeMobileCartAddedSheet]);

  useEffect(() => {
    if (isCartDrawerEnabled && isMobileCartAddedSheetOpen) {
      closeMobileCartAddedSheet();
    }
  }, [isCartDrawerEnabled, isMobileCartAddedSheetOpen, closeMobileCartAddedSheet]);

  const handleQuantityChange = useCallback(
    (cartLineId: string | number | undefined, qty: number) => {
      if (cartLineId == null || cartLineId === "") return;
      void updateQuantity(cartLineId, qty);
    },
    [updateQuantity],
  );

  if (isCartDrawerEnabled) return null;

  return (
    <MobileCartAddedSheet
      open={isMobileCartAddedSheetOpen}
      cart={cart}
      loading={loading}
      highlightedLineId={highlightedLineId}
      onClose={closeMobileCartAddedSheet}
      onQuantityChange={handleQuantityChange}
    />
  );
}

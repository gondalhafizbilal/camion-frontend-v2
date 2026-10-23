"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/componentsedit/context/CartContext";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCartDrawerEnabled } from "@/hooks/useCartDrawerEnabled";
import { shouldCloseCartDrawerForPathname } from "@/lib/cart/cartDrawerRoutes";
import CartDrawer from "./CartDrawer";
import { useCartDrawerLayoutShift } from "./useCartDrawerLayoutShift";
import { pushGtmEvent } from "@/componentsedit/analytics/gtmDataLayer";
import { summarizeCheckoutCart } from "@/types/checkoutDisplay";

export default function CartDrawerHost() {
  const pathname = usePathname();
  const { currency } = useCurrency();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const currencyCode = currency || "QAR";

  const {
    cart,
    loading,
    totalItems,
    isCartDrawerOpen,
    closeCartDrawer,
    highlightedLineId,
    showAddedBanner,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const isCartDrawerEnabled = useCartDrawerEnabled();
  const wasDrawerOpenRef = useRef(false);

  useCartDrawerLayoutShift(isCartDrawerOpen, isCartDrawerEnabled);

  useEffect(() => {
    if (isCartDrawerOpen && !wasDrawerOpenRef.current) {
      pushGtmEvent("view_cart", {
        cart_value: summarizeCheckoutCart(cart).cart_total ?? 0,
        currency: currencyCode,
        source: "cart_drawer",
      });
    }
    wasDrawerOpenRef.current = isCartDrawerOpen;
  }, [isCartDrawerOpen, cart, currencyCode]);

  useEffect(() => {
    if (!isCartDrawerEnabled && isCartDrawerOpen) {
      closeCartDrawer();
    }
  }, [isCartDrawerEnabled, isCartDrawerOpen, closeCartDrawer]);

  useEffect(() => {
    if (isCartDrawerOpen && shouldCloseCartDrawerForPathname(pathname)) {
      closeCartDrawer();
    }
  }, [pathname, isCartDrawerOpen, closeCartDrawer]);

  const handleQuantityChange = useCallback(
    (cartLineId: string | number | undefined, qty: number) => {
      if (cartLineId == null || cartLineId === "") return;
      void updateQuantity(cartLineId, qty);
    },
    [updateQuantity],
  );

  const handleRemove = useCallback(
    (cartLineId: string | number) => {
      void removeFromCart(cartLineId);
    },
    [removeFromCart],
  );

  if (!isCartDrawerEnabled) return null;

  return (
    <CartDrawer
      open={isCartDrawerOpen}
      cart={cart}
      loading={loading}
      currencyCode={currencyCode}
      locale={locale}
      totalItems={totalItems}
      highlightedLineId={highlightedLineId}
      showAddedBanner={showAddedBanner}
      onClose={closeCartDrawer}
      onQuantityChange={handleQuantityChange}
      onRemove={handleRemove}
    />
  );
}

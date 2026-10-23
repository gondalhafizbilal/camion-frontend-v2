"use client";

import { useCallback, useMemo } from "react";
import RootLayout from "@/componentsedit/layout/RootLayout";
import CartCenterContent from "./_components/CartCenterContent";
import Cookies from "js-cookie";
import { useUser } from "@/componentsedit/context/UserContext";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import {
  summarizeCheckoutCart,
  type CartSummaryShape,
} from "@/types/checkoutDisplay";

export default function CartPage() {
  const savedToken = Cookies.get("token");
  const { loading: userLoading } = useUser();
  const { currency } = useCurrency();
  const currencyCode = currency || "QAR";

  const {
    cart,
    loading: cartLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const cartSummary = useMemo(
    (): CartSummaryShape => summarizeCheckoutCart(cart),
    [cart],
  );

  const handleQuantityChange = useCallback(
    (cartLineId: string | number | undefined, newQuantity: number) => {
      if (cartLineId == null || cartLineId === "") return;
      void updateQuantity(cartLineId, newQuantity);
    },
    [updateQuantity],
  );

  const handleRemove = useCallback(
    (cartLineId: string | number) => {
      void removeFromCart(cartLineId);
    },
    [removeFromCart],
  );

  const handleClearCart = useCallback(() => {
    void clearCart();
  }, [clearCart]);

  const pageLoading = cartLoading || userLoading;

  return (
    <RootLayout>
      <CartCenterContent
        cart={cart}
        cartSummary={cartSummary}
        loading={pageLoading}
        onQuantityChange={handleQuantityChange}
        onRemove={handleRemove}
        onClearCart={handleClearCart}
        currencyCode={currencyCode}
        isLoggedIn={!!savedToken}
      />
    </RootLayout>
  );
}

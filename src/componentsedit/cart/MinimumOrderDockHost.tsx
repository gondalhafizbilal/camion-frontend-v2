"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/componentsedit/context/CartContext";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useMinimumOrder } from "@/componentsedit/context/MinimumOrderContext";
import {
  canProceedToCheckout,
  shouldEnforceMinimumOrder,
} from "@/lib/cart/minimumOrder";
import { summarizeCheckoutCart } from "@/types/checkoutDisplay";
import { MinimumOrderDock, type MinimumOrderDockVariant } from "./MinimumOrderDock";
import { useMinimumOrderDock } from "./minimumOrderDockContext";

const CELEBRATION_AUTO_HIDE_MS = 2500;

function shouldHideMinimumOrderDock(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.includes("/auth")) return true;
  if (pathname.includes("/checkout/confirmation")) return true;
  return false;
}

export default function MinimumOrderDockHost() {
  const pathname = usePathname();
  const { cart, isCartDrawerOpen } = useCart();
  const { currency } = useCurrency();
  const {
    checkoutBlocked,
    blockSubtotalOverride,
    dismissCheckoutBlocked,
  } = useMinimumOrderDock();
  const { minimumAmount, ready } = useMinimumOrder();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const currencyCode = currency || "QAR";
  const isCartPage = Boolean(pathname?.includes("/cart"));
  const isBuyNowBlock = blockSubtotalOverride != null;

  const cartSubtotal = useMemo(() => {
    return summarizeCheckoutCart(cart).cart_total ?? 0;
  }, [cart]);

  /** Buy Now uses line total; cart CTA uses full cart. */
  const dockSubtotal = isBuyNowBlock ? blockSubtotalOverride! : cartSubtotal;

  const enforceMinimum = shouldEnforceMinimumOrder(ready, minimumAmount);
  const cartAchieved = canProceedToCheckout(cartSubtotal, ready, minimumAmount);
  const dockAchieved = canProceedToCheckout(dockSubtotal, ready, minimumAmount);
  const [celebrating, setCelebrating] = useState(false);
  const [dismissedAfterSuccess, setDismissedAfterSuccess] = useState(false);
  const prevAchievedRef = useRef(false);
  const didMountRef = useRef(false);

  useEffect(() => {
    // Only auto-clear when the *shown* amount meets minimum (cart or Buy Now line).
    if (dockAchieved && checkoutBlocked) {
      dismissCheckoutBlocked();
    }
  }, [dockAchieved, checkoutBlocked, dismissCheckoutBlocked]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (cartAchieved) {
        setDismissedAfterSuccess(true);
        prevAchievedRef.current = true;
      }
      return;
    }

    if (!cartAchieved) {
      setCelebrating(false);
      setDismissedAfterSuccess(false);
      prevAchievedRef.current = false;
      return;
    }

    if (!prevAchievedRef.current) {
      setCelebrating(true);
      setDismissedAfterSuccess(false);
      dismissCheckoutBlocked();
      const timerId = window.setTimeout(() => {
        setCelebrating(false);
        setDismissedAfterSuccess(true);
      }, CELEBRATION_AUTO_HIDE_MS);
      prevAchievedRef.current = true;
      return () => window.clearTimeout(timerId);
    }

    prevAchievedRef.current = true;
  }, [cartAchieved, dismissCheckoutBlocked]);

  const hasCartItems = (cart?.length ?? 0) > 0;
  const routeAllowed = !shouldHideMinimumOrderDock(pathname);
  const belowDockMinimum = enforceMinimum && !dockAchieved;
  /** Cart CTA needs items in cart; Buy Now can open with line-only override. */
  const canShowBlockedContext = isBuyNowBlock || hasCartItems;

  /** Checkout-blocked dock (cart CTA or Buy Now) or brief success on cart. */
  const showBlocked =
    routeAllowed && belowDockMinimum && checkoutBlocked && canShowBlockedContext;
  const showCelebration =
    routeAllowed &&
    isCartPage &&
    celebrating &&
    !(cartAchieved && dismissedAfterSuccess);

  const visible = showBlocked || showCelebration;

  const variant: MinimumOrderDockVariant = showCelebration ? "celebration" : "blocked";

  useEffect(() => {
    // Keep Buy Now block visible on PDP; cart/drawer blocks stay as before.
    if (isBuyNowBlock) return;
    if (!isCartPage && !isCartDrawerOpen) {
      dismissCheckoutBlocked();
    }
  }, [isCartPage, isCartDrawerOpen, isBuyNowBlock, dismissCheckoutBlocked]);

  useEffect(() => {
    if (!checkoutBlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissCheckoutBlocked();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checkoutBlocked, dismissCheckoutBlocked]);

  if (!enforceMinimum || minimumAmount == null) return null;

  return (
    <MinimumOrderDock
      visible={visible}
      variant={variant}
      cartSubtotal={dockSubtotal}
      currencyCode={currencyCode}
      locale={locale}
      minimumAmount={minimumAmount}
      showBackdrop={showBlocked}
      onDismissBlocked={dismissCheckoutBlocked}
    />
  );
}

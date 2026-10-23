"use client";

import { useEffect } from "react";
import {
  CART_DRAWER_BODY_ATTR,
  CART_DRAWER_WIDTH_CSS,
} from "@/lib/cart/cartDrawerLayout";

/** Reserves inline space on the page so the cart rail sits beside content, not over it. */
export function useCartDrawerLayoutShift(
  open: boolean,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--cart-drawer-width", CART_DRAWER_WIDTH_CSS);

    if (open) {
      document.body.setAttribute(CART_DRAWER_BODY_ATTR, "open");
    } else {
      document.body.removeAttribute(CART_DRAWER_BODY_ATTR);
    }

    return () => {
      document.body.removeAttribute(CART_DRAWER_BODY_ATTR);
    };
  }, [open, enabled]);
}

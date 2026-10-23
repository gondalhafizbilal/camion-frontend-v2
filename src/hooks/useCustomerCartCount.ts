"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { fetchCustomerCartCount } from "@/services/graphql";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";

/** Dispatch after cart REST mutations or when cart lines reload so the header count refetches. */
export const CART_COUNT_INVALIDATED_EVENT = "camion-cart-count-invalidate";

function normalizeCount(raw: number | null | undefined): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

export function useCustomerCartCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setCount(0);
      return;
    }
    try {
      const data = await fetchCustomerCartCount(token);
      setCount(normalizeCount(data.getCustomerCartCount));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onSession = () => void refresh();
    const onInvalidate = () => void refresh();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    window.addEventListener(CART_COUNT_INVALIDATED_EVENT, onInvalidate);
    return () => {
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
      window.removeEventListener(CART_COUNT_INVALIDATED_EVENT, onInvalidate);
    };
  }, [refresh]);

  return count;
}

export function dispatchCartCountInvalidated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_COUNT_INVALIDATED_EVENT));
}

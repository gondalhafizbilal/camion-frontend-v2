"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { fetchCustomerWishlistCount } from "@/services/graphql";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";

/** Dispatch after wishlist mutations or when the wishlist page finishes loading so the header count refetches. */
export const WISHLIST_COUNT_INVALIDATED_EVENT = "camion-wishlist-count-invalidate";

function normalizeCount(raw: number | null | undefined): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

export function useCustomerWishlistCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setCount(0);
      return;
    }
    try {
      const data = await fetchCustomerWishlistCount(token);
      setCount(normalizeCount(data.getCustomerWishlistCount));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onSession = () => void refresh();
    const onInvalidate = () => void refresh();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    window.addEventListener(WISHLIST_COUNT_INVALIDATED_EVENT, onInvalidate);
    return () => {
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
      window.removeEventListener(WISHLIST_COUNT_INVALIDATED_EVENT, onInvalidate);
    };
  }, [refresh]);

  return count;
}

export function dispatchWishlistCountInvalidated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WISHLIST_COUNT_INVALIDATED_EVENT));
}

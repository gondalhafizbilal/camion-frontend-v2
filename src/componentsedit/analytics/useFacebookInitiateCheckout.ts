"use client";

import { useEffect, useRef } from "react";
import type { CheckoutCartLine } from "@/types/checkoutDisplay";
import {
  buildFacebookInitiateCheckoutParams,
  trackFacebookInitiateCheckout,
} from "./facebookInitiateCheckout";
import { runWhenFacebookPixelReady } from "./facebookPixelClient";

type UseFacebookInitiateCheckoutOptions = {
  enabled: boolean;
  cart: CheckoutCartLine[];
  currency: string;
};

/**
 * Fires Meta InitiateCheckout once per checkout session (cart + currency fingerprint).
 */
export function useFacebookInitiateCheckout({
  enabled,
  cart,
  currency,
}: UseFacebookInitiateCheckoutOptions): void {
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !cart.length) return;

    const params = buildFacebookInitiateCheckoutParams(cart, currency);
    if (!params) return;

    const dedupeKey = [
      params.content_ids.join(","),
      String(params.num_items),
      String(params.currency),
      String(Math.round(params.value * 100)),
    ].join("|");

    if (lastKeyRef.current === dedupeKey) return;
    lastKeyRef.current = dedupeKey;

    return runWhenFacebookPixelReady(() => {
      trackFacebookInitiateCheckout(params);
    });
  }, [enabled, cart, currency]);
}

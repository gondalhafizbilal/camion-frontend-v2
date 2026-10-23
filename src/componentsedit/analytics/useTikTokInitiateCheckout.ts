"use client";

import { useEffect, useRef } from "react";
import type { CheckoutCartLine } from "@/types/checkoutDisplay";
import { buildTikTokInitiateCheckoutParams } from "./tiktokInitiateCheckout";
import { runWhenTikTokPixelReady } from "./tiktokPixelClient";
import { trackTikTokCommerceEvent } from "./tiktokTrack";

type UseTikTokInitiateCheckoutOptions = {
  enabled: boolean;
  cart: CheckoutCartLine[];
  currency: string;
};

export function useTikTokInitiateCheckout({
  enabled,
  cart,
  currency,
}: UseTikTokInitiateCheckoutOptions): void {
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !cart.length) return;

    const params = buildTikTokInitiateCheckoutParams(cart, currency);
    if (!params) return;

    const numItems = params.contents.reduce((sum, c) => sum + c.quantity, 0);
    const dedupeKey = [
      params.contents.map((c) => c.content_id).join(","),
      String(numItems),
      String(params.currency),
      String(Math.round(params.value * 100)),
    ].join("|");

    if (lastKeyRef.current === dedupeKey) return;
    lastKeyRef.current = dedupeKey;

    return runWhenTikTokPixelReady(() => {
      trackTikTokCommerceEvent("InitiateCheckout", params);
    });
  }, [enabled, cart, currency]);
}

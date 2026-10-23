"use client";

import { useEffect, useRef } from "react";
import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import { runWhenTikTokPixelReady } from "./tiktokPixelClient";
import { buildTikTokViewContentParams } from "./tiktokViewContent";
import { trackTikTokCommerceEvent } from "./tiktokTrack";

type UseTikTokViewContentOptions = {
  enabled: boolean;
  product: ProductDetailsCenterProduct | null;
  slug?: string;
  variantUuid?: string | null;
  currency: string;
};

export function useTikTokViewContent({
  enabled,
  product,
  slug,
  variantUuid,
  currency,
}: UseTikTokViewContentOptions): void {
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !product) return;

    const params = buildTikTokViewContentParams(product, variantUuid);
    if (!params) return;

    const dedupeKey = [
      String(slug ?? "").trim(),
      params.contents[0]?.content_id ?? "",
      String(variantUuid ?? "").trim(),
      String(currency ?? "QAR").toUpperCase(),
    ].join("|");

    if (lastKeyRef.current === dedupeKey) return;
    lastKeyRef.current = dedupeKey;

    return runWhenTikTokPixelReady(() => {
      trackTikTokCommerceEvent("ViewContent", params);
    });
  }, [enabled, product, slug, variantUuid, currency]);
}

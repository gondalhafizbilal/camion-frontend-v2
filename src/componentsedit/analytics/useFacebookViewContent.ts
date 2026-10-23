"use client";

import { useEffect, useRef } from "react";
import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import { runWhenFacebookPixelReady } from "./facebookPixelClient";
import {
  buildFacebookViewContentParams,
  trackFacebookViewContent,
} from "./facebookViewContent";

type UseFacebookViewContentOptions = {
  enabled: boolean;
  product: ProductDetailsCenterProduct | null;
  slug?: string;
  variantUuid?: string | null;
  currency: string;
};

/**
 * Fires Meta ViewContent when a PDP product is shown. Dedupes identical
 * slug/product/variant/currency; refires when currency or variant context changes.
 */
export function useFacebookViewContent({
  enabled,
  product,
  slug,
  variantUuid,
  currency,
}: UseFacebookViewContentOptions): void {
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !product) return;

    const params = buildFacebookViewContentParams(product, variantUuid);
    if (!params) return;

    const dedupeKey = [
      String(slug ?? "").trim(),
      params.content_ids[0],
      String(variantUuid ?? "").trim(),
      String(currency ?? "QAR").toUpperCase(),
    ].join("|");

    if (lastKeyRef.current === dedupeKey) return;
    lastKeyRef.current = dedupeKey;

    return runWhenFacebookPixelReady(() => {
      trackFacebookViewContent(params);
    });
  }, [enabled, product, slug, variantUuid, currency]);
}

"use client";

import { useEffect, useRef } from "react";
import {
  trackTikTokPurchaseFromOrder,
  type TikTokPurchaseOrderInput,
} from "./tiktokPurchase";

type UseTikTokPurchaseOptions = {
  enabled: boolean;
  order: TikTokPurchaseOrderInput | null;
};

export function useTikTokPurchase({
  enabled,
  order,
}: UseTikTokPurchaseOptions): void {
  const lastUuidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !order?.orderUuid) return;

    const orderUuid = String(order.orderUuid).trim();
    if (!orderUuid) return;
    if (lastUuidRef.current === orderUuid) return;
    lastUuidRef.current = orderUuid;

    trackTikTokPurchaseFromOrder(order);
  }, [enabled, order]);
}

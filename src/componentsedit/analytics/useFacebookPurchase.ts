"use client";

import { useEffect, useRef } from "react";
import {
  trackFacebookPurchaseFromOrder,
  type FacebookPurchaseOrderInput,
} from "./facebookPurchase";

type UseFacebookPurchaseOptions = {
  enabled: boolean;
  order: FacebookPurchaseOrderInput | null;
};

/** Fires Meta Purchase once when a completed order is available on confirmation. */
export function useFacebookPurchase({
  enabled,
  order,
}: UseFacebookPurchaseOptions): void {
  const lastUuidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !order?.orderUuid) return;

    const orderUuid = String(order.orderUuid).trim();
    if (!orderUuid) return;
    if (lastUuidRef.current === orderUuid) return;
    lastUuidRef.current = orderUuid;

    trackFacebookPurchaseFromOrder(order);
  }, [enabled, order]);
}

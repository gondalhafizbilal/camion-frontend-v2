"use client";

import { useEffect, useRef } from "react";
import {
  trackGtmPurchaseFromOrder,
  type GtmPurchaseOrderInput,
} from "./gtmFunnel";

type UseGtmPurchaseOptions = {
  enabled: boolean;
  order: GtmPurchaseOrderInput | null;
};

/** Fires GTM Purchase once when a completed order is available on confirmation. */
export function useGtmPurchase({
  enabled,
  order,
}: UseGtmPurchaseOptions): void {
  const lastUuidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !order?.orderUuid) return;

    const orderUuid = String(order.orderUuid).trim();
    if (!orderUuid) return;
    if (lastUuidRef.current === orderUuid) return;
    lastUuidRef.current = orderUuid;

    trackGtmPurchaseFromOrder(order);
  }, [enabled, order]);
}

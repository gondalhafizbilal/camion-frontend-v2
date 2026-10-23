"use client";

import { useMemo } from "react";
import { useFreeShipping } from "@/componentsedit/context/FreeShippingContext";
import {
  getFreeShippingProgress,
  shouldShowFreeShippingBar,
  type FreeShippingProgress,
} from "@/lib/cart/freeShipping";

export type FreeShippingBannerState = {
  active: boolean;
  progress: FreeShippingProgress | null;
  thresholdAmount: number | null;
  achieved: boolean;
};

export function useFreeShippingBannerState(cartSubtotal: number): FreeShippingBannerState {
  const { thresholdAmount, ready } = useFreeShipping();

  return useMemo(() => {
    const active = shouldShowFreeShippingBar(ready, thresholdAmount);
    const progress =
      active && thresholdAmount != null
        ? getFreeShippingProgress(cartSubtotal, thresholdAmount)
        : null;

    return {
      active,
      progress,
      thresholdAmount,
      achieved: progress?.achieved ?? false,
    };
  }, [cartSubtotal, ready, thresholdAmount]);
}

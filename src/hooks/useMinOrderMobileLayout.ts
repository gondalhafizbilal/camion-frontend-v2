"use client";

import { useSyncExternalStore } from "react";

/** Matches Tailwind `sm:` — mobile sheet below 640px, desktop popup at 640px+. */
const MIN_ORDER_MOBILE_MQ = "(max-width: 639px)";

function subscribeMobileLayout(onStoreChange: () => void) {
  const mq = window.matchMedia(MIN_ORDER_MOBILE_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getMobileLayoutSnapshot(): boolean {
  return window.matchMedia(MIN_ORDER_MOBILE_MQ).matches;
}

/** `true` on viewports under 640px (bottom sheet). Server snapshot defaults to mobile. */
export function useMinOrderMobileLayout(): boolean {
  return useSyncExternalStore(
    subscribeMobileLayout,
    getMobileLayoutSnapshot,
    () => true,
  );
}

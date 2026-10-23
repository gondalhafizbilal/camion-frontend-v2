"use client";

import { useSyncExternalStore } from "react";

/** Matches Tailwind `lg:` — cart side drawer is desktop/tablet landscape only (1024px+). */
const CART_DRAWER_DESKTOP_MQ = "(min-width: 1024px)";

function subscribeDesktopLayout(onStoreChange: () => void) {
  const mq = window.matchMedia(CART_DRAWER_DESKTOP_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getDesktopLayoutSnapshot(): boolean {
  return window.matchMedia(CART_DRAWER_DESKTOP_MQ).matches;
}

/** `true` on viewports 1024px and wider where the side drawer is shown. */
export function useCartDrawerEnabled(): boolean {
  return useSyncExternalStore(
    subscribeDesktopLayout,
    getDesktopLayoutSnapshot,
    () => false,
  );
}

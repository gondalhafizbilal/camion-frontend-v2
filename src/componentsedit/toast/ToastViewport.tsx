"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import {
  getServerToastsSnapshot,
  getToastsSnapshot,
  subscribeToasts,
} from "./toastStore";
import { ToastSurface } from "./ToastSurface";

export function ToastViewport() {
  const items = useSyncExternalStore(
    subscribeToasts,
    getToastsSnapshot,
    getServerToastsSnapshot,
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="pointer-events-none fixed left-1/2 top-4 z-[10000] flex w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 flex-col gap-3 md:left-auto md:end-4 md:translate-x-0"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((t) => (
            <ToastSurface key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </div>
    </>,
    document.body,
  );
}

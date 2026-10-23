"use client";

import { useMemo } from "react";
import { toast } from "./toastApi";

/**
 * Global toast API. Must be used under {@link ToastProvider} for toasts to render.
 *
 * @example
 * const t = useToast();
 * t.success("Saved", "Your changes were saved.");
 * t.error("Something went wrong", undefined, { duration: 6000 });
 * t.info("Heads up", "Optional description", {
 *   actionLabel: "View",
 *   onAction: () => router.push("/orders"),
 * });
 */
export function useToast() {
  return useMemo(() => toast, []);
}

export { ToastProvider } from "./ToastProvider";
export { ToastSurface } from "./ToastSurface";
export { useToast } from "./useToast";
export { toast } from "./toastApi";
export type { ToastOptions, ToastRecord, ToastVariant } from "./types";

/**
 * Example (any client component):
 *
 * import { toast } from "@/componentsedit/toast";
 * toast.success("Added to cart");
 * toast.error("Sign in required", undefined, { duration: 5000 });
 * toast.warning("Limited stock", "Only 2 left.");
 * toast.info("New message", "You have a reply.", {
 *   actionLabel: "Open",
 *   onAction: () => { ... },
 * });
 */

import { addToast, removeToast } from "./toastStore";
import type { ToastOptions, ToastVariant } from "./types";

function newId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type NormalizedToastOptions = {
  id: string;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
  closable: boolean;
};

function normalizeOptions(options?: ToastOptions): NormalizedToastOptions {
  const duration =
    options?.duration ?? options?.autoClose ?? 4000;
  return {
    id: options?.id ?? newId(),
    duration,
    actionLabel: options?.actionLabel,
    onAction: options?.onAction,
    closable: options?.closable !== false,
  };
}

function parseArgs(
  title: string,
  second?: string | ToastOptions,
  third?: ToastOptions,
): { title: string; description?: string; options: ToastOptions } {
  if (typeof second === "string") {
    return { title, description: second, options: third ?? {} };
  }
  return { title, description: undefined, options: second ?? {} };
}

function push(
  type: ToastVariant,
  title: string,
  second?: string | ToastOptions,
  third?: ToastOptions,
) {
  const { title: t, description, options } = parseArgs(title, second, third);
  const o = normalizeOptions(options);
  addToast({
    id: o.id,
    type,
    title: t,
    description,
    duration: o.duration,
    actionLabel: o.actionLabel,
    onAction: o.onAction,
    closable: o.closable,
  });
}

export const toast = {
  success(title: string, second?: string | ToastOptions, third?: ToastOptions) {
    push("success", title, second, third);
  },
  error(title: string, second?: string | ToastOptions, third?: ToastOptions) {
    push("error", title, second, third);
  },
  warning(title: string, second?: string | ToastOptions, third?: ToastOptions) {
    push("warning", title, second, third);
  },
  /** Alias for `warning` (react-toastify compatibility). */
  warn(title: string, second?: string | ToastOptions, third?: ToastOptions) {
    push("warning", title, second, third);
  },
  info(title: string, second?: string | ToastOptions, third?: ToastOptions) {
    push("info", title, second, third);
  },
  dismiss(id: string) {
    removeToast(id);
  },
};

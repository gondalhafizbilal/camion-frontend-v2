import type { ToastRecord } from "./types";

const listeners = new Set<() => void>();

/** Stable reference for `useSyncExternalStore` server snapshot (must not allocate per call). */
const EMPTY_SERVER_TOASTS: ToastRecord[] = [];

let toasts: ToastRecord[] = [];

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastsSnapshot(): ToastRecord[] {
  return toasts;
}

export function getServerToastsSnapshot(): ToastRecord[] {
  return EMPTY_SERVER_TOASTS;
}

export function addToast(record: ToastRecord) {
  const existing = toasts.findIndex((t) => t.id === record.id);
  if (existing >= 0) {
    toasts = toasts.map((t) => (t.id === record.id ? record : t));
  } else {
    toasts = [...toasts, record];
  }
  emit();
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

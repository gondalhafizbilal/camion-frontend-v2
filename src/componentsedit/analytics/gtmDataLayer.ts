import { createGtmEventContext } from "./gtmEventContext";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/**
 * Safe GTM dataLayer push. No-ops on the server or if dataLayer is unavailable.
 * Omits `undefined` values so GTM variables stay clean.
 */
export function pushGtmEvent(
  event: string,
  params: Record<string, unknown> = {},
): void {
  try {
    if (typeof window === "undefined") return;
    const name = event.trim();
    if (!name) return;

    const payload: Record<string, unknown> = {
      ...createGtmEventContext(),
      event: name,
    };
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) payload[key] = value;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {
    /* Analytics must never interrupt application behavior. */
  }
}

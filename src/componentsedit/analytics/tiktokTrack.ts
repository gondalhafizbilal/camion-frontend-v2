import { runWhenTikTokPixelReady } from "./tiktokPixelClient";
import type { TikTokCommerceParams } from "./tiktokProductCommerce";

export function trackTikTokEvent(
  eventName: string,
  params: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window.ttq?.track !== "function") return;
  const id = eventId?.trim();
  window.ttq.track(
    eventName,
    params,
    id ? { event_id: id } : undefined,
  );
}

export function trackTikTokCommerceEvent(
  eventName: string,
  params: TikTokCommerceParams,
  eventId?: string,
): void {
  trackTikTokEvent(eventName, params, eventId);
}

export function runTikTokCommerceEvent(
  eventName: string,
  params: TikTokCommerceParams,
  eventId?: string,
): void {
  runWhenTikTokPixelReady(() => {
    trackTikTokCommerceEvent(eventName, params, eventId);
  });
}

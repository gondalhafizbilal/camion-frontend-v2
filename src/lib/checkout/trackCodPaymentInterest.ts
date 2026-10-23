import { runWhenFacebookPixelReady } from "@/componentsedit/analytics/facebookPixelClient";
import { runWhenTikTokPixelReady } from "@/componentsedit/analytics/tiktokPixelClient";
import { trackTikTokEvent } from "@/componentsedit/analytics/tiktokTrack";
import { pushGtmEvent } from "@/componentsedit/analytics/gtmDataLayer";

const COD_INTEREST_SESSION_KEY = "cod_interest_click_logged";

/** Where the COD interest control was shown / tapped. */
export type CodInterestSource = "checkout" | "pdp" | "cart" | "commitments";

const COD_INTEREST_EVENT = "cod_interest_click";

/**
 * Records customer interest in Cash on Delivery (coming soon).
 * Dedupes once per browser tab session (per source) so repeat taps don’t flood analytics.
 */
export function trackCodPaymentInterest(
  locale?: string,
  source: CodInterestSource = "checkout",
): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${COD_INTEREST_SESSION_KEY}:${source}`;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode / quota — still attempt analytics below */
  }

  const params: Record<string, unknown> = {
    payment_method: "cod",
    status: "coming_soon",
    content_category: "payment_interest",
    source,
    locale: locale || undefined,
  };

  runWhenFacebookPixelReady(() => {
    window.fbq?.("trackCustom", COD_INTEREST_EVENT, params);
  });

  runWhenTikTokPixelReady(() => {
    trackTikTokEvent("ClickButton", {
      ...params,
      content_name: COD_INTEREST_EVENT,
    });
  });

  pushGtmEvent(COD_INTEREST_EVENT, params);
}

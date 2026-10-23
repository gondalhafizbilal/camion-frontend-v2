import { toast } from "@/componentsedit/toast";
import {
  trackCodPaymentInterest,
  type CodInterestSource,
} from "@/lib/checkout/trackCodPaymentInterest";

/** Shared COD “coming soon” tap: analytics + toast (once per session for analytics). */
export function notifyCodComingSoonInterest(
  locale: string,
  toastMessage: string,
  source: CodInterestSource = "checkout",
): void {
  trackCodPaymentInterest(locale, source);
  toast.info(toastMessage, {
    position: "top-center",
    autoClose: 3500,
  });
}

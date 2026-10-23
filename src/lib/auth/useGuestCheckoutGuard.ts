"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useRouter } from "@/i18n/navigation";
import { toast } from "@/componentsedit/toast";
import { useTranslations } from "next-intl";
import { isGuestSession } from "./isGuestClient";
import { pushAuthCheckoutGtmEvent } from "@/componentsedit/analytics/authCheckoutEvents";

/**
 * If the session is guest-only, redirect to cart with a toast.
 * Pass `userLoading` from {@link useUser} when the page already waits for profile.
 */
export function useRedirectGuestFromCheckout(userLoading = false) {
  const router = useRouter();
  const t = useTranslations();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (userLoading) return;
    const isGuest = isGuestSession();
    const hasToken = Boolean(Cookies.get("token")?.trim());
    if (!isGuest && hasToken) return;
    if (didRedirectRef.current) return;
    didRedirectRef.current = true;
    pushAuthCheckoutGtmEvent("login_required", {
      source: "checkout_guard",
      method: isGuest ? "guest" : "unauthenticated",
    });
    if (!isGuest) return;
    toast.error(t("guestCheckoutRequiresLogin"), {
      position: "top-center",
      autoClose: 3500,
    });
    router.replace("/cart");
  }, [userLoading, router, t]);
}

"use client";

import { useCallback, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "@/componentsedit/toast";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import { useMinimumOrderDock } from "@/componentsedit/cart/minimumOrderDockContext";
import { useMinimumOrder } from "@/componentsedit/context/MinimumOrderContext";
import { goToLogin } from "@/lib/auth/authReturnToClient";
import { canProceedToCheckout } from "@/lib/cart/minimumOrder";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { pushGtmEvent } from "@/componentsedit/analytics/gtmDataLayer";
import { pushAuthCheckoutGtmEvent } from "@/componentsedit/analytics/authCheckoutEvents";

/** Shared cart → checkout rules (guest login + minimum order), used by cart page and cart drawer. */
export function useCartProceedCheckout(cartSubtotal: number) {
  const t = useTranslations();
  const router = useRouter();
  const { emphasizeCheckoutBlocked } = useMinimumOrderDock();
  const { minimumAmount, ready } = useMinimumOrder();
  const { currency } = useCurrency();

  const minimumOrderAchieved = canProceedToCheckout(
    cartSubtotal,
    ready,
    minimumAmount,
  );

  const handleProceedCheckoutClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (isGuestSession()) {
        e.preventDefault();
        pushAuthCheckoutGtmEvent("login_required", { source: "cart_checkout" });
        toast.error(t("guestCheckoutRequiresLogin"), {
          position: "top-center",
          autoClose: 3500,
        });
        goToLogin(router, "/cart");
      }
    },
    [t, router],
  );

  const handleBlockedCheckout = useCallback(() => {
    pushGtmEvent("minimum_order_not_reached", {
      cart_value: cartSubtotal,
      currency: String(currency || "QAR"),
      threshold: minimumAmount ?? undefined,
      source: "cart_checkout",
    });
    emphasizeCheckoutBlocked();
  }, [
    cartSubtotal,
    currency,
    minimumAmount,
    emphasizeCheckoutBlocked,
  ]);

  return {
    minimumOrderAchieved,
    handleProceedCheckoutClick,
    handleBlockedCheckout,
  };
}

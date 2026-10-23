"use client";

import { useCart } from "@/componentsedit/context/CartContext";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { usePathname } from "next/navigation";
import { summarizeCheckoutCart } from "@/types/checkoutDisplay";
import FreeShippingProgressBanner, {
  type FreeShippingProgressBannerVariant,
} from "./FreeShippingProgressBanner";

export type FreeShippingBannerFromCartProps = {
  variant?: FreeShippingProgressBannerVariant;
  className?: string;
  /** Override cart subtotal (e.g. selected lines / checkout summary). Defaults to full cart. */
  cartSubtotal?: number;
  /** When true, unlock state follows `shippingTotal` from order preview. */
  shippingKnown?: boolean;
  shippingTotal?: number | null;
};

export default function FreeShippingBannerFromCart({
  variant = "embedded",
  className,
  cartSubtotal: cartSubtotalOverride,
  shippingKnown = false,
  shippingTotal = null,
}: FreeShippingBannerFromCartProps) {
  const { cart } = useCart();
  const { currency } = useCurrency();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const currencyCode = currency || "QAR";
  const cartSubtotal =
    cartSubtotalOverride != null && Number.isFinite(cartSubtotalOverride)
      ? cartSubtotalOverride
      : (summarizeCheckoutCart(cart).cart_total ?? 0);

  if ((cart?.length ?? 0) === 0) return null;

  return (
    <FreeShippingProgressBanner
      cartSubtotal={cartSubtotal}
      currencyCode={currencyCode}
      locale={locale}
      variant={variant}
      className={className}
      shippingKnown={shippingKnown}
      shippingTotal={shippingTotal}
    />
  );
}

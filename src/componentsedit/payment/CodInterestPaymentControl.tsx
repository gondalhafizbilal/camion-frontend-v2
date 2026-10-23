"use client";

import { useLocale, useTranslations } from "next-intl";
import { CashOnDeliveryIcon } from "@/componentsedit/PaymentMethodIcons";
import { notifyCodComingSoonInterest } from "@/lib/checkout/notifyCodComingSoonInterest";
import type { CodInterestSource } from "@/lib/checkout/trackCodPaymentInterest";

export type CodInterestPaymentControlProps = {
  source: CodInterestSource;
  /**
   * `stack` — icon + Coming Soon (PDP / empty cart).
   * `tile` — commitments-style bordered card with method label.
   */
  variant?: "stack" | "tile";
  className?: string;
};

/**
 * Cash on Delivery “coming soon” control that records customer interest
 * via {@link notifyCodComingSoonInterest} (`cod_interest_click`).
 */
export default function CodInterestPaymentControl({
  source,
  variant = "stack",
  className = "",
}: CodInterestPaymentControlProps) {
  const t = useTranslations();
  const locale = useLocale();

  const onClick = () => {
    notifyCodComingSoonInterest(
      locale,
      t("paymentMethodCodComingSoonToast"),
      source,
    );
  };

  const ariaLabel = `${t("paymentMethodCashOnDelivery")} — ${t("comingSoon")}`;

  if (variant === "tile") {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={ariaLabel}
        title={t("comingSoon")}
        onClick={onClick}
        className={`flex w-full flex-col items-center gap-2 rounded-[5px] border border-black/10 bg-[#FAFAFA] px-2 py-3 opacity-80 cursor-not-allowed ${className}`.trim()}
      >
        <CashOnDeliveryIcon />
        <span
          className="max-w-[72px] text-center font-sans font-semibold uppercase tracking-wide text-[#CB262E]"
          style={{ fontSize: 8, lineHeight: "10px" }}
        >
          {t("comingSoon")}
        </span>
        <span className="text-center font-sans text-[11px] font-medium text-black/70">
          {t("paymentMethodCashOnDelivery")}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={ariaLabel}
      title={t("comingSoon")}
      onClick={onClick}
      className={`inline-flex flex-col items-center gap-1 opacity-80 cursor-not-allowed ${className}`.trim()}
    >
      <CashOnDeliveryIcon />
      <span
        className="max-w-[52px] text-center font-sans font-semibold uppercase tracking-wide text-[#CB262E]"
        style={{ fontSize: 8, lineHeight: "10px" }}
      >
        {t("comingSoon")}
      </span>
    </button>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { PaymentMethodIconByType } from "@/componentsedit/PaymentMethodIcons";
import { notifyCodComingSoonInterest } from "@/lib/checkout/notifyCodComingSoonInterest";

// Restore full set of payment methods for checkout.
// Replace the Mastercard label with our Skipcash-branded credit card option.
export const CHECKOUT_PAYMENT_METHODS = [
  { id: "applepay", messageKey: "paymentMethodApplePay", icon: "applepay" },
  { id: "visa", messageKey: "paymentMethodVisa", icon: "visa" },
  { id: "googlepay", messageKey: "paymentMethodGooglePay", icon: "googlepay" },
] as const;

export type CheckoutPaymentMethodId = (typeof CHECKOUT_PAYMENT_METHODS)[number]["id"];

const COD_PAYMENT_METHOD = {
  id: "cod",
  messageKey: "paymentMethodCashOnDelivery",
  icon: "cod",
} as const;

const sectionTitleStyle = "font-sans font-medium text-[#000000] text-xl leading-5";

export type CheckoutPaymentMethodListProps = {
  selectedPaymentMethod?: string;
  onSelectPaymentMethod?: (id: string) => void;
  /** When false, omit the section heading (caller provides its own). Default true. */
  showHeading?: boolean;
  className?: string;
};

export default function CheckoutPaymentMethodList({
  selectedPaymentMethod = "",
  onSelectPaymentMethod,
  showHeading = true,
  className = "",
}: CheckoutPaymentMethodListProps) {
  const t = useTranslations();
  const locale = useLocale();

  const handleCodInterestClick = () => {
    notifyCodComingSoonInterest(locale, t("paymentMethodCodComingSoonToast"), "checkout");
  };

  return (
    <section className={`flex flex-col gap-6 ${className}`.trim()}>
      {showHeading ? <h2 className={sectionTitleStyle}>{t("paymentMethod")}</h2> : null}
      <div className="flex flex-col gap-2">
        {CHECKOUT_PAYMENT_METHODS.map((pm) => (
          <button
            key={pm.id}
            type="button"
            onClick={() => onSelectPaymentMethod?.(pm.id)}
            className={`box-border flex flex-row items-center w-full gap-[11px] py-2 px-6 rounded-[5px] border bg-white transition-colors ${
              selectedPaymentMethod === pm.id ? "border-[#CB262E]" : "border-black/15"
            }`}
            style={{ height: 50 }}
          >
            <PaymentMethodIconByType type={pm.icon} />
            <span
              className="font-sans font-medium text-[#000000] flex-1 text-start"
              style={{ fontSize: 16, lineHeight: "24px" }}
            >
              {t(pm.messageKey)}
            </span>
          </button>
        ))}

        <button
          key={COD_PAYMENT_METHOD.id}
          type="button"
          aria-disabled="true"
          onClick={handleCodInterestClick}
          className="box-border flex flex-row items-center w-full gap-[11px] py-2 px-6 rounded-[5px] border border-black/15 bg-[#F7F7F7] opacity-75 cursor-not-allowed"
          style={{ height: 50 }}
          title={t("comingSoon")}
        >
          <PaymentMethodIconByType type={COD_PAYMENT_METHOD.icon} />
          <span
            className="font-sans font-medium text-[#000000] flex-1 text-start"
            style={{ fontSize: 16, lineHeight: "24px" }}
          >
            {t(COD_PAYMENT_METHOD.messageKey)}
          </span>
          <span
            className="shrink-0 rounded px-2 py-0.5 font-sans font-semibold uppercase tracking-wide text-[#CB262E] bg-[#CB262E]/10"
            style={{ fontSize: 10, lineHeight: "14px" }}
          >
            {t("comingSoon")}
          </span>
        </button>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import {
  MastercardIcon,
  ApplePayIcon,
  GooglePayIcon,
  VisaIcon,
  AmexIcon,
} from "@/componentsedit/PaymentMethodIcons";
import CodInterestPaymentControl from "@/componentsedit/payment/CodInterestPaymentControl";

const ACTIVE_PAYMENT_ICONS = [
  { id: "mastercard", Icon: MastercardIcon },
  { id: "applepay", Icon: ApplePayIcon },
  { id: "googlepay", Icon: GooglePayIcon },
  { id: "visa", Icon: VisaIcon },
  { id: "amex", Icon: AmexIcon },
] as const;

export default function PaymentMethods() {
  const t = useTranslations();

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-3">
      <h3
        className="font-sans font-semibold text-[#000000]"
        style={{ fontSize: 16, lineHeight: "20px" }}
      >
        {t("paymentMethods")}
      </h3>
      <div className="flex flex-row flex-wrap items-start" style={{ gap: 8 }}>
        {ACTIVE_PAYMENT_ICONS.map(({ id, Icon }) => (
          <Icon key={id} />
        ))}
        <CodInterestPaymentControl source="pdp" />
      </div>
    </div>
  );
}

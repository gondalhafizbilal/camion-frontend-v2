"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  FOUR_PX_BRAND_BLUE,
  FOUR_PX_BRAND_NAME,
} from "@/lib/checkout/fourPxShipping";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";

export { FOUR_PX_BRAND_NAME };

const badgeClass =
  "inline-flex items-center justify-center rounded px-2 py-0.5 font-sans text-xs font-bold tracking-wide text-white shrink-0";
const rowClass =
  "box-border flex flex-row gap-3 w-full min-h-[50px] bg-white border border-black/15 rounded-[5px] py-3 px-6";

export type ShippingMethodFourPxRowProps = {
  fee: number;
  currencyCode: string;
  /** e.g. "6-10 working days · Saudi Arabia" */
  transitText?: string;
  /** Order preview `eta` — shown below 4PX on order review. */
  eta?: string;
  loading?: boolean;
  /** Taller row on order review with two-line left column */
  variant?: "checkout" | "orderReview";
};

function DeliveryEtaIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#CB262E]"
      aria-hidden
    >
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export default function ShippingMethodFourPxRow({
  fee,
  currencyCode,
  transitText,
  eta,
  loading,
  variant = "checkout",
}: ShippingMethodFourPxRowProps) {
  const t = useTranslations();
  const locale = useLocale();
  const feeLabel = loading
    ? "…"
    : formatAmountWithCurrency(
        Number.isFinite(fee) ? fee : 0,
        currencyCode,
        locale,
      );

  const isReview = variant === "orderReview";
  const etaText = eta?.trim() ?? "";

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className={`${rowClass} ${variant === "orderReview" ? "items-start" : "items-center"}`}
      >
        <div
          className={`flex flex-row gap-3 flex-1 min-w-0 ${variant === "orderReview" ? "items-start" : "items-center"}`}
        >
          <span className={badgeClass} style={{ background: FOUR_PX_BRAND_BLUE }}>
            {FOUR_PX_BRAND_NAME}
          </span>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span
              className="font-sans font-normal text-sm text-black/70 break-words"
              style={{ lineHeight: isReview ? "20px" : "18px" }}
            >
              {transitText?.trim() ? transitText : "—"}
            </span>
          </div>
        </div>
        <span
          className={`font-sans font-medium text-black/70 shrink-0 tabular-nums ${variant === "orderReview" ? "self-start pt-0.5" : ""}`}
          style={{ fontSize: isReview ? 12 : 13, lineHeight: "18px" }}
        >
          {feeLabel}
        </span>
      </div>

      {isReview && etaText ? (
        <div
          className="box-border flex w-full flex-row items-start gap-3 rounded-[5px] border border-[#CB262E]/25 bg-[#FFF5F5] px-5 py-3.5"
          role="status"
        >
          <DeliveryEtaIcon />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-sans text-xs font-medium uppercase tracking-wide text-[#CB262E]">
              {t("estDelivery")}
            </span>
            <span
              className="font-sans text-sm font-semibold text-[#000000] break-words"
              style={{ lineHeight: "20px" }}
            >
              {etaText}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import Roadmap from "@/componentsedit/Roadmap";
import {
  ApplePayIcon,
  GooglePayIcon,
  MastercardIcon,
  NapsIcon,
  QpayIcon,
  VisaIcon,
} from "@/componentsedit/PaymentMethodIcons";
import CodInterestPaymentControl from "@/componentsedit/payment/CodInterestPaymentControl";
import {
  PAGE_CONTENT_INNER_CLASS,
  PAGE_SECTION_X_PADDING_CLASS,
} from "@/lib/layout/pageContentLayout";
import { FOUR_PX_BRAND_BLUE, FOUR_PX_BRAND_NAME } from "@/lib/checkout/fourPxShipping";
import { BRAND_CALLOUT_BG, BRAND_RED } from "@/lib/styles/brandWarmGradient";

const GFS_BRAND_NAME = "GFS";
const GFS_BRAND_COLOR = "#1B6B3A";

function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentHeadingIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function SafetyHeadingIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12l1.8 1.8L15 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShippingHeadingIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17h-2v-4m-1-8h11v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5M3 9h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReturnsHeadingIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 14L4 9l5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 9h11a5 5 0 010 10h-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommitmentCheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="text-[#CB262E]">
            <CheckIcon />
          </span>
          <span className="font-sans text-sm leading-5 text-black/80 sm:text-base sm:leading-6">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({
  id,
  title,
  intro,
  icon,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-[5px] border border-black/15 bg-white p-4 sm:p-6"
    >
      <h2 className="flex items-center gap-2.5 font-sans text-lg font-semibold text-black sm:text-xl">
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] text-[#CB262E]"
          style={{ background: BRAND_CALLOUT_BG }}
        >
          {icon}
        </span>
        {title}
      </h2>
      {intro ? (
        <p className="mt-2 font-sans text-sm leading-6 text-black/70 sm:text-base">
          {intro}
        </p>
      ) : null}
      {children}
    </section>
  );
}

const SUPPORTED_PAYMENTS = [
  { id: "applepay", labelKey: "paymentMethodApplePay", Icon: ApplePayIcon },
  { id: "mastercard", labelKey: "paymentMethodMastercard", Icon: MastercardIcon },
  { id: "visa", labelKey: "paymentMethodVisa", Icon: VisaIcon },
  { id: "googlepay", labelKey: "paymentMethodGooglePay", Icon: GooglePayIcon },
  { id: "naps", labelKey: "paymentMethodNaps", Icon: NapsIcon },
  { id: "qpay", labelKey: "paymentMethodQpay", Icon: QpayIcon },
] as const;

export default function CommitmentsCenterContent() {
  const t = useTranslations();

  return (
    <div className={`w-full py-6 sm:py-8 md:py-10 ${PAGE_SECTION_X_PADDING_CLASS}`}>
      <div className={`${PAGE_CONTENT_INNER_CLASS} flex flex-col gap-6 sm:gap-8`}>
        <Roadmap
          items={[
            { label: t("home"), href: "/" },
            { label: t("productCommitmentsTitle") },
          ]}
        />

        <header
          className="rounded-[5px] border px-4 py-5 sm:px-6 sm:py-6"
          style={{ background: BRAND_CALLOUT_BG, borderColor: `${BRAND_RED}33` }}
        >
          <h1 className="font-sans text-xl font-semibold text-[#CB262E] sm:text-2xl">
            {t("commitmentsPageHeadline")}
          </h1>
          <p className="mt-2 max-w-3xl font-sans text-sm leading-6 text-black/75 sm:text-base">
            {t("commitmentsPageIntro")}
          </p>
        </header>

        <SectionCard
          id="payment-methods"
          title={t("commitmentsPaymentMethodsTitle")}
          intro={t("commitmentsPaymentMethodsIntro")}
          icon={<PaymentHeadingIcon />}
        >
          <CommitmentCheckList
            items={[
              t("productCommitmentsSecurePayment"),
              t("productCommitmentsPrivacyProtection"),
              t("commitmentsGlobalPaymentPartners"),
            ]}
          />
          <div className="mt-5">
            <h3 className="font-sans text-sm font-semibold text-black sm:text-base">
              {t("commitmentsSupportedPaymentMethods")}
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {SUPPORTED_PAYMENTS.map(({ id, labelKey, Icon }) => (
                <li
                  key={id}
                  className="flex flex-col items-center gap-2 rounded-[5px] border border-black/10 bg-[#FAFAFA] px-2 py-3"
                >
                  <Icon />
                  <span className="text-center font-sans text-[11px] font-medium text-black/70">
                    {t(labelKey)}
                  </span>
                </li>
              ))}
              <li key="cod">
                <CodInterestPaymentControl source="commitments" variant="tile" />
              </li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard
          id="safety-measures"
          title={t("commitmentsSafetyTitle")}
          intro={t("commitmentsSafetyIntro")}
          icon={<SafetyHeadingIcon />}
        >
          <CommitmentCheckList
            items={[
              t("commitmentsSafetyEncryption"),
              t("commitmentsSafetyMonitoring"),
              t("commitmentsSafetyNoCardData"),
              t("commitmentsSafetyAudits"),
              t("commitmentsSafetyCompliance"),
              t("commitmentsSafetySecureProcesses"),
              t("productCommitmentsPrivacyProtection"),
            ]}
          />
        </SectionCard>

        <SectionCard
          id="shipping-delivery"
          title={t("commitmentsShippingTitle")}
          intro={t("commitmentsShippingIntro")}
          icon={<ShippingHeadingIcon />}
        >
          <CommitmentCheckList
            items={[
              t("commitmentsShippingRefundPackages"),
              t("commitmentsShippingPartners"),
            ]}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-sans text-xs text-black/60 sm:text-sm">
              {t("commitmentsDeliveryPartnersLabel")}
            </span>
            <span
              className="inline-flex items-center justify-center rounded px-2 py-0.5 font-sans text-xs font-bold tracking-wide text-white"
              style={{ background: FOUR_PX_BRAND_BLUE }}
            >
              {FOUR_PX_BRAND_NAME}
            </span>
            <span
              className="inline-flex items-center justify-center rounded px-2 py-0.5 font-sans text-xs font-bold tracking-wide text-white"
              style={{ background: GFS_BRAND_COLOR }}
            >
              {GFS_BRAND_NAME}
            </span>
          </div>
        </SectionCard>

        <SectionCard
          id="returns-refunds"
          title={t("returnsRefunds")}
          intro={t("commitmentsReturnsIntro")}
          icon={<ReturnsHeadingIcon />}
        >
          <CommitmentCheckList
            items={[
              t("commitmentsReturnsEasy"),
              t("commitmentsReturnsQuick"),
            ]}
          />
          <Link
            href="/myaccount/privacy-policies"
            className="mt-4 inline-flex font-sans text-sm font-semibold text-[#CB262E] underline underline-offset-2 hover:text-[#9B1F26]"
          >
            {t("commitmentsLearnMore")}
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}

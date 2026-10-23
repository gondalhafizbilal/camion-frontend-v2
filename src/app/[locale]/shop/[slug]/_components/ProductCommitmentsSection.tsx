"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { BRAND_CALLOUT_BG, BRAND_RED } from "@/lib/styles/brandWarmGradient";

function ShieldIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
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

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
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

function ChevronIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 rtl:rotate-180"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommitmentMiniCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-[5px] bg-[#FAFAFA] p-2.5">
      <span className="font-sans text-[11px] font-semibold leading-4 text-[#CB262E]">
        {title}
      </span>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-1.5">
            <span className="text-[#CB262E]">
              <CheckIcon />
            </span>
            <span className="font-sans text-[10px] leading-[14px] text-black/75">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductCommitmentsSection() {
  const t = useTranslations();

  return (
    <Link
      href="/commitments"
      className="box-border flex w-full min-w-0 flex-col gap-3 rounded-[5px] border border-black/15 bg-white p-3 transition-colors hover:border-[#CB262E]/35 sm:p-4"
      aria-label={t("productCommitmentsAria")}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
          style={{ background: BRAND_CALLOUT_BG, color: BRAND_RED }}
        >
          <ShieldIcon />
        </span>
        <span className="min-w-0 flex-1 font-sans text-sm font-semibold leading-5 text-[#CB262E]">
          {t("productCommitmentsTitle")}
        </span>
        <span className="text-[#CB262E]">
          <ChevronIcon />
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <CommitmentMiniCard
          title={t("productCommitmentsSafePayments")}
          items={[
            t("productCommitmentsSecurePayment"),
            t("productCommitmentsPrivacyProtection"),
          ]}
        />
        <CommitmentMiniCard
          title={t("productCommitmentsSafeDelivery")}
          items={[
            t("productCommitmentsRefundLost"),
            t("productCommitmentsRefundDamaged"),
          ]}
        />
      </div>
    </Link>
  );
}

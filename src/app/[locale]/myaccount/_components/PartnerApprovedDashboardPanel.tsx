"use client";

import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { GqlCurrentAffiliate } from "@/services/graphql/types/affiliate";
import type { GqlMoney } from "@/services/graphql/types/product";
import AccountPanelSurface from "./AccountPanelSurface";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { gqlMoneyToNumber } from "@/services/graphql/money";

function formatPartnerMoney(
  m: GqlMoney | null | undefined,
  locale: string,
): string {
  if (!m) return "—";
  const code = (m.currencyCode || "QAR").toUpperCase();
  const n = gqlMoneyToNumber(m);
  if (n == null) return `— ${code}`.trim();
  return formatAmountWithCurrency(n, code, locale);
}

function displayId(uuid: string | null | undefined): string {
  if (!uuid || !String(uuid).trim()) return "—";
  return String(uuid).trim();
}

function CreateCouponIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15.8113 32.91C15.4663 32.91 15.1363 32.76 14.9113 32.46L13.3963 30.435C13.0813 30.015 12.6613 29.775 12.2113 29.745C11.7463 29.715 11.3112 29.925 10.9512 30.3C8.77625 32.625 7.12627 32.43 6.33127 32.13C5.52127 31.815 4.15625 30.78 4.15625 27.45V10.56C4.15625 3.90001 6.07625 1.875 12.3613 1.875H23.6863C29.9713 1.875 31.8913 3.90001 31.8913 10.56V16.95C31.8913 17.565 31.3813 18.075 30.7663 18.075C30.1513 18.075 29.6413 17.565 29.6413 16.95V10.56C29.6413 5.14501 28.6963 4.125 23.6863 4.125H12.3613C7.35125 4.125 6.40625 5.14501 6.40625 10.56V27.45C6.40625 29.025 6.79625 29.895 7.15625 30.03C7.42625 30.135 8.16128 29.985 9.30128 28.77C10.1263 27.9 11.2063 27.435 12.3313 27.495C13.4413 27.555 14.4913 28.14 15.1963 29.085L16.7263 31.11C17.1013 31.605 16.9963 32.31 16.5013 32.685C16.2763 32.85 16.0363 32.91 15.8113 32.91Z" fill="white"/>
      <path d="M24 11.625H12C11.385 11.625 10.875 11.115 10.875 10.5C10.875 9.885 11.385 9.375 12 9.375H24C24.615 9.375 25.125 9.885 25.125 10.5C25.125 11.115 24.615 11.625 24 11.625Z" fill="white"/>
      <path d="M22.5 17.625H13.5C12.885 17.625 12.375 17.115 12.375 16.5C12.375 15.885 12.885 15.375 13.5 15.375H22.5C23.115 15.375 23.625 15.885 23.625 16.5C23.625 17.115 23.115 17.625 22.5 17.625Z" fill="white"/>
      <path d="M22.2294 32.67C21.6594 32.67 21.1194 32.46 20.7294 32.07C20.2644 31.605 20.0543 30.93 20.1593 30.225L20.4444 28.2C20.5194 27.675 20.8344 27.045 21.2094 26.67L26.5193 21.36C27.2393 20.64 27.9444 20.265 28.7094 20.19C29.6394 20.1 30.5693 20.49 31.4393 21.36C32.3093 22.23 32.6993 23.145 32.6093 24.09C32.5343 24.84 32.1443 25.56 31.4393 26.28L26.1294 31.59C25.7544 31.965 25.1243 32.28 24.5993 32.355L22.5743 32.64C22.4543 32.655 22.3494 32.67 22.2294 32.67ZM28.9643 22.425C28.9493 22.425 28.9343 22.425 28.9193 22.425C28.7093 22.44 28.4243 22.635 28.1093 22.95L22.7994 28.26C22.7544 28.305 22.6793 28.455 22.6793 28.515L22.4093 30.39L24.2843 30.12C24.3443 30.105 24.4943 30.03 24.5393 29.985L29.8493 24.675C30.1643 24.345 30.3593 24.075 30.3743 23.865C30.4043 23.565 30.1043 23.205 29.8493 22.95C29.6093 22.71 29.2643 22.425 28.9643 22.425Z" fill="white"/>
      <path d="M29.8809 27.3749C29.7759 27.3749 29.6709 27.3599 29.5809 27.3299C27.6009 26.7749 26.0259 25.1999 25.4709 23.2199C25.3059 22.6199 25.6509 22.0049 26.2509 21.8249C26.8509 21.6599 27.4659 22.0049 27.6309 22.6049C27.9759 23.8349 28.9509 24.8099 30.1809 25.1549C30.7809 25.3199 31.1259 25.9499 30.9609 26.5499C30.8259 27.0449 30.3759 27.3749 29.8809 27.3749Z" fill="white"/>
    </svg>
  );
}

function WalletTransactionsIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M7.5 10.5C7.5 9.12 8.62 8 10 8H26C27.38 8 28.5 9.12 28.5 10.5V12H7.5V10.5Z"
        fill="white"
      />
      <path
        d="M6 12H30V25.5C30 26.88 28.88 28 27.5 28H8.5C7.12 28 6 26.88 6 25.5V12Z"
        fill="white"
      />
      <path
        d="M22.5 18.75C23.7426 18.75 24.75 19.7574 24.75 21C24.75 22.2426 23.7426 23.25 22.5 23.25C21.2574 23.25 20.25 22.2426 20.25 21C20.25 19.7574 21.2574 18.75 22.5 18.75Z"
        fill="rgba(0,0,0,0.2)"
      />
    </svg>
  );
}

function BankAccountsIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M18 5L5 12.5V14H31V12.5L18 5Z"
        fill="white"
      />
      <path d="M7 16H10V28H7V16Z" fill="white" />
      <path d="M13 16H16V28H13V16Z" fill="white" />
      <path d="M19 16H22V28H19V16Z" fill="white" />
      <path d="M25 16H28V28H25V16Z" fill="white" />
      <path d="M4 28H32V31H4V28Z" fill="white" />
    </svg>
  );
}

function MyCouponsIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M22.3358 27.33H9.15077C8.37077 27.33 7.63575 27.255 6.97575 27.105C6.63075 27.06 6.21077 26.94 5.77577 26.775C3.78077 26.025 1.42578 24.18 1.42578 19.59V11.865C1.42578 6.95996 4.24577 4.14001 9.15077 4.14001H22.3358C26.4758 4.14001 29.1458 6.11997 29.8658 9.71997C30.0008 10.38 30.0608 11.085 30.0608 11.865V19.59C30.0608 24.525 27.2558 27.33 22.3358 27.33ZM9.16574 6.42004C5.47574 6.42004 3.69075 8.20499 3.69075 11.895V19.62C3.69075 22.305 4.63577 23.955 6.57077 24.69C6.87077 24.795 7.15578 24.87 7.42578 24.915C7.99578 25.035 8.55074 25.095 9.16574 25.095H22.3508C26.0408 25.095 27.8257 23.31 27.8257 19.62V11.895C27.8257 11.265 27.7808 10.71 27.6758 10.2C27.1658 7.64998 25.4258 6.42004 22.3508 6.42004H9.16574Z" fill="white"/>
      <path d="M26.8347 31.8299H13.6496C12.3746 31.8299 11.2346 31.6499 10.2596 31.2749C8.05463 30.4499 6.61462 28.7099 6.11962 26.2199C6.04462 25.8449 6.16465 25.455 6.43465 25.2C6.70465 24.93 7.09466 24.825 7.46966 24.915C7.96466 25.02 8.51965 25.0799 9.14965 25.0799H22.3347C26.0247 25.0799 27.8097 23.295 27.8097 19.605V11.8799C27.8097 11.2499 27.7646 10.6949 27.6596 10.1849C27.5846 9.80994 27.7047 9.43495 27.9597 9.16495C28.2297 8.89495 28.6047 8.77493 28.9797 8.86493C32.5797 9.59993 34.5597 12.2699 34.5597 16.3799V24.105C34.5597 29.025 31.7547 31.8299 26.8347 31.8299ZM8.87966 27.3299C9.35966 28.1999 10.0796 28.815 11.0696 29.175C11.7896 29.445 12.6596 29.5799 13.6646 29.5799H26.8496C30.5396 29.5799 32.3246 27.795 32.3246 24.105V16.3799C32.3246 14.0099 31.5896 12.435 30.0746 11.61C30.0746 11.7 30.0746 11.7899 30.0746 11.8799V19.605C30.0746 24.51 27.2546 27.3299 22.3496 27.3299H9.16462C9.05962 27.3299 8.96966 27.3299 8.87966 27.3299Z" fill="white"/>
      <path d="M15.7491 20.835C12.9441 20.835 10.6641 18.555 10.6641 15.75C10.6641 12.945 12.9441 10.665 15.7491 10.665C18.5541 10.665 20.8341 12.945 20.8341 15.75C20.8341 18.555 18.5541 20.835 15.7491 20.835ZM15.7491 12.915C14.1891 12.915 12.9141 14.19 12.9141 15.75C12.9141 17.31 14.1891 18.585 15.7491 18.585C17.3091 18.585 18.5841 17.31 18.5841 15.75C18.5841 14.19 17.3091 12.915 15.7491 12.915Z" fill="white"/>
      <path d="M7.17188 20.1751C6.55687 20.1751 6.04688 19.6651 6.04688 19.0501V12.4501C6.04688 11.8351 6.55687 11.3251 7.17188 11.3251C7.78688 11.3251 8.29688 11.8351 8.29688 12.4501V19.0501C8.29688 19.6651 7.80187 20.1751 7.17188 20.1751Z" fill="white"/>
      <path d="M24.3164 20.1751C23.7014 20.1751 23.1914 19.6651 23.1914 19.0501V12.4501C23.1914 11.8351 23.7014 11.3251 24.3164 11.3251C24.9314 11.3251 25.4414 11.8351 25.4414 12.4501V19.0501C25.4414 19.6651 24.9464 20.1751 24.3164 20.1751Z" fill="white"/>
    </svg>
  );
}

function StatPair({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-start min-w-0 flex-1 basis-[140px] sm:basis-[145px]" style={{ gap: 2 }}>
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 12,
          lineHeight: "18px",
          textTransform: "capitalize",
          color: "#000000",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 16,
          lineHeight: "24px",
          textTransform: "capitalize",
          color: "#000000",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col justify-center items-start hover:opacity-90 transition-opacity min-h-[120px] h-auto sm:h-[120px]"
      style={{
        width: "100%",
        maxWidth: 342.33,
        background: "#CB262E",
        borderRadius: 10,
        padding: 16,
        gap: 24,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ lineHeight: 1 }} aria-hidden>{icon}</span>
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 16,
          lineHeight: "24px",
          textTransform: "capitalize",
          color: "#FFFFFF",
        }}
      >
        {title}
      </span>
    </button>
  );
}

export type PartnerApprovedDashboardPanelProps = {
  title: string;
  type: string;
  statsTitle: string;
  idLabel: string;
  /** Loaded from `getCurrentAffiliate` when the partner is approved. */
  affiliate: GqlCurrentAffiliate | null;
  createCouponHref?: string;
  myCouponsHref?: string;
  walletTransactionsHref?: string;
  bankAccountsHref?: string;
};

export default function PartnerApprovedDashboardPanel({
  title,
  type,
  statsTitle,
  idLabel,
  affiliate,
  createCouponHref = "/coupons",
  myCouponsHref = "/myaccount/coupons",
  walletTransactionsHref = "/myaccount/affiliator-wallet",
  bankAccountsHref = "/myaccount/affiliator-banks",
}: PartnerApprovedDashboardPanelProps) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const idValue = displayId(affiliate?.uuid);
  const totalCommission = formatPartnerMoney(affiliate?.totalCommission, locale);
  const totalPaid = formatPartnerMoney(affiliate?.totalPaid, locale);
  const remainingBalance = formatPartnerMoney(affiliate?.remainingBalance, locale);
  const couponsUsage =
    affiliate?.couponsUsed == null ? "—" : String(affiliate.couponsUsed);
  const trendingCoupon = displayId(affiliate?.trendingCoupon?.uuid);
  const topProduct = displayId(affiliate?.topProduct?.uuid);

  return (
    <AccountPanelSurface className="min-h-0">
      <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
        {title}
      </h1>

      <div
        className="mt-4 w-full border border-black/15 rounded-[10px] p-3 sm:p-4 md:px-4 md:py-[18px]"
      >
        <div className="flex flex-col items-start" style={{ gap: 24 }}>
          <div
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {statsTitle}
          </div>

          <div className="w-full flex justify-between gap-6 flex-wrap">
            <StatPair label={idLabel} value={idValue} />
            <StatPair label={t("partnerStatsType")} value={type} />
          </div>

          <div className="w-full flex justify-between gap-6 flex-wrap">
            <StatPair label={t("partnerTotalCommission")} value={totalCommission} />
            <StatPair label={t("partnerTotalPaid")} value={totalPaid} />
          </div>

          <div className="w-full flex justify-between gap-6 flex-wrap">
            <StatPair label={t("partnerRemainingBalance")} value={remainingBalance} />
            <StatPair label={t("partnerCouponsUsage")} value={couponsUsage} />
          </div>

          <div className="w-full flex justify-between gap-6 flex-wrap">
            <StatPair label={t("partnerTrendingCoupon")} value={trendingCoupon} />
            <StatPair label={t("partnerTopProduct")} value={topProduct} />
          </div>
        </div>
      </div>

      <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ActionCard
          title={t("partnerActionCreateCoupon")}
          icon={<CreateCouponIcon />}
          onClick={() => router.push(createCouponHref)}
        />
        <ActionCard
          title={t("myCoupons")}
          icon={<MyCouponsIcon />}
          onClick={() => router.push(myCouponsHref)}
        />
        <ActionCard
          title={t("partnerActionWallet")}
          icon={<WalletTransactionsIcon />}
          onClick={() => router.push(walletTransactionsHref)}
        />
        <ActionCard
          title={t("partnerActionBankAccounts")}
          icon={<BankAccountsIcon />}
          onClick={() => router.push(bankAccountsHref)}
        />
      </div>
    </AccountPanelSurface>
  );
}


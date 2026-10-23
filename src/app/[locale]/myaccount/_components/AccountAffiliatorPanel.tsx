"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { API_ENDPOINTS } from "@/services/api/api";
import PartnerJoinFormPanel from "./PartnerJoinFormPanel";
import { buildReferralPartnerJoinBody } from "../_lib/referralPartnerJoinBody";
import PartnerApprovedDashboardPanel from "./PartnerApprovedDashboardPanel";
import AccountPanelSurface from "./AccountPanelSurface";
import { usePartnerProgramGraphql } from "../_hooks/usePartnerProgramGraphql";
import { normalizePartnerApplicationStatus } from "../_lib/partnerApplicationStatus";
import { partnerDashboardHref } from "../_lib/partnerDashboardHref";
/* ---------------- Constants ---------------- */
type IntlT = ReturnType<typeof useTranslations>;

function formatPartnerApplicationStatusLabel(raw: string, t: IntlT): string {
  const n = normalizePartnerApplicationStatus(raw);
  if (n === "pending") return t("pending");
  if (n === "accepted") return t("partnerStatusAccepted");
  if (n === "rejected") return t("rejected");
  return raw;
}

export default function AccountAffiliatorPanel() {
  const t = useTranslations();
  const [showForm, setShowForm] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const {
    loading,
    partnerRow,
    program,
    isAffiliateApproved,
    isInfluencerApproved,
    hasAffiliateApplication,
    hasInfluencerApplication,
    hasUnknownPartnerProgram,
    affiliateStatusLabel,
  } = usePartnerProgramGraphql(refreshToken);

  const canShowJoin = useMemo(
    () => !isAffiliateApproved && !hasAffiliateApplication && !hasInfluencerApplication,
    [isAffiliateApproved, hasAffiliateApplication, hasInfluencerApplication],
  );

  if (loading) {
    return (
      <AccountPanelSurface className="min-h-0 lg:min-h-[309px]">
        <div className="h-7 w-64 max-w-full rounded bg-gray-100 animate-pulse" />
        <div className="mt-5 h-24 w-full rounded bg-gray-100 animate-pulse" />
        <div className="mt-8 h-12 w-full max-w-[210px] rounded bg-gray-100 animate-pulse sm:ml-auto" />
      </AccountPanelSurface>
    );
  }

  if (hasUnknownPartnerProgram) {
    return (
      <AccountPanelSurface className="min-h-0 lg:min-h-[309px]">
        <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
          {t("partnerProgramAffiliate")}
        </h1>
        <p className="mt-3 max-w-[710px] font-sans text-xs sm:text-sm leading-[18px] text-black">
          {t("partnerProgramUnknownMessage")}
        </p>
      </AccountPanelSurface>
    );
  }

  if (canShowJoin && showForm) {
    return (
      <PartnerJoinFormPanel
        title={t("affiliateJoinHeading")}
        submitEndpoint={API_ENDPOINTS.AFFILIATE_REFERRAL_REGISTER}
        buildSubmitBody={buildReferralPartnerJoinBody}
        submitSuccessText={
          t("requestSubmittedSuccessfully") || "Request submitted successfully."
        }
        onSubmitSuccess={() => setRefreshToken((n) => n + 1)}
      />
    );
  }

  if (hasAffiliateApplication && !isAffiliateApproved && !isInfluencerApproved) {
    const label = formatPartnerApplicationStatusLabel(
      String(affiliateStatusLabel || "").trim() || "pending",
      t,
    );
    return (
      <AccountPanelSurface className="min-h-0 lg:min-h-[309px]">
        <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
          {t("partnerProgramAffiliate")}
        </h1>
        <p className="mt-3 max-w-[710px] font-sans text-xs sm:text-sm leading-[18px] text-black">
          {t("affiliateAlreadyAppliedLead")}{" "}
          <span className="font-semibold capitalize">{label}</span>.
          {normalizePartnerApplicationStatus(affiliateStatusLabel) === "rejected"
            ? ` ${t("partnerApplicationRejectedHelp")}`
            : ` ${t("partnerApplicationReviewNotice")}`}
        </p>
      </AccountPanelSurface>
    );
  }

  if (isAffiliateApproved) {
    return (
      <>
        <PartnerApprovedDashboardPanel
          title={t("affiliateDashboardPageTitle")}
          type={t("partnerRoleAffiliate")}
          statsTitle={t("affiliateStatsTitle")}
          idLabel={t("affiliateIdLabel")}
          affiliate={partnerRow}
          createCouponHref="/myaccount/affiliator-create-coupon"
          myCouponsHref="/myaccount/affiliator-coupons"
          walletTransactionsHref="/myaccount/affiliator-wallet"
          bankAccountsHref="/myaccount/affiliator-banks"
        />
      </>
    );
  }

  return (
    <AccountPanelSurface className="min-h-0 lg:min-h-[309px]">
      <h1 className="font-sans font-medium text-lg sm:text-xl leading-7 text-[#DB4444]">
        {t("affiliateJoinHeading")}
      </h1>

      {canShowJoin ? (
        <>
          <p className="mt-3 max-w-[710px] font-sans text-xs sm:text-sm leading-[18px] text-black">
            {t("affiliateMarketingIntro")}
          </p>

          <div className="w-full flex justify-stretch sm:justify-end mt-6 sm:mt-8">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full sm:w-[210px] h-12 sm:h-[50px] flex items-center justify-center hover:opacity-90 bg-[#CB262E] rounded-[5px] font-sans font-semibold text-base leading-6 capitalize text-white px-6"
            >
              {t("startNow") || "Start Now"}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-5">
          <p className="max-w-[710px] font-sans text-xs sm:text-sm leading-[18px] text-black">
            {t("alreadyRegisteredPartnerProgram")}
          </p>
          <div className="w-full flex justify-stretch sm:justify-end mt-6 sm:mt-8">
            <Link
              href={partnerDashboardHref(program)}
              className="w-full sm:w-[210px] h-12 sm:h-[50px] flex items-center justify-center hover:opacity-90 bg-[#CB262E] rounded-[5px] font-sans font-semibold text-base leading-6 capitalize text-white px-6"
            >
              {t("openDashboard")}
            </Link>
          </div>
        </div>
      )}
    </AccountPanelSurface>
  );
}

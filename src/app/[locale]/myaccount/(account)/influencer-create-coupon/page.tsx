"use client";

import { useTranslations } from "next-intl";
import { API_ENDPOINTS } from "@/services/api/api";
import PartnerCreateCouponPanel from "../../_components/PartnerCreateCouponPanel";

export default function InfluencerCreateCouponPage() {
  const t = useTranslations();
  return (
    <PartnerCreateCouponPanel
      title={t("partnerActionCreateCoupon")}
      submitEndpoint={API_ENDPOINTS.REFERRAL_COUPON_CREATE}
    />
  );
}

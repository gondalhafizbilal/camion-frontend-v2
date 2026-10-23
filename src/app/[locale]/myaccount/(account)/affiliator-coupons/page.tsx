"use client";

import { useCallback } from "react";
import Cookies from "js-cookie";
import PartnerCouponsPanel from "../../_components/PartnerCouponsPanel";
import { fetchAllCurrentAffiliateCoupons } from "@/services/graphql";
import { gqlAffiliateCouponToPartnerRow } from "../../_lib/gqlAffiliateCouponToPartnerRow";

export default function AffiliatorCouponsPage() {
  const loadCoupons = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) return [];
    const rows = await fetchAllCurrentAffiliateCoupons(token);
    return rows.map(gqlAffiliateCouponToPartnerRow);
  }, []);

  return (
    <PartnerCouponsPanel
      loadCoupons={loadCoupons}
      statisticsHref="/myaccount/affiliator-coupon-statistics"
    />
  );
}

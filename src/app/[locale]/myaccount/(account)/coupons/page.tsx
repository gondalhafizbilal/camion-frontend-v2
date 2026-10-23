"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "@/i18n/navigation";
import { fetchCurrentAffiliate } from "@/services/graphql";
import { isPartnerApplicationAccepted } from "../../_lib/partnerApplicationStatus";

export default function CouponsResolverPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const token = Cookies.get("token");
      if (!token) {
        router.replace("/myaccount/affiliator-coupons");
        return;
      }
      try {
        const data = await fetchCurrentAffiliate(token);
        const row = data?.getCurrentAffiliate;
        const isInfluencer = String(row?.type ?? "").trim().toLowerCase() === "influencer";
        const isAccepted = isPartnerApplicationAccepted(row?.status);

        if (isInfluencer && isAccepted) {
          router.replace("/myaccount/influencer-coupons");
          return;
        }
        router.replace("/myaccount/affiliator-coupons");
      } catch {
        router.replace("/myaccount/affiliator-coupons");
      }
    };
    void run();
  }, [router]);

  return <div className="w-full" />;
}

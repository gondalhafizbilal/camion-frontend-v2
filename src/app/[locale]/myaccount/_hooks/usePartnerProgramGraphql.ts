"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import { fetchCurrentAffiliate } from "@/services/graphql";
import type { GqlCurrentAffiliate } from "@/services/graphql";
import { resolvePartnerProgram } from "../_lib/resolvePartnerProgram";
import { isPartnerApplicationAccepted } from "../_lib/partnerApplicationStatus";

export function usePartnerProgramGraphql(refreshToken: number) {
  const [loading, setLoading] = useState(true);
  const [partnerRow, setPartnerRow] = useState<GqlCurrentAffiliate | null>(null);
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const onSession = () => setSessionEpoch((e) => e + 1);
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  }, []);

  const roleCookie = useMemo(() => {
    void sessionEpoch;
    void refreshToken;
    const r = Cookies.get("role")?.trim();
    return r || null;
  }, [sessionEpoch, refreshToken]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setPartnerRow(null);
      setLoading(false);
      return;
    }

    const run = async () => {
      if (initialLoadRef.current) setLoading(true);
      try {
        const affRes = await fetchCurrentAffiliate(token);
        setPartnerRow(affRes.getCurrentAffiliate ?? null);
      } finally {
        if (initialLoadRef.current) {
          setLoading(false);
          initialLoadRef.current = false;
        }
      }
    };

    void run();
  }, [refreshToken, sessionEpoch]);

  const program = useMemo(
    () => resolvePartnerProgram(roleCookie, partnerRow),
    [roleCookie, partnerRow],
  );

  const accepted = isPartnerApplicationAccepted(partnerRow?.status);

  const isAffiliateApproved = Boolean(accepted && program === "affiliate");
  const isInfluencerApproved = Boolean(accepted && program === "influencer");
  const hasAffiliateApplication = Boolean(partnerRow && program === "affiliate");
  const hasInfluencerApplication = Boolean(partnerRow && program === "influencer");
  const hasUnknownPartnerProgram = Boolean(partnerRow && !program);

  return {
    loading,
    partnerRow,
    program,
    isAffiliateApproved,
    isInfluencerApproved,
    hasAffiliateApplication,
    hasInfluencerApplication,
    hasUnknownPartnerProgram,
    affiliateStatusLabel:
      partnerRow && program === "affiliate" ? String(partnerRow.status ?? "") : "",
    influencerStatusLabel:
      partnerRow && program === "influencer" ? String(partnerRow.status ?? "") : "",
  };
}

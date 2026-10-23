"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { Frown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import ReturnRefundRequestDetailCenterContent from "@/app/[locale]/myaccount/_components/ReturnRefundRequestDetailCenterContent";
import { fetchCurrentCustomerReturnRequest } from "@/services/graphql";
import type { GqlReturnRequest } from "@/services/graphql";

const sectionStyle: CSSProperties = {
  background: "#FFFFFF",
  boxShadow: "0px 1px 13px rgba(0, 0, 0, 0.05)",
  borderRadius: 4,
  minHeight: 400,
  padding: "24px clamp(16px, 4vw, 40px) 40px",
};

export default function ReturnRefundRequestDetailPage() {
  const params = useParams();
  const uuidParam = params?.uuid;
  const uuid = Array.isArray(uuidParam) ? uuidParam[0] : uuidParam;
  const [req, setReq] = useState<GqlReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();
  const locale = useLocale();
  const token = Cookies.get("token");

  const silentRefetch = useCallback(async () => {
    if (!token || !uuid) return;
    try {
      const data = await fetchCurrentCustomerReturnRequest(
        {
          uuid: String(uuid),
          currency: "qar",
          language: locale === "ar" ? "ar" : "en",
        },
        token ?? null,
      );
      const r = data?.getCurrentCustomerReturnRequest ?? null;
      if (r) setReq(r);
    } catch {
      /* keep existing req */
    }
  }, [uuid, token, locale]);

  useEffect(() => {
    const fetchOne = async () => {
      try {
        if (!token) throw new Error("Missing auth token");
        const data = await fetchCurrentCustomerReturnRequest(
          {
            uuid: String(uuid),
            currency: "qar",
            language: locale === "ar" ? "ar" : "en",
          },
          token ?? null,
        );
        const r = data?.getCurrentCustomerReturnRequest ?? null;
        if (!r) throw new Error("Return request not found");
        setReq(r);
      } catch (err) {
        console.error("Error fetching return request:", err);
        toast.error(t("loadReturnRequestError") || "Failed to load return request.");
      } finally {
        setLoading(false);
      }
    };
    if (uuid) void fetchOne();
  }, [uuid, token, t, locale]);

  if (loading) {
    return (
      <section className="w-full" style={sectionStyle}>
        <span
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontSize: 14,
          }}
        >
          {t("loadingReturnRequest") || "Loading return request..."}
        </span>
      </section>
    );
  }

  if (!req) {
    return (
      <section className="w-full" style={sectionStyle}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-gray-600">
          <Frown size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-semibold">
            {t("noReturnRequestFound") || "No return request found"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full" style={sectionStyle}>
      <div className="mt-0 flex w-full justify-center print:mt-0">
        <ReturnRefundRequestDetailCenterContent
          req={req}
          onEvidenceUploaded={() => void silentRefetch()}
        />
      </div>
    </section>
  );
}

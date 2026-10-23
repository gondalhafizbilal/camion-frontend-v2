"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { toast } from "@/componentsedit/toast";
import { setLoginFlowToken } from "@/services/auth/loginFlowToken";
import { phoneLoginJsonFromE164 } from "@/services/auth/otpLoginPayload";
import { getGuestUuidForCustomerAuth } from "@/lib/auth/isGuestClient";
import { buildAuthVerifyHref, peekAuthReturnTo, setAuthReturnTo } from "@/lib/auth/authReturnToClient";
import { pushAuthCheckoutGtmEvent } from "@/componentsedit/analytics/authCheckoutEvents";

type Method = "email" | "phone";

export default function ChooseVerificationCenterContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const formDir = locale === "ar" ? "rtl" : "ltr";

  const [loadingMethod, setLoadingMethod] = useState<Method | null>(null);

  const email = Cookies.get("email") || "";
  const phone = Cookies.get("phone") || "";

  const cookieOptions = useMemo(() => {
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    return {
      path: "/",
      sameSite: "Lax" as const,
      ...(isSecure ? { secure: true as const } : {}),
    };
  }, []);

  useEffect(() => {
    if (!email || !phone) {
      router.replace("/auth/signup");
    }
  }, [email, phone, router]);

  const requestOtp = async (method: Method) => {
    if (loadingMethod) return;
    setLoadingMethod(method);
    try {
      const guestUUID = getGuestUuidForCustomerAuth();
      let res: Response;
      if (method === "email") {
        res = await apiFetch(API_ENDPOINTS.LOGIN_EMAIL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailAddress: email,
            ...(guestUUID ? { guestUUID } : {}),
          }),
        });
      } else {
        const body = phoneLoginJsonFromE164(phone);
        res = await apiFetch(API_ENDPOINTS.LOGIN_PHONE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode: body.countryCode,
            phoneNumber: body.phoneNumber,
            ...(guestUUID ? { guestUUID } : {}),
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (typeof data?.error === "string" ? data.error : data?.error?.message) ||
            "Unable to send verification code",
        );
      }

      const flowToken = data?.token;
      if (typeof flowToken !== "string" || !flowToken) {
        throw new Error(data?.message || "Unable to send verification code");
      }
      const returnTo = peekAuthReturnTo();
      setLoginFlowToken(flowToken);
      if (returnTo) setAuthReturnTo(returnTo);

      Cookies.set("loginType", method, cookieOptions);
      pushAuthCheckoutGtmEvent("otp_requested", {
        source: "choose_verification",
        method,
      });
      const msg = method === "email" ? t("codeSentToEmailSuccess") : t("codeSentToPhoneSuccess");
      toast.success(msg, { position: "top-center", autoClose: 1500 });
      setTimeout(() => router.push(buildAuthVerifyHref(returnTo)), 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("somethingWentWrong");
      toast.error(msg, { position: "top-center" });
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <div dir={formDir} className="w-full flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-[420px] bg-white rounded-[6px] border border-black/10 shadow-[0px_1px_13px_rgba(0,0,0,0.05)] p-6 sm:p-8">
        <h1 className="font-['Inter'] font-medium tracking-[0.04em] text-black text-2xl sm:text-3xl leading-8 sm:leading-9">
          {t("chooseVerificationMethod")}
        </h1>

        <p className="mt-3 font-sans text-sm sm:text-base leading-6 text-black/80">
          {t("chooseVerificationMethodDesc")}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => requestOtp("email")}
            disabled={loadingMethod != null}
            className="w-full h-[52px] rounded-[5px] bg-[#CB262E] text-white font-sans font-medium text-[16px] leading-[24px] hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loadingMethod === "email" ? t("sendingCode") : t("verifyByEmail")}
          </button>

          <button
            type="button"
            onClick={() => requestOtp("phone")}
            disabled={loadingMethod != null}
            className="w-full h-[52px] rounded-[5px] bg-white text-[#101010] border border-black/20 font-sans font-medium text-[16px] leading-[24px] hover:bg-black/[0.02] transition-colors disabled:opacity-60"
          >
            {loadingMethod === "phone" ? t("sendingCode") : t("verifyByPhone")}
          </button>
        </div>
      </div>
    </div>
  );
}


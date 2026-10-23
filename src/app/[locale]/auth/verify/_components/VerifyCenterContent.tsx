"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import Image from "@/componentsedit/StaticImage";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { API_ENDPOINTS } from "@/services/api/api";
import { toast } from "@/componentsedit/toast";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/services/api/apiClient";
import { useNotifications } from "@/hooks/useNotifications";
import AuthResponsiveLogo from "@/componentsedit/auth/AuthResponsiveLogo";
import {
  clearLoginFlowToken,
  getLoginFlowToken,
  setLoginFlowToken,
} from "@/services/auth/loginFlowToken";
import { phoneLoginJsonFromE164 } from "@/services/auth/otpLoginPayload";
import { notifySessionUpdated } from "@/services/auth/guestRegister";
import { getGuestUuidForCustomerAuth } from "@/lib/auth/isGuestClient";
import {
  captureAuthReturnToFromUrl,
  navigateAfterAuth,
  resolveAuthReturnPath,
} from "@/lib/auth/authReturnToClient";
import {
  getSafeGtmErrorCode,
  pushAuthCheckoutGtmEvent,
} from "@/componentsedit/analytics/authCheckoutEvents";

type VerifyErrors = Partial<Record<"code", string>>;
type VerifyTouched = Partial<Record<"code", boolean>>;

export default function VerifyCenterContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const formDir = locale === "ar" ? "rtl" : "ltr";
  const { requestPermission } = useNotifications();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errors, setErrors] = useState<VerifyErrors>({});
  const [touched, setTouched] = useState<VerifyTouched>({});

  useEffect(() => {
    captureAuthReturnToFromUrl();
  }, []);

  useEffect(() => {
    const savedEmail = Cookies.get("email");
    const savedPhone = Cookies.get("phone");
    const savedLoginType = Cookies.get("loginType");
    const hasCustomerSession =
      savedLoginType === "customer" && Boolean(Cookies.get("token")?.trim());
    if (!savedEmail && !savedPhone) {
      const checkAgain = (attempt = 0) => {
        if (attempt >= 3) {
          if (!hasCustomerSession) router.push("/auth/login");
          return;
        }
        setTimeout(
          () => {
            const retryEmail = Cookies.get("email");
            const retryPhone = Cookies.get("phone");
            if (retryEmail || retryPhone) {
              if (!getLoginFlowToken()) {
                const isCustomer =
                  Cookies.get("loginType") === "customer" &&
                  Boolean(Cookies.get("token")?.trim());
                if (!isCustomer) router.push("/auth/login");
                return;
              }
              setLoginType(retryPhone && !retryEmail ? "phone" : "email");
              if (retryEmail) setEmail(retryEmail);
              if (retryPhone) setPhone(retryPhone);
            } else {
              checkAgain(attempt + 1);
            }
          },
          100 * (attempt + 1),
        );
      };
      checkAgain();
      return;
    }
    if (!getLoginFlowToken()) {
      if (!hasCustomerSession) router.push("/auth/login");
      return;
    }
    let determinedLoginType: string | undefined = savedLoginType;
    if (
      !determinedLoginType ||
      determinedLoginType === "undefined" ||
      determinedLoginType === "null"
    ) {
      if (savedPhone && !savedEmail) determinedLoginType = "phone";
      else if (savedEmail && !savedPhone) determinedLoginType = "email";
      else if (savedPhone && savedEmail) determinedLoginType = "phone";
      else determinedLoginType = "email";
    }
    if (determinedLoginType !== "phone" && determinedLoginType !== "email") {
      determinedLoginType = savedPhone ? "phone" : "email";
    }
    setLoginType(determinedLoginType === "phone" ? "phone" : "email");
    if (savedEmail) setEmail(savedEmail);
    if (savedPhone) setPhone(savedPhone);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const validateCode = (val: string) => {
    if (!val) return t("verificationCodeRequired");
    if (val.length !== 6) return t("codeMustBe6Digits");
    if (!/^\d+$/.test(val)) return t("codeMustBeNumbers");
    return "";
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
  };

  const handleCodeBlur = () => {
    setTouched((prev) => ({ ...prev, code: true }));
    const error = validateCode(code);
    setErrors((prev) => ({ ...prev, code: error }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const codeError = validateCode(code);
    setErrors({ code: codeError });
    setTouched({ code: true });
    if (codeError) return;

    const flowToken = getLoginFlowToken();
    if (!flowToken) {
      toast.error(t("somethingWentWrong"), { position: "top-center" });
      router.push("/auth/login");
      return;
    }

    const savedReturnPath = resolveAuthReturnPath(null, "/");

    setLoading(true);
    let failureCode = "network_error";
    let failureStage = "verify_api";
    try {
      const verifyUrl =
        loginType === "phone" ? API_ENDPOINTS.VERIFY_PHONE : API_ENDPOINTS.VERIFY_EMAIL;
      const res = await apiFetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: flowToken, secret: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        failureCode = getSafeGtmErrorCode(data, res.status);
        throw new Error(
          data?.message ||
            (typeof data?.error === "string" ? data.error : data?.error?.message) ||
            "Verification failed",
        );
      }
      failureStage = "session";
      failureCode = "session_establishment_failed";

      const isSecure =
        typeof window !== "undefined" && window.location.protocol === "https:";
      const cookieOptions = {
        expires: 7,
        path: "/",
        sameSite: "Lax" as const,
        ...(isSecure ? { secure: true as const } : {}),
      };
      const customer = (data?.customer ?? data?.user) as
        | {
            uuid?: string;
            id?: string;
            emailAddress?: string;
            email?: string;
            phoneNumber?: string;
            phone?: string;
            fullName?: string;
            role?: string | null;
          }
        | undefined;
      const sessionToken =
        typeof data?.accessToken === "string"
          ? data.accessToken
          : typeof data?.token === "string"
            ? data.token
            : "";
      if (!sessionToken) {
        failureCode = "missing_session_token";
        throw new Error(data?.message || "Verification failed: missing session token");
      }

      Cookies.set("token", sessionToken, cookieOptions);
      Cookies.set("id", String(customer?.uuid ?? customer?.id ?? ""), cookieOptions);
      Cookies.set(
        "email",
        String(customer?.emailAddress ?? customer?.email ?? email ?? ""),
        cookieOptions,
      );
      Cookies.set("fullName", String(customer?.fullName ?? ""), cookieOptions);
      Cookies.set(
        "phone",
        String(customer?.phoneNumber ?? customer?.phone ?? phone ?? ""),
        cookieOptions,
      );
      Cookies.set("loginType", "customer", cookieOptions);
      Cookies.set("auth_method", "customer", cookieOptions);
      const roleVal =
        customer?.role != null ? String(customer.role).trim() : "";
      if (roleVal) {
        Cookies.set("role", roleVal, cookieOptions);
      } else {
        Cookies.remove("role", { path: "/" });
      }
      clearLoginFlowToken();
      notifySessionUpdated();
      pushAuthCheckoutGtmEvent("otp_verified", {
        source: "auth_verify",
        method: loginType,
      });

      toast.success(t("verificationSuccessful"), {
        position: "top-center",
        autoClose: 1500,
      });
      navigateAfterAuth(locale, "/", savedReturnPath);
      setTimeout(() => requestPermission(), 3000);
    } catch (err: unknown) {
      pushAuthCheckoutGtmEvent("otp_failed", {
        source: "auth_verify",
        method: loginType,
        error_code: failureCode,
        error_stage: failureStage,
      });
      const msg = err instanceof Error ? err.message : t("verificationFailed");
      setErrors({ code: msg || t("verificationFailed") });
      toast.error(err instanceof Error ? err.message : t("somethingWentWrong"), {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendCooldown(60);
      const guestUUID = getGuestUuidForCustomerAuth();
      let res: Response;
      if (loginType === "phone") {
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
      } else {
        res = await apiFetch(API_ENDPOINTS.LOGIN_EMAIL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailAddress: email,
            ...(guestUUID ? { guestUUID } : {}),
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (typeof data?.error === "string" ? data.error : data?.error?.message) ||
            "Failed to resend code",
        );
      }
      const newFlowToken = data?.token;
      if (typeof newFlowToken !== "string" || !newFlowToken) {
        throw new Error(data?.message || "Failed to resend code");
      }
      setLoginFlowToken(newFlowToken);
      pushAuthCheckoutGtmEvent("otp_requested", {
        source: "otp_resend",
        method: loginType,
      });
      const message =
        loginType === "phone" ? t("codeResentToPhone") : t("codeResentToEmail");
      toast.success(message, { position: "top-center" });
    } catch (err: unknown) {
      setResendCooldown(0);
      toast.error(err instanceof Error ? err.message : t("failedToResendCode"), {
        position: "top-center",
      });
    }
  };

  const contactDisplay =
    loginType === "phone" ? phone || t("yourPhone") : email || t("yourEmail");

  return (
    <div dir="ltr" className="relative w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Mobile only (< md): same watermark as login / signup */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 block w-full overflow-hidden md:hidden"
        aria-hidden
      >
        <div
          className="relative w-full max-w-full translate-y-[14%]"
          style={{ aspectRatio: "375/417" }}
        >
          <Image
            src="/assets/icons/vector-mobile-watermark.svg"
            alt=""
            fill
            className="object-contain object-bottom"
            sizes="100vw"
            unoptimized
          />
        </div>
      </div>

      <div className="relative z-[1] flex w-full min-w-0 max-w-full flex-col overflow-x-hidden lg:z-auto lg:flex-row lg:items-end">
        <AuthResponsiveLogo />

        {/* Side vector: desktop (lg+) only — overflow clips like signup / login */}
        <div className="hidden w-full shrink-0 items-end justify-start self-stretch overflow-hidden lg:flex lg:w-[55%]">
          <div className="relative h-[calc(100vh-200px)] min-h-[700px] w-full overflow-hidden lg:-mb-1">
            <Image
              src="/assets/icons/vector.svg"
              alt="Side Graphic"
              fill
              className="origin-[0%_-100%] scale-110 object-contain object-left-bottom"
              priority
              sizes="55vw"
            />
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-center px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 md:px-8 md:py-12 lg:w-[45%] lg:items-start lg:pb-[15%] lg:pl-[8%] lg:pr-6 lg:pt-16">
          <div
            dir={formDir}
            lang={locale}
            className="flex w-full max-w-[370px] flex-col items-center gap-6 sm:gap-8 lg:gap-10"
          >
            <div className="flex w-full flex-col gap-4 sm:gap-5 lg:gap-6">
              <h1 className="w-full text-center font-['Inter'] font-medium tracking-[0.04em] text-black lg:text-start text-[1.625rem] leading-8 sm:text-3xl sm:leading-9 lg:text-[36px] lg:leading-[30px]">
                {t("verificationCode")}
              </h1>
              <p className="w-full text-start font-sans text-sm leading-6 text-black sm:text-base lg:text-start">
                {t("pleaseEnterCodeSentTo")}{" "}
                <span className="break-all font-medium text-black">{contactDisplay}</span>
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col items-stretch gap-6 sm:gap-8 lg:gap-10"
            >
              {errors.code && touched.code && (
                <p id="code-error" className="w-full text-sm text-red-600" role="alert">
                  {errors.code}
                </p>
              )}

              <div className="flex w-full flex-col gap-2">
                <label
                  htmlFor="verify-code"
                  className="w-full text-start font-sans text-sm leading-6 text-black opacity-40 sm:text-base sm:leading-6"
                >
                  {t("enterVerificationCode")}
                </label>
                <input
                  id="verify-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("codePlaceholder")}
                  value={code}
                  onChange={handleCodeChange}
                  onBlur={handleCodeBlur}
                  aria-invalid={touched.code && !!errors.code}
                  aria-describedby={
                    touched.code && errors.code ? "code-error" : undefined
                  }
                  className="w-full border-b border-black/50 bg-transparent pb-2 font-sans text-base leading-6 text-black outline-none transition-colors placeholder:text-black/40 focus:border-[#CB262E]"
                />
              </div>

              <div className="flex w-full flex-col gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[50px] w-full flex-row items-center justify-center rounded-[5px] bg-[#CB262E] font-sans text-base font-medium leading-6 text-white transition-opacity hover:opacity-95 disabled:opacity-50 lg:h-14"
                >
                  {loading ? t("verifying") : t("verify")}
                </button>
                <div className="text-center lg:text-start">
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={handleResend}
                    className="font-sans text-sm text-[#CB262E] hover:underline disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                  >
                    {resendCooldown > 0
                      ? t("resendCodeWithTimer", { seconds: resendCooldown })
                      : t("resendCode")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

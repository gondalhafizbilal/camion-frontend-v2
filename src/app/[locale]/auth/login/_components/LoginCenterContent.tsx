"use client";

import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import Image from "@/componentsedit/StaticImage";
import Cookies from "js-cookie";
import { Link, useRouter } from "@/i18n/navigation";
import { API_ENDPOINTS } from "@/services/api/api";
import { toast } from "@/componentsedit/toast";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/services/api/apiClient";
import AuthResponsiveLogo from "@/componentsedit/auth/AuthResponsiveLogo";
import {
  persistGuestAuthCookies,
  tryRegisterGuestClient,
} from "@/services/auth/guestRegister";
import {
  buildAuthVerifyHref,
  captureAuthReturnToFromUrl,
  peekAuthReturnTo,
  setAuthReturnTo,
} from "@/lib/auth/authReturnToClient";
import { setOauthReturnLocaleBeforeProviderRedirect } from "@/lib/auth/oauthReturnLocaleClient";
import { setLoginFlowToken } from "@/services/auth/loginFlowToken";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import CountryCodeCombobox from "@/componentsedit/auth/CountryCodeCombobox";
import { getGuestUuidForCustomerAuth } from "@/lib/auth/isGuestClient";
import { pushAuthCheckoutGtmEvent } from "@/componentsedit/analytics/authCheckoutEvents";

const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 48 48"
    className="shrink-0"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M24 9.5c3.54 0 6.68 1.22 9.16 3.22l6.85-6.85C35.9 2.38 30.38 0 24 0 14.62 0 6.44 5.38 2.56 13.22l7.98 6.2C12.48 13.1 17.77 9.5 24 9.5z"
    />
    <path
      fill="#34A853"
      d="M46.1 24.5c0-1.7-.15-3.34-.43-4.93H24v9.32h12.43c-.54 2.92-2.18 5.4-4.6 7.06l7.03 5.46C43.91 37.14 46.1 31.27 46.1 24.5z"
    />
    <path
      fill="#FBBC05"
      d="M10.54 28.58a14.5 14.5 0 010-9.16l-7.98-6.2a24 24 0 000 21.56l7.98-6.2z"
    />
    <path
      fill="#EA4335"
      d="M24 48c6.38 0 11.74-2.1 15.66-5.7l-7.03-5.46c-1.95 1.32-4.46 2.1-8.63 2.1-6.23 0-11.52-3.6-13.46-8.72l-7.98 6.2C6.44 42.62 14.62 48 24 48z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
    <path
      fill="#3B5998"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const socialBtnClass =
  "box-border flex flex-row justify-center items-center gap-2 sm:gap-3 w-full min-h-[48px] h-[50px] px-2 sm:px-3 bg-white border border-black rounded-[5px] font-sans font-medium text-[#101010] text-sm leading-5 sm:text-base sm:leading-6 hover:bg-black/[0.02] transition-colors";

type LoginFieldErrors = Partial<
  Record<"emailOrPhone" | "phoneLocal" | "general", string>
>;
type LoginTouched = Partial<Record<"emailOrPhone" | "phoneLocal", boolean>>;

export default function LoginCenterContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const formDir = locale === "ar" ? "rtl" : "ltr";
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+974");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [touched, setTouched] = useState<LoginTouched>({});
  const lastEditedChannelRef = useRef<"email" | "phone" | null>(null);

  useEffect(() => {
    captureAuthReturnToFromUrl();
  }, []);

  const disablePhoneRow = emailOrPhone.trim().length > 0;
  const disableEmailField = phoneLocal.trim().length > 0;

  /** Browser autofill can populate both fields; keep a single login channel. */
  useEffect(() => {
    const e = emailOrPhone.trim();
    const p = phoneLocal.trim();
    if (!e || !p) return;
    if (lastEditedChannelRef.current === "phone") {
      setEmailOrPhone("");
    } else {
      setPhoneLocal("");
    }
  }, [emailOrPhone, phoneLocal]);

  const validateLoginEmail = (value: string) => {
    if (!value.trim()) return t("emailRequired");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim()) ? "" : t("invalidEmail");
  };

  const validateLocalPhone = (local: string) => {
    const digits = local.replace(/\D/g, "");
    if (!digits) return t("invalidPhone");
    const full = `${countryCode}${digits}`;
    try {
      return isValidPhoneNumber(full) ? "" : t("invalidPhone");
    } catch {
      return t("invalidPhone");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const top = emailOrPhone.trim();
    const local = phoneLocal.trim();
    let generalError = "";
    let cookiePhone = "";

    if (top && local) {
      generalError = t("loginUseOneMethodOnly");
      setErrors({ general: generalError });
      setTouched({ emailOrPhone: true, phoneLocal: true });
      toast.error(generalError, { position: "top-center" });
      return;
    }

    if (top) {
      const err = validateLoginEmail(top);
      if (err) {
        setErrors({ emailOrPhone: err });
        setTouched({ emailOrPhone: true, phoneLocal: true });
        return;
      }
    } else if (local) {
      const err = validateLocalPhone(local);
      if (err) {
        setErrors({ phoneLocal: err });
        setTouched({ emailOrPhone: true, phoneLocal: true });
        return;
      }
      const digits = local.replace(/\D/g, "");
      try {
        const parsed = parsePhoneNumber(`${countryCode}${digits}`);
        cookiePhone = parsed?.format("E.164") || `${countryCode}${digits}`;
      } catch {
        cookiePhone = `${countryCode}${digits}`;
      }
    } else {
      generalError = t("enterEmailOrPhoneOrLocal");
      setErrors({ general: generalError });
      setTouched({ emailOrPhone: true, phoneLocal: true });
      toast.error(generalError, { position: "top-center" });
      return;
    }

    setErrors({});
    setLoading(true);
    const guestUUID = getGuestUuidForCustomerAuth();
    try {
      let res: Response;
      if (top) {
        res = await apiFetch(API_ENDPOINTS.LOGIN_EMAIL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailAddress: top,
            ...(guestUUID ? { guestUUID } : {}),
          }),
        });
      } else {
        const digits = local.replace(/\D/g, "");
        res = await apiFetch(API_ENDPOINTS.LOGIN_PHONE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode,
            phoneNumber: digits,
            ...(guestUUID ? { guestUUID } : {}),
          }),
        });
      }

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        const serverOrRateLimited = res.status >= 500 || res.status === 429;
        const msg = serverOrRateLimited
          ? t("somethingWentWrong")
          : top
            ? t("invalidEmail")
            : t("invalidPhone");
        setTouched({ emailOrPhone: true, phoneLocal: true });
        if (serverOrRateLimited) {
          setErrors({ general: msg });
        } else if (top) {
          setErrors({ emailOrPhone: msg });
        } else {
          setErrors({ phoneLocal: msg });
        }
        toast.error(msg, { position: "top-center" });
        return;
      }

      const flowToken = data?.token;
      if (typeof flowToken !== "string" || !flowToken) {
        const msg = t("somethingWentWrong");
        setErrors({ general: msg });
        toast.error(msg, { position: "top-center" });
        return;
      }
      const savedReturn = peekAuthReturnTo();
      setLoginFlowToken(flowToken);
      if (savedReturn) setAuthReturnTo(savedReturn);

      const isSecure =
        typeof window !== "undefined" && window.location.protocol === "https:";
      const cookieOptions = {
        path: "/",
        sameSite: "Lax" as const,
        ...(isSecure ? { secure: true as const } : {}),
      };
      if (top) {
        Cookies.set("email", top, cookieOptions);
        Cookies.remove("phone", { path: "/" });
        Cookies.set("loginType", "email", cookieOptions);
      } else {
        Cookies.set("phone", cookiePhone, cookieOptions);
        Cookies.remove("email", { path: "/" });
        Cookies.set("loginType", "phone", cookieOptions);
      }

      pushAuthCheckoutGtmEvent("otp_requested", {
        source: "login",
        method: top ? "email" : "phone",
      });
      const message = top ? t("codeSentToEmailSuccess") : t("codeSentToPhoneSuccess");
      toast.success(message, { position: "top-center", autoClose: 1500 });
      setTimeout(() => router.push(buildAuthVerifyHref(savedReturn)), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("somethingWentWrong");
      setErrors((prev) => ({ ...prev, general: msg }));
      toast.error(msg, { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH_GOOGLE);
      const data = await res.json();
      if (res.ok && data?.redirectUrl) {
        setOauthReturnLocaleBeforeProviderRedirect(locale);
        window.location.href = data.redirectUrl;
      }
      else toast.error(data?.message || t("failedToGetGoogleSignIn"));
    } catch {
      toast.error(t("errorDuringGoogleSignIn"));
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH_FACEBOOK);
      const data = await res.json();
      if (res.ok && data?.redirectUrl) {
        setOauthReturnLocaleBeforeProviderRedirect(locale);
        window.location.href = data.redirectUrl;
      }
      else toast.error(data?.message || t("failedToGetFacebookSignIn"));
    } catch {
      toast.error(t("errorDuringFacebookSignIn"));
    }
  };

  const handleContinueAsGuest = useCallback(async () => {
    setGuestLoading(true);
    try {
      const data = await tryRegisterGuestClient();
      if (data) {
        persistGuestAuthCookies(data);
        toast.success(t("guestSessionReady"), { position: "top-center", autoClose: 1500 });
        setTimeout(() => router.push("/"), 400);
        return;
      }
      // API down / invalid response / timeout — still let the user use the storefront.
      router.push("/");
    } finally {
      setGuestLoading(false);
    }
  }, [router, t]);

  return (
    <div dir="ltr" className="relative w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Mobile only (< md): 375×417 watermark — fill-opacity 0.05 in SVG, full width */}
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

        {/* Side vector: desktop (lg+) only — hidden on mobile / tablet */}
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
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col items-stretch gap-3"
            >
              <div className="flex w-full flex-col gap-4 sm:gap-5 lg:gap-6">
                <h1 className="w-full text-center font-['Inter'] font-medium tracking-[0.04em] text-black lg:text-start text-[1.625rem] leading-8 sm:text-3xl sm:leading-9 lg:text-[36px] lg:leading-[30px]">
                  {t("logInToCamion")}
                </h1>
                <p className="w-full text-start font-sans text-sm leading-6 text-black sm:text-base">
                  {t("email")}
                </p>
              </div>

              {errors.general && (
                <p className="text-red-600 text-sm w-full" role="alert">
                  {errors.general}
                </p>
              )}

              <div className="flex w-full flex-col gap-6 sm:gap-8 lg:gap-4">
                <div className="flex w-full flex-col gap-2">
                  <input
                    id="emailOrPhone"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={emailOrPhone}
                    disabled={disableEmailField}
                    onChange={(e) => {
                      const v = e.target.value;
                      lastEditedChannelRef.current = "email";
                      setEmailOrPhone(v);
                      if (v.trim()) setPhoneLocal("");
                      if (errors.emailOrPhone)
                        setErrors((p) => ({ ...p, emailOrPhone: "" }));
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, emailOrPhone: true }));
                      if (emailOrPhone.trim()) {
                        const err = validateLoginEmail(emailOrPhone);
                        setErrors((p) => ({ ...p, emailOrPhone: err }));
                      }
                    }}
                    placeholder={t("enterYourEmail")}
                    className="w-full bg-transparent pb-2 font-sans text-base leading-6 text-black outline-none placeholder:text-black/40 border-b border-black/50 transition-colors focus:border-[#CB262E] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
                  />
                  {touched.emailOrPhone && errors.emailOrPhone && (
                    <p className="text-red-600 text-sm" role="alert">
                      {errors.emailOrPhone}
                    </p>
                  )}
                </div>

                <p className="w-full text-center font-sans text-sm font-normal leading-[21px] tracking-[-0.39px] text-black sm:text-base">
                  {t("orDivider")}
                </p>

                <div className="flex w-full flex-col gap-2">
                  <div className="flex w-full flex-row items-center gap-0 border-b border-[#808080] pb-2" dir="ltr">
                    <CountryCodeCombobox
                      value={countryCode}
                      onChange={(code: string) => {
                        lastEditedChannelRef.current = "phone";
                        setCountryCode(code);
                      }}
                      ariaLabel={t("phoneNumber")}
                      disabled={disablePhoneRow}
                    />
                    <input
                      id="phoneLocal"
                      name="phoneLocal"
                      type="tel"
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phoneLocal}
                      disabled={disablePhoneRow}
                      onChange={(e) => {
                        const v = e.target.value;
                        lastEditedChannelRef.current = "phone";
                        setPhoneLocal(v);
                        if (v.trim()) setEmailOrPhone("");
                        if (errors.phoneLocal)
                          setErrors((p) => ({ ...p, phoneLocal: "" }));
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, phoneLocal: true }));
                        if (phoneLocal.trim()) {
                          const err = validateLocalPhone(phoneLocal);
                          setErrors((p) => ({ ...p, phoneLocal: err }));
                        }
                      }}
                      placeholder="12345678910"
                      className="flex-1 min-w-0 bg-transparent outline-none font-sans text-base leading-6 text-[#999999] placeholder:text-[#999999] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
                    />
                  </div>
                  {touched.phoneLocal && errors.phoneLocal && (
                    <p className="text-red-600 text-sm" role="alert">
                      {errors.phoneLocal}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-1 flex w-full flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[50px] w-full flex-row items-center justify-center rounded-[5px] bg-[#CB262E] font-sans text-base font-medium capitalize leading-6 text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                >
                  {loading ? t("signingIn") : t("login")}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className={socialBtnClass}
                >
                  <GoogleIcon />
                  {t("continueWithGoogle")}
                </button>

                <button
                  type="button"
                  onClick={handleFacebookSignIn}
                  className={socialBtnClass}
                >
                  <FacebookIcon />
                  {t("continueWithFacebook")}
                </button>

                <button
                  type="button"
                  disabled={guestLoading || loading}
                  onClick={handleContinueAsGuest}
                  className="box-border flex h-[50px] w-full flex-row items-center justify-center rounded-[5px] border border-black font-sans text-sm font-medium capitalize leading-[18px] text-[#CB262E] transition-colors hover:bg-black/[0.02] disabled:opacity-50 sm:text-base"
                >
                  {guestLoading ? t("continuingAsGuest") : t("continueAsGuest")}
                </button>
              </div>
            </form>

            <p className="w-full max-w-[291px] px-1 text-center font-sans text-xs leading-[18px] text-black sm:text-sm">
              {t("dontHaveAccountPrefix")}{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-[#CB262E] hover:underline"
              >
                {t("registerLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

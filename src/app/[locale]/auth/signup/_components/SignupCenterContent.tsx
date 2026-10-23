"use client";

import {
  useState,
  useEffect,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import Image from "@/componentsedit/StaticImage";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Link } from "@/i18n/navigation";
import { API_ENDPOINTS } from "@/services/api/api";
import { toast } from "@/componentsedit/toast";
import { useLocale, useTranslations } from "next-intl";
import { captureAuthReturnToFromUrl } from "@/lib/auth/authReturnToClient";
import { setOauthReturnLocaleBeforeProviderRedirect } from "@/lib/auth/oauthReturnLocaleClient";
import { apiFetch } from "@/services/api/apiClient";
import {
  extractApiErrorMessage,
  mapRegisterApiErrors,
} from "@/services/api/parseApiErrorResponse";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import CountryCodeCombobox from "@/componentsedit/auth/CountryCodeCombobox";
import AuthResponsiveLogo from "@/componentsedit/auth/AuthResponsiveLogo";
import { getGuestUuidForCustomerAuth } from "@/lib/auth/isGuestClient";

type SignupForm = {
  fullName: string;
  emailOrPhone: string;
};

type SignupErrors = Partial<
  Record<"fullName" | "emailOrPhone" | "phoneLocal" | "general", string>
>;

type SignupTouched = Partial<Record<"fullName" | "emailOrPhone" | "phoneLocal", boolean>>;

type UnderlineInputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  error?: string | false;
};

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

function UnderlineInput({
  id,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  ...props
}: UnderlineInputProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full border-b border-black/50 bg-transparent pb-2 font-sans text-base leading-6 text-black outline-none transition-colors placeholder:opacity-40 focus:border-[#CB262E]"
        {...props}
      />
      {error ? (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function SignupCenterContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const formDir = locale === "ar" ? "rtl" : "ltr";
  const [formData, setFormData] = useState<SignupForm>({
    fullName: "",
    emailOrPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [touched, setTouched] = useState<SignupTouched>({});
  const [countryCode, setCountryCode] = useState("+974");
  const [phoneLocal, setPhoneLocal] = useState("");

  useEffect(() => {
    captureAuthReturnToFromUrl();
  }, []);

  const validateField = (name: keyof SignupForm, value: string) => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return t("fullNameRequired");
        if (value.trim().length < 2) return t("fullNameMinLength");
        return "";
      case "emailOrPhone": {
        if (!value.trim()) return t("emailRequired");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim()) ? "" : t("invalidEmail");
      }
      default:
        return "";
    }
  };

  const validateLocalPhoneFor = (local: string, dialCode: string) => {
    const digits = local.replace(/\D/g, "");
    if (!digits) return t("phoneRequired");
    const full = `${dialCode}${digits}`;
    try {
      return isValidPhoneNumber(full) ? "" : t("invalidPhone");
    } catch {
      return t("invalidPhone");
    }
  };

  const validateLocalPhone = (local: string) => validateLocalPhoneFor(local, countryCode);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as SignupForm);
    const key = name as keyof SignupErrors;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof SignupForm, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: SignupErrors = {};
    const top = formData.emailOrPhone.trim();

    const nameErr = validateField("fullName", formData.fullName);
    if (nameErr) newErrors.fullName = nameErr;

    const emailErr = validateField("emailOrPhone", top);
    if (emailErr) newErrors.emailOrPhone = emailErr;

    const phoneErr = validateLocalPhone(phoneLocal);
    if (phoneErr) newErrors.phoneLocal = phoneErr;

    setErrors(newErrors);
    setTouched({ fullName: true, emailOrPhone: true, phoneLocal: true });
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const digits = phoneLocal.replace(/\D/g, "");
    const guestUUID = getGuestUuidForCustomerAuth();
    const payload = {
      fullName: formData.fullName.trim(),
      emailAddress: top,
      countryCode,
      phoneNumber: digits,
      ...(guestUUID ? { guestUUID } : {}),
    };

    let phoneE164 = "";
    try {
      const parsed = parsePhoneNumber(`${countryCode}${digits}`);
      phoneE164 = parsed?.format("E.164") || `${countryCode}${digits}`;
    } catch {
      phoneE164 = `${countryCode}${digits}`;
    }

    try {
      const res = await apiFetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        const fieldErrors = mapRegisterApiErrors(data);
        const apiMsg = extractApiErrorMessage(data);
        const fallback = t("registrationFailed");

        const nextErrors: SignupErrors = {};
        if (fieldErrors.fullName) nextErrors.fullName = fieldErrors.fullName;
        if (fieldErrors.emailOrPhone) nextErrors.emailOrPhone = fieldErrors.emailOrPhone;
        if (fieldErrors.phoneLocal) nextErrors.phoneLocal = fieldErrors.phoneLocal;

        const hasFieldError = Boolean(
          nextErrors.fullName || nextErrors.emailOrPhone || nextErrors.phoneLocal,
        );

        let toastMsg = fallback;
        if (fieldErrors.phoneLocal) toastMsg = fieldErrors.phoneLocal;
        else if (fieldErrors.emailOrPhone) toastMsg = fieldErrors.emailOrPhone;
        else if (fieldErrors.fullName) toastMsg = fieldErrors.fullName;
        else if (fieldErrors.general) toastMsg = fieldErrors.general;
        else if (apiMsg) toastMsg = apiMsg;

        if (!hasFieldError) {
          nextErrors.general = toastMsg;
        }

        setTouched({ fullName: true, emailOrPhone: true, phoneLocal: true });
        setErrors(nextErrors);
        toast.error(toastMsg);
        return;
      }

      const isSecure =
        typeof window !== "undefined" && window.location.protocol === "https:";
      const cookieOptions = {
        path: "/",
        sameSite: "Lax" as const,
        ...(isSecure ? { secure: true as const } : {}),
      };
      Cookies.set("email", payload.emailAddress, cookieOptions);
      Cookies.set("phone", phoneE164, cookieOptions);
      Cookies.set("fullName", payload.fullName, cookieOptions);

      toast.success(t("accountCreatedSuccessfully"));
      setTimeout(() => router.push("/auth/choose-verification"), 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("somethingWentWrong");
      if (msg.toLowerCase().includes("email"))
        setErrors((prev) => ({ ...prev, emailOrPhone: msg }));
      else if (msg.toLowerCase().includes("phone"))
        setErrors((prev) => ({ ...prev, emailOrPhone: msg }));
      else setErrors((prev) => ({ ...prev, general: msg }));
      toast.error(msg);
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

  return (
    <div dir="ltr" className="relative w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Mobile only (< md): same watermark as login */}
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
              <h1 className="w-full text-center font-['Inter'] font-medium tracking-[0.04em] text-black lg:text-start text-[1.625rem] leading-8 sm:text-3xl sm:leading-9 lg:text-[36px] lg:leading-tight">
                {t("createAccount")}
              </h1>
              <p className="w-full text-start font-sans text-sm leading-6 text-black sm:text-base lg:text-start">
                {t("enterYourDetails")}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col items-stretch gap-6 sm:gap-8 lg:gap-10"
            >
              {errors.general && (
                <p className="w-full text-sm text-red-600" role="alert">
                  {errors.general}
                </p>
              )}

              <div className="flex w-full flex-col gap-6 sm:gap-8 lg:gap-6">
                <UnderlineInput
                  id="fullName"
                  placeholder={t("name")}
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.fullName && errors.fullName}
                  required
                  aria-required
                />

                <div className="flex w-full flex-col gap-6 sm:gap-8 lg:gap-4">
                  <UnderlineInput
                    id="emailOrPhone"
                    type="email"
                    autoComplete="email"
                    placeholder={t("enterYourEmail")}
                    value={formData.emailOrPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.emailOrPhone && errors.emailOrPhone}
                    required
                    aria-required
                  />
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex w-full flex-row items-center gap-0 border-b border-[#808080] pb-2" dir="ltr">
                      <CountryCodeCombobox
                        value={countryCode}
                        onChange={(code: string) => {
                          setCountryCode(code);
                          if (touched.phoneLocal) {
                            const err = validateLocalPhoneFor(phoneLocal, code);
                            setErrors((p) => ({ ...p, phoneLocal: err }));
                          }
                        }}
                        ariaLabel={t("phoneNumber")}
                      />
                      <input
                        id="phoneLocal"
                        name="phoneLocal"
                        type="tel"
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phoneLocal}
                        onChange={(e) => {
                          setPhoneLocal(e.target.value);
                          if (errors.phoneLocal)
                            setErrors((p) => ({ ...p, phoneLocal: "" }));
                        }}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, phoneLocal: true }));
                          const err = validateLocalPhone(phoneLocal);
                          setErrors((p) => ({ ...p, phoneLocal: err }));
                        }}
                        placeholder="12345678910"
                        required
                        aria-required
                        className="min-w-0 flex-1 bg-transparent font-sans text-base leading-6 text-[#999999] outline-none placeholder:text-[#999999]"
                      />
                    </div>
                    {touched.phoneLocal && errors.phoneLocal && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.phoneLocal}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[50px] w-full items-center justify-center rounded-[5px] bg-[#CB262E] font-sans text-base font-medium text-white transition-colors hover:opacity-95 disabled:opacity-50 lg:h-14"
                >
                  {loading ? t("registering") : t("signUp")}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="box-border flex h-[50px] min-h-[48px] w-full flex-row items-center justify-center gap-2 rounded-[5px] border border-black px-2 font-sans text-sm text-black transition-colors hover:bg-black/[0.02] sm:gap-3 sm:px-3 sm:text-base lg:h-14"
                >
                  <GoogleIcon />
                  <span>{t("signUpWithGoogle")}</span>
                </button>

                <div className="px-1 pt-1 text-center sm:pt-2 lg:text-start">
                  <span className="font-sans text-xs text-black opacity-70 sm:text-sm sm:text-base">
                    {t("alreadyHaveAccount")}{" "}
                  </span>
                  <Link
                    href="/auth/login"
                    className="font-sans text-xs font-medium text-[#CB262E] hover:underline sm:text-sm sm:text-base"
                  >
                    {t("logIn")}
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

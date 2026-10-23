"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "@/i18n/navigation";
import Image from "@/componentsedit/StaticImage";
import SocialMediaLinks from "@/componentsedit/social/SocialMediaLinks";
import { PaymentMethodBadgeRow } from "@/componentsedit/PaymentMethodIcons";
import FooterTrustBadges from "@/componentsedit/trust/FooterTrustBadges";
import { useTranslations } from "next-intl";
import { API_ENDPOINTS } from "@/services/api/api";
import { useToast } from "@/componentsedit/toast/useToast";
import {
  NewsletterInvalidEmailError,
  subscribeToNewsletter,
} from "services/newsletter/subscribeToNewsletter";
import {
  PAGE_CONTENT_INNER_CLASS,
  PAGE_DESKTOP_SECTION_X_PADDING_CLASS,
} from "@/lib/layout/pageContentLayout";

const montserrat: CSSProperties = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
};

/* ---------------- Icons ---------------- */

const IconCopyright = ({ size = 24 }: { size?: number }) => (
  <svg
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="10" cy="10" r="7.5" />
    {/* Inner © mark */}
    <path
      d="M12.6 8.2a3.1 3.1 0 1 0 0 3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArrowUp = () => (
  <svg
    viewBox="0 0 24 24"
    width={24}
    height={24}
    fill="none"
    stroke="#000000"
    strokeWidth="2"
    style={{ transform: "rotate(90deg)" }}
  >
    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSend = () => (
  <svg
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden
    className="rtl:-scale-x-100"
  >
    <path d="m3 3 3 9-3 9 19-9Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 12h16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------------- Footer ---------------- */

export default function Footer() {
  const t = useTranslations();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailAddress = email.trim();
      if (!emailAddress) {
        toast.error(t("emailRequired"));
        return;
      }

      await subscribeToNewsletter(emailAddress);

      setEmail("");
      toast.success(t("thankYouForSubscribing"));
    } catch (err) {
      if (err instanceof NewsletterInvalidEmailError) {
        toast.error(t("invalidEmail"));
      } else {
        toast.error(t("somethingWentWrong"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="w-full bg-black">
      <div
        className={`relative flex w-full justify-center px-4 pt-8 pb-5 sm:px-6 sm:pt-10 md:px-8 lg:pt-12 lg:pb-8 ${PAGE_DESKTOP_SECTION_X_PADDING_CLASS}`}
      >
        <div className={`${PAGE_CONTENT_INNER_CLASS} relative`}>
          <div
            className={[
              "flex flex-col gap-8",
              // 2×2 on tablet (iPad); 4 columns from xl so badges/social don't collide.
              "lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-8",
              "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.45fr)_minmax(0,1.1fr)_minmax(0,1.5fr)]",
              "xl:justify-items-start xl:gap-x-8 2xl:gap-x-10 lg:items-stretch xl:items-stretch",
            ].join(" ")}
          >
            {/* Customer Service + newsletter */}
            <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
              <h3 className="text-white text-base sm:text-[18px] font-medium lg:whitespace-nowrap">
                {t("customerService")}
              </h3>

              <div className="flex flex-col gap-2.5 sm:gap-3 text-white text-sm sm:text-[14px] lg:[&_a]:whitespace-nowrap">
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/orders"
                >
                  {t("myOrders")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/return-refund-policy"
                >
                  {t("returnRefundPolicy")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/shipping-delivery-policy"
                >
                  {t("shippingPolicy")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/frequently-asked-questions"
                >
                  {t("frequentlyAskedQuestions")}
                </Link>
                <Link className="hover:underline underline-offset-2" href="/contact">
                  {t("contactUs")}
                </Link>
              </div>

              <div className="mt-1 flex w-full max-w-[280px] flex-col gap-2 sm:mt-2 lg:max-w-[min(100%,280px)]">
                <h4
                  className="text-base font-medium text-[#FAFAFA] sm:text-[18px]"
                  style={montserrat}
                >
                  {t("getBestDealsDeliveredFirst")}
                </h4>

                <form onSubmit={handleNewsletterSubmit} className="relative w-full">
                  <input
                    type="email"
                    required
                    name="email"
                    autoComplete="email"
                    placeholder={t("enterYourEmail")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="box-border h-11 w-full rounded-[4px] border-[1.5px] border-[#FAFAFA] bg-transparent py-0 pe-11 ps-3.5 text-sm text-[#FAFAFA] outline-none placeholder:text-[#FAFAFA] placeholder:opacity-40 disabled:opacity-60 sm:text-base"
                    style={montserrat}
                    aria-label={t("enterYourEmail")}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute end-0.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#FAFAFA] transition-opacity hover:opacity-80 disabled:opacity-50"
                    aria-label={t("subscribe")}
                  >
                    <IconSend />
                  </button>
                </form>
              </div>
            </div>

            {/* Shopping With Camion */}
            <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
              <h3 className="text-white text-base sm:text-[18px] font-medium lg:whitespace-nowrap">
                {t("shoppingWithCamion")}
              </h3>

              <div className="flex flex-col gap-2.5 sm:gap-3 text-white text-sm sm:text-[14px] lg:[&_a]:whitespace-nowrap">
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/about-camion"
                >
                  {t("aboutCamion")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/why-shop-with-camion"
                >
                  {t("whyShopWithCamion")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/how-camion-works"
                >
                  {t("howCamionWorks")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/why-consolidated-shipping"
                >
                  {t("whyConsolidatedShipping")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/promotions-discounts"
                >
                  {t("promotionsAndDiscounts")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/secure-payments"
                >
                  {t("securePayments")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/buyer-protection"
                >
                  {t("buyerProtection")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/quality-assurance"
                >
                  {t("qualityAssurance")}
                </Link>
              </div>
            </div>

            {/* Help & Support + payment acceptance (fills short column) */}
            <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
              <h3 className="text-white text-base sm:text-[18px] font-medium lg:whitespace-nowrap">
                {t("helpAndSupport")}
              </h3>

              <div className="flex flex-col gap-2.5 sm:gap-3 text-white text-sm sm:text-[14px] lg:[&_a]:whitespace-nowrap">
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/customer-support"
                >
                  {t("customerSupport")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/report-a-product"
                >
                  {t("reportAProduct")}
                </Link>
                <Link
                  className="hover:underline underline-offset-2"
                  href="/myaccount/how-track-your-order-works"
                >
                  {t("howTrackYourOrderWorks")}
                </Link>
              </div>

              <div className="mt-1 flex w-full min-w-0 max-w-full flex-col items-start gap-2 overflow-hidden sm:mt-2">
                <h4
                  className="text-white text-base font-medium sm:text-[18px]"
                  style={montserrat}
                >
                  {t("weAccept")}
                </h4>
                <PaymentMethodBadgeRow
                  className="w-full max-w-full"
                  aria-label={t("weAccept")}
                />
                <FooterTrustBadges className="max-w-full" />
              </div>
            </div>

            {/* Download App */}
            <div className="flex w-full min-w-0 flex-col gap-3 overflow-hidden sm:gap-4">
              <h3 className="text-white text-base sm:text-[18px] font-medium">
                {t("downloadCamionApp")}
              </h3>

              <div className="flex flex-wrap items-start gap-2 sm:items-center">
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center border-[2.5px] border-white sm:h-[72px] sm:w-[72px]">
                  <Image
                    src="/assets/icons/qr_code.png"
                    alt="Download Camion App QR"
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  {/* GOOGLE PLAY */}
                  <a
                    href={API_ENDPOINTS.GOOGLE_PLAYSTORE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[46px] w-[120px] shrink-0 items-center"
                  >
                    <Image
                      src="/assets/icons/googleplay.png"
                      alt={t("getItGooglePlay")}
                      width={106}
                      height={32}
                      unoptimized
                      className="max-h-[46px] w-[120px] object-contain object-left"
                      sizes="120px"
                    />
                  </a>

                  {/* APPLE STORE */}
                  <a
                    href={API_ENDPOINTS.APPLE_APPSTORE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[46px] w-[120px] shrink-0 items-center"
                  >
                    <Image
                      src="/assets/images/app-store-badge.svg"
                      alt={t("downloadAppStore")}
                      width={120}
                      height={40}
                      unoptimized
                      className="max-h-[46px] w-[120px] object-contain object-left"
                      sizes="120px"
                    />
                  </a>
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-2">
                <h4
                  className="text-white text-base font-medium sm:text-[18px]"
                  style={montserrat}
                >
                  {t("connectWithCamion")}
                </h4>
                <SocialMediaLinks variant="onDark" className="w-full max-w-full" />
              </div>

              <button
                type="button"
                onClick={scrollToTop}
                className="pointer-events-auto mt-auto flex h-10 w-10 shrink-0 self-end items-center justify-center rounded-full bg-[#F5F5F5] transition-opacity hover:opacity-90 sm:h-11 sm:w-11"
                style={{ transform: "rotate(-90deg)" }}
                aria-label="Back to top"
              >
                <span
                  className="flex items-center justify-center"
                  style={{ transform: "rotate(90deg)" }}
                >
                  <IconArrowUp />
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 text-center sm:mt-8 lg:mt-8">
            <div className="w-full border-t border-white opacity-50" />

            <div
              className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 text-white text-xs sm:gap-x-2.5 sm:text-sm"
              style={montserrat}
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="shrink-0 text-white" aria-hidden>
                  <IconCopyright size={18} />
                </span>
                <span>{t("copyrightCamion2026")}</span>
              </span>

              <span className="opacity-50" aria-hidden>
                |
              </span>

              <Link
                className="whitespace-nowrap hover:underline underline-offset-2"
                href="/myaccount/privacy-policies"
              >
                {t("privacyAndCookiePolicy")}
              </Link>

              <span className="opacity-50" aria-hidden>
                |
              </span>

              <Link
                className="whitespace-nowrap hover:underline underline-offset-2"
                href="/myaccount/terms-conditions"
              >
                {t("termsAndConditions")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

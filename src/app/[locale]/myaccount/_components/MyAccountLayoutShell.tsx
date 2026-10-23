"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import RootLayout from "@/componentsedit/layout/RootLayout";
import Roadmap from "@/componentsedit/Roadmap";
import AccountSidebar from "./AccountSidebar";
import AccountLoginPromptCard from "./AccountLoginPromptCard";
import { useUser } from "@/componentsedit/context/UserContext";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import { PAGE_CONTENT_INNER_CLASS } from "@/lib/layout/pageContentLayout";
import { SHOPPING_WITH_CAMION_PAGES } from "@/lib/cms/shoppingWithCamionPages";
import { HELP_AND_SUPPORT_PAGES } from "@/lib/cms/helpAndSupportPages";

type IntlT = ReturnType<typeof useTranslations>;

function matchShoppingWithCamionPage(pathname: string) {
  return (
    SHOPPING_WITH_CAMION_PAGES.find((page) => pathname.includes(page.path)) ??
    null
  );
}

function matchHelpAndSupportPage(pathname: string) {
  return (
    HELP_AND_SUPPORT_PAGES.find((page) => pathname.includes(page.path)) ?? null
  );
}

function isAccountHubPath(pathname: string) {
  const p = (pathname || "").replace(/\/$/, "") || "/";
  return p === "/myaccount";
}

function activeKeyFromPath(pathname: string) {
  const p = pathname || "";
  if (isAccountHubPath(p)) return "personalInfo";
  if (p.includes("/myaccount/affiliator-coupon-statistics")) return "coupons";
  if (p.includes("/myaccount/influencer-coupon-statistics")) return "coupons";
  if (p.includes("/myaccount/affiliator-create-coupon")) return "affiliator";
  if (p.includes("/myaccount/influencer-create-coupon")) return "influencer";
  if (p.includes("/myaccount/affiliator-coupons")) return "coupons";
  if (p.includes("/myaccount/influencer-coupons")) return "coupons";
  if (p.includes("/myaccount/orders")) return "orders";
  if (p.includes("/myaccount/returns-refunds")) return "returnsRefunds";
  if (p.includes("/myaccount/affiliator-dashboard")) return "affiliator";
  if (p.includes("/myaccount/influencer-dashboard")) return "influencer";
  if (p.includes("/myaccount/affiliator-wallet")) return "affiliator";
  if (p.includes("/myaccount/affiliator-banks")) return "affiliator";
  if (p.includes("/myaccount/influencer-wallet")) return "influencer";
  if (p.includes("/myaccount/influencer-banks")) return "influencer";
  if (p.includes("/myaccount/chatbot")) return "chatbot";
  if (p.includes("/myaccount/feedback")) return "feedback";
  if (p.includes("/myaccount/rate")) return "rate";
  if (p.includes("/myaccount/language")) return "language";
  if (p.includes("/myaccount/currency")) return "currency";
  if (p.includes("/myaccount/help")) return "help";
  if (p.includes("/myaccount/delete-account")) return "delete";
  if (p.includes("/myaccount/terms-conditions")) return "terms";
  if (p.includes("/myaccount/privacy-policies")) return "policies";
  if (p.includes("/myaccount/return-refund-policy")) return "policies";
  if (p.includes("/myaccount/shipping-delivery-policy")) return "policies";
  if (p.includes("/myaccount/frequently-asked-questions")) return "policies";
  if (matchShoppingWithCamionPage(p)) return "policies";
  if (matchHelpAndSupportPage(p)) return "policies";
  if (p.includes("/myaccount/coupons")) return "coupons";
  if (p.includes("/myaccount/personal-info")) return "personalInfo";
  if (p.includes("/myaccount/addresses")) return "addresses";
  if (p.includes("/myaccount/saved-cards")) return "savedCards";
  return "personalInfo";
}

function breadcrumbsForPath(pathname: string, t: IntlT) {
  const account = { label: t("account") || "Account", href: "/myaccount" };
  if (isAccountHubPath(pathname)) {
    return [account];
  }
  if (pathname.includes("/myaccount/affiliator-coupon-statistics")) {
    return [account, { label: t("partnerCouponStatisticsTitle") }];
  }
  if (pathname.includes("/myaccount/influencer-coupon-statistics")) {
    return [account, { label: t("partnerCouponStatisticsTitle") }];
  }
  if (pathname.includes("/myaccount/affiliator-create-coupon")) {
    return [account, { label: t("partnerActionCreateCoupon") }];
  }
  if (pathname.includes("/myaccount/influencer-create-coupon")) {
    return [account, { label: t("partnerActionCreateCoupon") }];
  }
  if (pathname.includes("/myaccount/affiliator-coupons")) {
    return [account, { label: t("myCoupons") }];
  }
  if (pathname.includes("/myaccount/influencer-coupons")) {
    return [account, { label: t("myCoupons") }];
  }
  if (pathname.includes("/myaccount/affiliator-wallet")) {
    return [account, { label: t("walletTransactions") }];
  }
  if (pathname.includes("/myaccount/influencer-wallet")) {
    return [account, { label: t("walletTransactions") }];
  }
  if (pathname.includes("/myaccount/affiliator-banks")) {
    return [account, { label: t("bankAccounts") }];
  }
  if (pathname.includes("/myaccount/influencer-banks")) {
    return [account, { label: t("bankAccounts") }];
  }
  if (pathname.includes("/myaccount/orders/") && /\/track\/?$/.test(pathname)) {
    return [
      account,
      { label: t("myOrders"), href: "/myaccount/orders" },
      { label: t("trackOrder") },
    ];
  }
  if (pathname.includes("/myaccount/orders/")) {
    return [
      account,
      { label: t("myOrders"), href: "/myaccount/orders" },
      { label: t("orderDetails") },
    ];
  }
  if (pathname.includes("/myaccount/orders")) {
    return [account, { label: t("myOrders") }];
  }
  if (pathname.includes("/myaccount/returns-refunds")) {
    return [account, { label: t("myReturnsRefunds") }];
  }
  if (pathname.includes("/myaccount/affiliator-dashboard")) {
    return [account, { label: t("affiliatorDashboard") }];
  }
  if (pathname.includes("/myaccount/influencer-dashboard")) {
    return [account, { label: t("influencerDashboard") }];
  }
  if (pathname.includes("/myaccount/chatbot")) {
    return [account, { label: t("camionChatbot") }];
  }
  if (pathname.includes("/myaccount/feedback")) {
    return [account, { label: t("giveUsFeedback") }];
  }
  if (pathname.includes("/myaccount/rate")) {
    return [account, { label: t("rateUs") }];
  }
  if (pathname.includes("/myaccount/language")) {
    return [account, { label: t("languageSettingsTitle") }];
  }
  if (pathname.includes("/myaccount/currency")) {
    return [account, { label: t("currencySettingsTitle") }];
  }
  if (pathname.includes("/myaccount/help")) {
    return [account, { label: t("help") }];
  }
  if (pathname.includes("/myaccount/delete-account")) {
    return [account, { label: t("deleteAccount") }];
  }
  if (pathname.includes("/myaccount/privacy-policies")) {
    return [account, { label: t("privacyPolicies") }];
  }
  if (pathname.includes("/myaccount/return-refund-policy")) {
    return [account, { label: t("returnRefundPolicy") }];
  }
  if (pathname.includes("/myaccount/shipping-delivery-policy")) {
    return [account, { label: t("shippingPolicy") }];
  }
  if (pathname.includes("/myaccount/frequently-asked-questions")) {
    return [account, { label: t("frequentlyAskedQuestions") }];
  }
  {
    const shoppingPage = matchShoppingWithCamionPage(pathname);
    if (shoppingPage) {
      return [account, { label: t(shoppingPage.titleKey) }];
    }
  }
  {
    const helpPage = matchHelpAndSupportPage(pathname);
    if (helpPage) {
      return [account, { label: t(helpPage.titleKey) }];
    }
  }
  if (pathname.includes("/myaccount/terms-conditions")) {
    return [account, { label: t("termsOfUse") }];
  }
  if (pathname.includes("/myaccount/coupons")) {
    return [account, { label: t("myCoupons") }];
  }
  if (pathname.includes("/myaccount/addresses")) {
    return [account, { label: t("savedAddresses") }];
  }
  if (pathname.includes("/myaccount/saved-cards")) {
    return [account, { label: t("savedCards") }];
  }
  return [account, { label: t("personalInfo") }];
}

/** Short title for the account route at `path` (used for mobile “back to …”). */
function accountSectionTitle(path: string, t: IntlT) {
  const normalized = (path || "").replace(/\/$/, "") || "/";
  if (isAccountHubPath(normalized)) {
    return t("account");
  }
  const items = breadcrumbsForPath(normalized, t);
  const last = items[items.length - 1];
  return typeof last?.label === "string" ? last.label : t("account");
}

export default function MyAccountLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  /** Last committed account path (for detecting real route changes). */
  const lastCommittedPathRef = useRef<string | null>(null);
  /** Path we navigated from when `pathname` last changed (stable when only `t` updates). */
  const pathBeforeLastNavRef = useRef<string | null>(null);
  const { user, loading } = useUser();
  const fullName = Cookies.get("fullName") || "User";
  const token = Cookies.get("token");
  const isGuest = isGuestSession();

  const activeKey = useMemo(() => activeKeyFromPath(pathname), [pathname]);
  const breadcrumbItems = useMemo(() => breadcrumbsForPath(pathname, t), [pathname, t]);
  const isAccountHub = useMemo(() => isAccountHubPath(pathname), [pathname]);
  const isHelpPage = useMemo(() => pathname.includes("/myaccount/help"), [pathname]);
  const isProtectedMenuRoute = useMemo(
    () =>
      isAccountHub ||
      pathname.includes("/myaccount/personal-info") ||
      pathname.includes("/myaccount/addresses") ||
      pathname.includes("/myaccount/orders") ||
      pathname.includes("/myaccount/returns-refunds") ||
      pathname.includes("/myaccount/coupons") ||
      pathname.includes("/myaccount/affiliator-dashboard") ||
      pathname.includes("/myaccount/influencer-dashboard") ||
      pathname.includes("/myaccount/affiliator-wallet") ||
      pathname.includes("/myaccount/affiliator-banks") ||
      pathname.includes("/myaccount/influencer-wallet") ||
      pathname.includes("/myaccount/influencer-banks"),
    [pathname, isAccountHub],
  );
  const shouldShowLoginPrompt =
    isProtectedMenuRoute && !loading && (!token || !user || isGuest);

  const normalizedPath = useMemo(
    () => (pathname || "").replace(/\/$/, "") || "/",
    [pathname],
  );

  const mobileBack = useMemo(() => {
    if (isAccountHubPath(normalizedPath)) {
      return null;
    }
    const prev = pathBeforeLastNavRef.current;
    if (prev && prev !== normalizedPath && prev.startsWith("/myaccount")) {
      return {
        path: prev,
        label: accountSectionTitle(prev, t),
      };
    }
    return {
      path: "/myaccount",
      label: t("account"),
    };
  }, [normalizedPath, t]);

  useLayoutEffect(() => {
    const last = lastCommittedPathRef.current;
    if (last !== null && last !== normalizedPath) {
      pathBeforeLastNavRef.current = last;
    }
    lastCommittedPathRef.current = normalizedPath;
  }, [normalizedPath]);

  return (
    <RootLayout>
      <div className="w-full px-4 sm:px-6 md:px-10 pt-4 sm:pt-6 pb-12 sm:pb-16 lg:pb-20">
        <div className={PAGE_CONTENT_INNER_CLASS}>
          <Roadmap items={breadcrumbItems} />

          <div className="w-full flex justify-end mt-4 sm:mt-6">
            <span
              className="text-xs sm:text-sm max-w-full truncate text-right"
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                lineHeight: "21px",
                color: "#000000",
              }}
            >
              Welcome! {fullName}
            </span>
          </div>

          {shouldShowLoginPrompt ? (
            <div className="w-full mt-6 sm:mt-8">
              <AccountLoginPromptCard />
            </div>
          ) : (
            <div className="w-full flex flex-col lg:flex-row items-start gap-6 sm:gap-8 lg:gap-10 mt-6 sm:mt-8">
              {!isHelpPage ? (
                <AccountSidebar
                  activeKey={activeKey}
                  showMobileNav={isAccountHub}
                  neutralNav={isAccountHub}
                />
              ) : null}
              <div
                className={`flex-1 min-w-0 w-full ${isAccountHub ? "hidden lg:block" : ""}`}
              >
                {!isAccountHub && mobileBack ? (
                  <button
                    type="button"
                    onClick={() => router.push(mobileBack.path)}
                    className="lg:hidden inline-flex items-center gap-2 mb-4 sm:mb-5 min-w-0 max-w-full font-sans font-medium text-sm text-[#DB4444] hover:opacity-80 transition-opacity text-start"
                  >
                    <span
                      aria-hidden
                      className="text-base leading-none shrink-0 rtl:rotate-180"
                    >
                      ←
                    </span>
                    <span className="min-w-0 break-words">
                      {t("backToNamedScreen", { name: mobileBack.label })}
                    </span>
                  </button>
                ) : null}
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </RootLayout>
  );
}

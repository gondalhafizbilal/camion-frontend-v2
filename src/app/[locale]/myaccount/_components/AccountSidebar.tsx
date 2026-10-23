"use client";

import { useCallback } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { performClientLogout } from "@/services/auth/clientLogout";
import Cookies from "js-cookie";
import { useUser } from "@/componentsedit/context/UserContext";
import { isGuestSession } from "@/lib/auth/isGuestClient";

export type AccountSidebarActiveKey =
  | "personalInfo"
  | "addresses"
  | "savedCards"
  | "orders"
  | "returnsRefunds"
  | "coupons"
  | "affiliator"
  | "influencer"
  | "feedback"
  | "rate"
  | "chatbot"
  | "language"
  | "currency"
  | "policies"
  | "terms"
  | "help"
  | "delete";

type NavItem = {
  href: string;
  match: AccountSidebarActiveKey;
  labelKey: string;
  /** When true, use muted styling whenever activeKey !== match */
  mutedWhenInactive?: boolean;
};

const OVERVIEW_ITEMS: NavItem[] = [
  { href: "/myaccount/personal-info", match: "personalInfo", labelKey: "personalInfo" },
  { href: "/myaccount/addresses", match: "addresses", labelKey: "savedAddresses" },
  { href: "/myaccount/saved-cards", match: "savedCards", labelKey: "savedCards" },
  { href: "/myaccount/orders", match: "orders", labelKey: "myOrders" },
  {
    href: "/myaccount/returns-refunds",
    match: "returnsRefunds",
    labelKey: "myReturnsRefunds",
  },
  {
    href: "/myaccount/affiliator-dashboard",
    match: "affiliator",
    labelKey: "affiliatorDashboard",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/influencer-dashboard",
    match: "influencer",
    labelKey: "influencerDashboard",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/feedback",
    match: "feedback",
    labelKey: "giveUsFeedback",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/rate",
    match: "rate",
    labelKey: "rateUs",
    mutedWhenInactive: true,
  },
];

const GENERAL_ITEMS: NavItem[] = [
  {
    href: "/myaccount/chatbot",
    match: "chatbot",
    labelKey: "camionChatbot",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/language",
    match: "language",
    labelKey: "languageSettingsTitle",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/currency",
    match: "currency",
    labelKey: "currencySettingsTitle",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/privacy-policies",
    match: "policies",
    labelKey: "privacyPolicies",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/terms-conditions",
    match: "terms",
    labelKey: "termsOfUse",
    mutedWhenInactive: true,
  },
  {
    href: "/myaccount/delete-account",
    match: "delete",
    labelKey: "deleteAccount",
    mutedWhenInactive: true,
  },
];

function linkColor(
  neutralNav: boolean | undefined,
  active: boolean,
  muted: boolean,
  destructive: boolean,
) {
  if (destructive) return "#DB4444";
  if (neutralNav) return "#333333";
  if (active) return "#DB4444";
  if (muted) return "rgba(0,0,0,0.5)";
  return "#808080";
}

function SidebarLink({
  href,
  children,
  active,
  muted = false,
  neutralNav = false,
  destructive = false,
  onClick,
}: {
  href: string;
  children: string;
  active: boolean;
  muted?: boolean;
  neutralNav?: boolean;
  destructive?: boolean;
  onClick?: (e: { preventDefault: () => void }) => void;
}) {
  const color = linkColor(neutralNav, active, muted, destructive);
  return (
    <Link
      href={href}
      onClick={onClick}
      className="hover:opacity-80 transition-opacity text-start break-words max-w-full"
      style={{
        fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
        fontWeight: 500,
        fontSize: 16,
        lineHeight: "24px",
        color,
      }}
    >
      {children}
    </Link>
  );
}

/** One full-width row per item, bordered card (mobile / tablet hub only). */
function MobileStackedNavLink({
  href,
  children,
  active,
  muted,
  neutralNav,
  destructive,
  onClick,
}: {
  href: string;
  children: string;
  active: boolean;
  muted: boolean;
  neutralNav?: boolean;
  destructive: boolean;
  onClick?: (e: { preventDefault: () => void }) => void;
}) {
  const color = linkColor(neutralNav, active, muted, destructive);
  return (
    <div className="w-full rounded-[5px] border border-black/10 bg-white px-4 py-3.5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
      <Link
        href={href}
        onClick={onClick}
        className="block w-full min-h-[24px] text-start break-words hover:opacity-80 transition-opacity"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 16,
          lineHeight: "24px",
          color,
        }}
      >
        {children}
      </Link>
    </div>
  );
}

function renderNavItems(
  items: NavItem[],
  activeKey: AccountSidebarActiveKey,
  t: (k: string) => string,
  neutralNav?: boolean,
  stackedMobile?: boolean,
  onClick?: (href: string) => (e: { preventDefault: () => void }) => void,
) {
  return items.map((item) => {
    const active = !neutralNav && activeKey === item.match;
    const muted = !neutralNav && item.mutedWhenInactive ? !active : false;
    const destructive = item.match === "delete";
    const clickHandler = onClick ? onClick(item.href) : undefined;
    if (stackedMobile) {
      return (
        <MobileStackedNavLink
          key={item.href}
          href={item.href}
          active={active}
          muted={muted}
          neutralNav={neutralNav}
          destructive={destructive}
          onClick={clickHandler}
        >
          {t(item.labelKey)}
        </MobileStackedNavLink>
      );
    }
    return (
      <SidebarLink
        key={item.href}
        href={item.href}
        active={active}
        muted={muted}
        neutralNav={neutralNav}
        destructive={destructive}
        onClick={clickHandler}
      >
        {t(item.labelKey)}
      </SidebarLink>
    );
  });
}

export default function AccountSidebar({
  activeKey = "personalInfo",
  showMobileNav = true,
  neutralNav = false,
}: {
  activeKey?: AccountSidebarActiveKey;
  /** When false, hide Overview/General on small screens (detail view). Desktop unchanged. */
  showMobileNav?: boolean;
  /** Hub menu: no red active state, no muted inactive styling. */
  neutralNav?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const overviewTitle = t("overview");
  const generalTitle = t("general");
  const { user } = useUser();
  const token = Cookies.get("token");
  const allowOverviewNavigation = Boolean(token && user && !isGuestSession());

  const handleLogout = useCallback(async () => {
    await performClientLogout();
    router.push("/auth/login");
  }, [router]);

  const guardOverviewClick = useCallback(
    (href: string) => (e: { preventDefault: () => void }) => {
      if (allowOverviewNavigation) return;
      e.preventDefault();
      router.push(href);
    },
    [allowOverviewNavigation, router],
  );

  return (
    <aside className="w-full lg:w-[240px] lg:flex-shrink-0">
      <div
        className={`w-full space-y-6 pb-2 border-b border-black/10 mb-6 lg:hidden ${
          showMobileNav ? "" : "hidden"
        }`}
      >
        <div>
          <p className="font-sans font-bold text-base leading-6 text-black mb-3">
            {overviewTitle}
          </p>
          <div className="flex flex-col gap-3 w-full">
            {renderNavItems(
              OVERVIEW_ITEMS,
              activeKey,
              t,
              neutralNav,
              true,
              guardOverviewClick,
            )}
          </div>
        </div>
        <div>
          <p className="font-sans font-bold text-base leading-6 text-black mb-3">
            {generalTitle}
          </p>
          <div className="flex flex-col gap-3 w-full">
            {renderNavItems(GENERAL_ITEMS, activeKey, t, neutralNav, true)}
          </div>
        </div>
      </div>

      <div className="hidden lg:block" style={{ width: 240 }}>
        <div className="font-sans font-medium text-base leading-6 text-black mb-4">
          {overviewTitle}
        </div>
        <div
          className="flex flex-col items-start"
          style={{ gap: 8, paddingInlineStart: 35 }}
        >
          {renderNavItems(
            OVERVIEW_ITEMS,
            activeKey,
            t,
            neutralNav,
            false,
            guardOverviewClick,
          )}
        </div>

        <div className="font-sans font-medium text-base leading-6 text-black mt-10 mb-4">
          {generalTitle}
        </div>
        <div
          className="flex flex-col items-start"
          style={{ gap: 8, paddingInlineStart: 35 }}
        >
          {renderNavItems(GENERAL_ITEMS, activeKey, t, neutralNav)}
        </div>

        <button
          type="button"
          onClick={() => {
            if (!allowOverviewNavigation) {
              router.push("/myaccount");
              return;
            }
            void handleLogout();
          }}
          className="mt-8 w-full max-w-[240px] flex items-center justify-center hover:opacity-90 transition-opacity"
          style={{
            height: 40,
            background: "#CB262E",
            borderRadius: 5,
            padding: "24px 34px",
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 16,
            lineHeight: "24px",
            color: "#FFFFFF",
          }}
        >
          {allowOverviewNavigation ? t("logout") : t("logIn")}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!allowOverviewNavigation) {
            router.push("/myaccount");
            return;
          }
          void handleLogout();
        }}
        className={`lg:hidden mt-6 w-full items-center justify-center hover:opacity-90 transition-opacity ${
          showMobileNav ? "flex" : "hidden"
        }`}
        style={{
          height: 44,
          background: "#CB262E",
          borderRadius: 5,
          padding: "12px 24px",
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 15,
          lineHeight: "24px",
          color: "#FFFFFF",
        }}
      >
        {allowOverviewNavigation ? t("logout") : t("logIn")}
      </button>
    </aside>
  );
}

"use client";

import Image from "@/componentsedit/StaticImage";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useUser, type UserProfile } from "@/componentsedit/context/UserContext";
import { useState, useCallback, memo } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { performClientLogout } from "@/services/auth/clientLogout";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import SecondaryTopBar from "./SecondaryTopBar";
import MainHeader from "./MainHeader";
import TopPromoBar from "./TopPromoBar";
import HeaderDesktopCategoryNav from "./_components/HeaderDesktopCategoryNav";
import MobileMenuCategoryList from "./_components/MobileMenuCategoryList";
import { useCategories } from "@/componentsedit/context/CategoriesContext";
import { useCustomerWishlistCount } from "@/hooks/useCustomerWishlistCount";
import { useCustomerCartCount } from "@/hooks/useCustomerCartCount";
import { isGuestSession } from "@/lib/auth/isGuestClient";

const Icon = {
  Menu: ({ className = "" }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: ({ className = "" }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  ChevronDown: ({ className = "" }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

type MobileMenuProps = {
  isOpen: boolean;
  closeMenu: () => void;
  user: UserProfile | null;
  displayName: string;
};

const MobileMenu = memo(function MobileMenu({
  isOpen,
  closeMenu,
  user,
  displayName,
}: MobileMenuProps) {
  const t = useTranslations();
  const router = useRouter();
  const { currency, setCurrency, currencyOptions } = useCurrency();
  const { roots: categoryRoots, loading: categoriesLoading } = useCategories();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const allowAccountNavigation = Boolean(user) && !isGuestSession();

  const handleLogout = useCallback(async () => {
    await performClientLogout();
    window.location.href = "/auth/login";
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[220] lg:hidden"
      onClick={closeMenu}
      role="presentation"
    >
      <div
        className={[
          "fixed top-0 start-0 h-full bg-white overflow-y-auto overflow-x-hidden p-6",
          /* Wide panel: small peek on phone; from md leave ~17rem on the inline-end for the secondary bar. */
          "w-[calc(100vw-1rem)] max-w-none",
          "md:w-[calc(100vw-17rem)] md:max-w-none",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-8">
          <Image
            src="/assets/icons/web.svg"
            alt="Logo"
            width={100}
            height={20}
            unoptimized
          />
          <button type="button" onClick={closeMenu} className="p-2">
            <Icon.Close className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-8">
          <div className="text-xs font-semibold text-gray-500 mb-3">
            {t("categories") || "Categories"}
          </div>
          <nav className="flex flex-col gap-3 font-sans text-[16px]">
            <MobileMenuCategoryList
              categoryRoots={categoryRoots}
              categoriesLoading={categoriesLoading}
              closeMenu={closeMenu}
              expandSubcategoriesLabel={(name) =>
                t("mobileSubcategoriesToggle", { name })
              }
            />
          </nav>
        </div>

        <div className="mb-8 border-t border-gray-100 pt-6">
          <div className="text-xs font-semibold text-gray-500 mb-3">
            {t("menu") || "Menu"}
          </div>
          <nav className="flex flex-col gap-4 font-sans text-[16px]">
            <button
              type="button"
              className="flex items-center justify-between py-1"
              onClick={() => setPartnerOpen((o) => !o)}
              aria-expanded={partnerOpen ? "true" : "false"}
            >
              <span>{t("becomePartner") || "Become Partner"}</span>
              <Icon.ChevronDown
                className={`w-5 h-5 transition-transform ${partnerOpen ? "rotate-180" : ""}`}
              />
            </button>
            {partnerOpen && (
              <div className="ps-3 flex flex-col gap-3 text-[15px] text-gray-700">
                <Link href="/myaccount/affiliator-dashboard" onClick={closeMenu}>
                  {t("affiliator") || "Affiliator"}
                </Link>
                <Link href="/myaccount/influencer-dashboard" onClick={closeMenu}>
                  {t("influencer") || "Influencer"}
                </Link>
              </div>
            )}

            <Link href="/about" onClick={closeMenu} className="py-1">
              {t("aboutUs") || "About Us"}
            </Link>
            <Link href="/myaccount/help" onClick={closeMenu} className="py-1">
              {t("helpSupport") || "Help & Support"}
            </Link>
          </nav>
        </div>

        <div className="mb-8 border-t border-gray-100 pt-6">
          <div className="text-xs font-semibold text-gray-500 mb-3">
            {t("settings") || "Settings"}
          </div>

          <div className="mb-4 flex min-w-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-3">
            <div className="min-w-0 shrink-0 text-sm text-gray-700">
              {t("currencyLabel") || "Currency"}:{" "}
              <span className="font-semibold">{currency}</span>
            </div>
            <select
              className="min-w-0 w-full max-w-full rounded-md border border-gray-200 px-2 py-1 text-sm min-[400px]:w-auto min-[400px]:shrink-0"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                if (typeof window !== "undefined") {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      void router.refresh();
                    });
                  });
                }
              }}
            >
              {currencyOptions.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label === code ? code : `${code} — ${label}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">{t("language") || "Language"}</div>
            <LanguageSwitcher variant="default" />
          </div>
        </div>

        <div className="mt-10 pt-10 border-t border-gray-100">
          <div className="flex flex-col gap-4 text-start">
            {user ? (
              <span className="font-semibold">
                {t("hi")}, {displayName}
              </span>
            ) : null}
            <Link
              href="/myaccount"
              onClick={(e) => {
                e.preventDefault();
                closeMenu();
                router.push("/myaccount");
              }}
              className="text-start text-gray-600"
            >
              {t("myAccount")}
            </Link>

            {allowAccountNavigation ? (
              <button
                type="button"
                onClick={handleLogout}
                className="text-start text-red-600"
              >
                {t("logout")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  router.push("/auth/login");
                }}
                className="text-start font-bold text-camion-red"
              >
                {t("logIn")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = useCustomerCartCount();
  const { user } = useUser();
  const wishlistCount = useCustomerWishlistCount();

  const displayName = String(
    user?.first_name ??
      user?.name ??
      user?.username ??
      (typeof user?.email === "string" ? user.email.split("@")[0] : "") ??
      "User",
  );

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <>
      <header className="bg-white relative z-[130] w-full">
        <TopPromoBar />
        <SecondaryTopBar />
        <div className="hidden lg:block">
          <HeaderDesktopCategoryNav
            totalItems={cartCount}
            wishlistCount={wishlistCount}
          />
        </div>
        <div className="lg:hidden">
          <MainHeader
            totalItems={cartCount}
            wishlistCount={wishlistCount}
            toggleMobileMenu={toggleMobileMenu}
            mobileMenuOpen={mobileMenuOpen}
          />
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        closeMenu={() => setMobileMenuOpen(false)}
        user={user}
        displayName={displayName}
      />
    </>
  );
}

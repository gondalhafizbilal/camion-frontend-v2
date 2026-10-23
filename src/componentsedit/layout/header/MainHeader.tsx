"use client";

import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import { useState, useRef } from "react";
import AccountDropdown from "./AccountDropdown";
import HeaderSearchBar from "./_components/HeaderSearchBar";
import HeaderCartButton from "./_components/HeaderCartButton";

export type MainHeaderProps = {
  totalItems?: number;
  wishlistCount?: number;
  toggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
};

export default function MainHeader({
  totalItems = 0,
  wishlistCount = 0,
  toggleMobileMenu,
  mobileMenuOpen,
}: MainHeaderProps) {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className="w-full flex justify-center"
      style={{
        opacity: 1,
        background: "linear-gradient(195.97deg, #CB272E -2.38%, #561013 340.54%)",
      }}
    >
      <div className="w-full flex flex-col px-4 md:px-10">
        <div className="w-full flex items-center" style={{ height: 71 }}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="p-2 hover:opacity-90 transition-opacity text-white"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen ? "true" : "false"}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/" className="flex-shrink-0">
              <Image
                src="/assets/icons/web.svg"
                alt="Camion Logo"
                width={78}
                height={30}
                priority
                unoptimized
                className="object-contain"
              />
            </Link>
          </div>

          <div className="flex-1" />

          <div className="flex items-center flex-shrink-0 text-white gap-4 sm:gap-6">
            <Link
              href="/wishlist"
              className="relative flex items-center hover:opacity-80 transition-opacity"
              style={{ gap: 8 }}
            >
              <span className="relative inline-block">
                <Image
                  src="/assets/icons/wishlist.svg"
                  alt="Wishlist"
                  width={32}
                  height={32}
                  unoptimized
                  className="block"
                />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-white text-[#CB272E] rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold px-0.5"
                    style={{ fontSize: 10 }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </span>
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: "16px",
                  textTransform: "capitalize",
                }}
              >
                Wishlist
              </span>
            </Link>

            <HeaderCartButton totalItems={totalItems} variant="mobile" showLabel />

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setAccountDropdownOpen((o) => !o)}
                className="flex items-center hover:opacity-80 transition-opacity text-white bg-transparent border-0 cursor-pointer p-0"
                style={{ gap: 8 }}
                aria-label="Profile"
                aria-haspopup="menu"
                aria-expanded={accountDropdownOpen ? "true" : "false"}
              >
                <Image
                  src="/assets/icons/user.svg"
                  alt="User"
                  width={32}
                  height={32}
                  unoptimized
                  className="block"
                />
                <span
                  className="hidden sm:inline"
                  style={{
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: 14,
                    lineHeight: "16px",
                    textTransform: "capitalize",
                  }}
                >
                  Profile
                </span>
              </button>
              <AccountDropdown
                isOpen={accountDropdownOpen}
                onClose={() => setAccountDropdownOpen(false)}
                containerRef={profileRef}
              />
            </div>
          </div>
        </div>

        <div className="w-full pb-3">
          <HeaderSearchBar variant="mobile" />
        </div>
      </div>
    </div>
  );
}

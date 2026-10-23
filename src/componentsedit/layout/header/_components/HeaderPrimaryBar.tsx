"use client";

import Image from "@/componentsedit/StaticImage";
import { BRAND_HEADER_GRADIENT } from "@/lib/styles/brandWarmGradient";
import { Link } from "@/i18n/navigation";
import { useRef, useState } from "react";
import type { GqlCategory } from "@/services/graphql/types/category";
import AccountDropdown from "../AccountDropdown";
import HeaderSearchBar from "./HeaderSearchBar";
import HeaderCartButton from "./HeaderCartButton";

export type HeaderPrimaryBarProps = {
  totalItems?: number;
  wishlistCount?: number;
  /** Level-1 category roots (desktop); rendered after the logo on the gradient bar. */
  categoryRoots?: GqlCategory[];
  categoryLoading?: boolean;
  highlightRootSlug?: string;
  onCategoryRootPointerEnter?: (root: GqlCategory) => void;
};

export default function HeaderPrimaryBar({
  totalItems = 0,
  wishlistCount = 0,
  categoryRoots,
  categoryLoading = false,
  highlightRootSlug = "",
  onCategoryRootPointerEnter,
}: HeaderPrimaryBarProps) {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className="w-full relative"
      style={{
        height: 50,
        background: BRAND_HEADER_GRADIENT,
      }}
    >
      <div className="w-full h-full flex min-w-0 items-center gap-3 md:gap-4 relative px-4 md:px-10 z-10">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/icons/web.svg"
            alt="Logo"
            width={78}
            height={31}
            priority
            unoptimized
            className="object-contain"
          />
        </Link>

        {categoryRoots != null && onCategoryRootPointerEnter ? (
          <nav
            aria-label="Main categories"
            className="hidden lg:flex min-w-0 max-w-[min(520px,min(42vw,38rem))] shrink"
          >
            <ul className="flex items-center gap-5 whitespace-nowrap overflow-x-auto py-1 [scrollbar-width:thin]">
              {categoryLoading && categoryRoots.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <li key={`root-sk-${i}`} className="shrink-0">
                      <span
                        className="inline-block h-3 w-14 rounded bg-white/25 animate-pulse"
                        aria-hidden
                      />
                    </li>
                  ))
                : categoryRoots.map((root) => {
                    const label = root.name || root.slug;
                    const active = highlightRootSlug === root.slug;
                    const rootClassName = [
                      "font-sans text-[12px] leading-5 font-bold inline-flex items-center",
                      "px-1.5 py-1 rounded-md shrink-0 border-0 cursor-pointer",
                      active ? "text-black" : "text-white",
                    ].join(" ");
                    return (
                      <li key={root.uuid} className="shrink-0">
                        <Link
                          href={`/categories/${root.slug}`}
                          onPointerEnter={() => onCategoryRootPointerEnter(root)}
                          onFocus={() => onCategoryRootPointerEnter(root)}
                          aria-current={active ? "page" : undefined}
                          className={rootClassName}
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
            </ul>
          </nav>
        ) : null}

        <div className="hidden lg:flex flex-1 justify-center min-w-0 px-1">
          <HeaderSearchBar variant="desktop" />
        </div>

        <div className="flex items-center gap-[24px] flex-shrink-0 ml-auto pr-1">
          <Link
            href="/wishlist"
            className="relative hover:opacity-90 transition-opacity"
            aria-label="Wishlist"
          >
            <Image
              src="/assets/icons/wishlist.svg"
              alt=""
              width={24}
              height={24}
              unoptimized
              className="block"
            />
            {wishlistCount > 0 && (
              <span
                className="absolute -top-2 -end-2 bg-white text-[#CB262E] rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold px-1"
                style={{ fontSize: 10 }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          <HeaderCartButton totalItems={totalItems} variant="desktop" />

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setAccountDropdownOpen((o) => !o)}
              className="hover:opacity-90 transition-opacity bg-transparent border-0 p-0 cursor-pointer w-6 h-6 flex items-center justify-center"
              aria-label="Profile"
              aria-haspopup="menu"
              aria-expanded={accountDropdownOpen ? "true" : "false"}
            >
              <Image
                src="/assets/icons/user.svg"
                alt=""
                width={24}
                height={24}
                unoptimized
                className="block"
              />
            </button>
            <AccountDropdown
              isOpen={accountDropdownOpen}
              onClose={() => setAccountDropdownOpen(false)}
              containerRef={profileRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

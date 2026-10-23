"use client";

import Image from "@/componentsedit/StaticImage";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
// import Filter from "@/componentsedit/filter";
import {
  addRecentSearch,
  readRecentSearches,
} from "@/lib/recentSearchStorage";
import { trackGtmSearch } from "@/componentsedit/analytics/gtmDiscovery";

function RecentChevron({ mirrored }: { mirrored?: boolean }) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={mirrored ? "scale-x-[-1]" : undefined}
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="#CB262E"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type HeaderSearchBarProps = {
  variant: "desktop" | "mobile";
  placeholder?: string;
};

export default function HeaderSearchBar({
  variant,
  placeholder,
}: HeaderSearchBarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const isRtl = locale === "ar";
  const resolvedPlaceholder = placeholder ?? t("headerSearchPlaceholder");

  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [showRecents, setShowRecents] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const refreshRecents = useCallback(() => {
    setRecents(readRecentSearches(locale));
  }, [locale]);

  useEffect(() => {
    refreshRecents();
  }, [refreshRecents]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target;
      if (
        showRecents &&
        t instanceof Node &&
        wrapperRef.current &&
        !wrapperRef.current.contains(t)
      ) {
        setShowRecents(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, [showRecents]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showRecents) setShowRecents(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showRecents]);

  const navigateSearch = useCallback(
    (term: string) => {
      const q = term.trim();
      if (!q) return;
      trackGtmSearch(q);
      const next = addRecentSearch(locale, q);
      setRecents(next);
      setShowRecents(false);
      router.push(`/shop?search=${encodeURIComponent(q)}`);
    },
    [locale, router],
  );

  const submit = useCallback(() => {
    navigateSearch(query);
  }, [navigateSearch, query]);

  const outerStyle =
    variant === "desktop"
      ? {
          width: "100%",
          maxWidth: 500,
          height: 42,
          padding: "8px 20px",
          gap: 10,
          background: "#FFFFFF",
        }
      : {
          height: 42,
          paddingBlock: 8,
          paddingInline: "20px 12px",
          gap: 10,
          background: "#FFFFFF",
        };

  const openRecentsPanel = recents.length > 0 && showRecents;

  return (
    <div
      ref={wrapperRef}
      className={
        variant === "desktop"
          ? "relative w-full min-w-0 max-w-[500px] shrink"
          : "relative w-full"
      }
    >
      <div
        className={[
          "header-search-bar flex min-w-0 items-center overflow-visible",
          openRecentsPanel ? "rounded-t-[4px] rounded-b-none" : "rounded-[4px]",
        ].join(" ")}
        style={outerStyle}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            dir={isRtl ? "rtl" : "ltr"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              const list = readRecentSearches(locale);
              setRecents(list);
              setShowRecents(list.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={resolvedPlaceholder}
            className={[
              "min-w-0 flex-1 shrink border-0 bg-transparent font-sans font-normal text-black outline-none",
              "placeholder:opacity-50 focus:outline-none focus-visible:outline-none",
              "text-start",
              variant === "mobile"
                ? "text-base leading-6"
                : "text-[12px] leading-[18px]",
            ].join(" ")}
            aria-controls={openRecentsPanel ? "header-recent-search-panel" : undefined}
            aria-autocomplete="list"
          />
          <div className="flex shrink-0 items-center gap-2">
            {/* <Filter variant="header" /> */}
            <button
              type="button"
              onClick={submit}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              aria-label={t("search")}
            >
              <Image
                src="/assets/icons/search.svg"
                alt=""
                width={24}
                height={24}
                unoptimized
                className="pointer-events-none h-6 w-6 shrink-0 object-contain"
              />
            </button>
          </div>
        </div>
      </div>

      {openRecentsPanel && (
        <div
          id="header-recent-search-panel"
          role="listbox"
          aria-label={t("recentSearch")}
          dir={isRtl ? "rtl" : "ltr"}
          className="absolute left-0 right-0 top-full z-[210] bg-white rounded-b-lg shadow-lg border border-black/10 border-t-0 overflow-hidden"
          style={{
            paddingTop: 20,
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 16,
          }}
        >
          <p
            className="font-sans text-sm font-normal leading-[18px] text-black mb-6"
            style={{ height: 18 }}
          >
            {t("recentSearch")}
          </p>
          <div className="flex flex-col p-0 m-0">
            {recents.map((term) => (
              <button
                key={term}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(term);
                  navigateSearch(term);
                }}
                className={[
                  "flex w-full flex-row items-center gap-2 box-border bg-white border-0 cursor-pointer",
                  "py-2 px-3 h-14 hover:bg-black/[0.03] transition-colors",
                  "text-start",
                ].join(" ")}
              >
                <span
                  className="min-w-0 flex-1 font-sans text-sm font-medium leading-[18px] text-black truncate"
                  style={{ maxWidth: 380 }}
                >
                  {term}
                </span>
                <span className="flex h-10 w-10 flex-none items-center justify-center shrink-0 opacity-80">
                  <RecentChevron mirrored={isRtl} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

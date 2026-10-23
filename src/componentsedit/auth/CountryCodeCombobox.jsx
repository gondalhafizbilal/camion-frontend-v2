"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

function buildCountryCodes() {
  return getCountries()
    .map((country) => {
      try {
        const callingCode = getCountryCallingCode(country);
        return {
          country,
          dialCode: `+${callingCode}`,
          label: `${country} (+${callingCode})`,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));
}

const ALL_COUNTRY_CODES = buildCountryCodes();

export default function CountryCodeCombobox({
  value,
  onChange,
  ariaLabel = "Country code",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(
    () => ALL_COUNTRY_CODES.find((item) => item.dialCode === value),
    [value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRY_CODES;
    return ALL_COUNTRY_CODES.filter(
      (item) =>
        item.country.toLowerCase().includes(q) ||
        item.dialCode.includes(q) ||
        item.label.toLowerCase().includes(q),
    );
  }, [search]);

  useEffect(() => {
    const onOutside = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({ top: 0 });
    }
  }, [open, search]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setSearch("");
    }
  }, [disabled]);

  return (
    <div
      ref={wrapperRef}
      dir="ltr"
      className={`relative shrink-0 min-w-[110px] ${disabled ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        disabled={disabled}
        className={`flex items-center gap-1 bg-transparent font-sans text-base leading-6 text-[#999999] outline-none border-0 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        aria-label={ariaLabel}
      >
        <span dir="ltr">{selected?.dialCode || value || "+974"}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-[#CB262E]"
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          dir="ltr"
          className="absolute z-40 mt-1 w-[260px] max-w-[75vw] rounded-md border border-black/10 bg-white shadow-lg"
        >
          <div className="p-2 border-b border-black/10">
            <input
              type="text"
              dir="ltr"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code"
              className="w-full px-2 py-1.5 text-sm border border-black/15 rounded outline-none focus:border-[#CB262E]"
              autoFocus
            />
          </div>
          <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.map((item) => (
              <button
                key={item.country}
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-black/5"
                onClick={() => {
                  onChange?.(item.dialCode);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {item.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-black/50">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

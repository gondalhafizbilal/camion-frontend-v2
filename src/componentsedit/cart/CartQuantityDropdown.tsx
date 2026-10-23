"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MAX_CART_QUANTITY } from "@/lib/cart/maxQuantity";

export type CartQuantityDropdownProps = {
  value: number;
  onChange: (qty: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Include `0` in the list (e.g. remove item). */
  includeZero?: boolean;
  maxOptions?: number;
  /** `above` for bottom sheets; `below` for drawers and inline forms. */
  menuPlacement?: "above" | "below";
  /** `compact` = narrow cart drawer rail; `default` = mobile bottom sheet. */
  size?: "default" | "compact";
};

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      className="shrink-0 text-black"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CartQuantityDropdown({
  value,
  onChange,
  disabled = false,
  ariaLabel = "Quantity",
  className = "",
  includeZero = true,
  maxOptions = MAX_CART_QUANTITY,
  menuPlacement = "below",
  size = "default",
}: CartQuantityDropdownProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const max = Math.max(1, Math.floor(Number(maxOptions) || MAX_CART_QUANTITY));
  const qty = Math.max(0, Math.floor(Number(value) || 0));
  const displayQty = Math.min(max, Math.max(1, qty));

  const options = useMemo(() => {
    const values = Array.from({ length: max }, (_, i) => i + 1);
    return includeZero ? [0, ...values] : values;
  }, [includeZero, max]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSelect = (next: number) => {
    onChange(next <= 0 ? 0 : Math.min(max, next));
    setOpen(false);
  };

  const menuPositionClass =
    menuPlacement === "above"
      ? "bottom-full left-0 right-0 mb-1.5"
      : "top-full left-0 right-0 mt-1.5";

  const isCompact = size === "compact";
  const triggerClass = isCompact
    ? "flex h-8 w-full touch-manipulation items-center justify-between gap-2 rounded-md border border-black/15 bg-white px-2 font-sans text-[11px] font-bold tabular-nums leading-tight text-black outline-none transition-colors hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-40"
    : "flex h-12 w-[104px] touch-manipulation items-center justify-between gap-2 rounded-lg border border-black/20 bg-white px-3 font-sans text-base font-medium tabular-nums text-black outline-none transition-colors hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-40";

  const optionClass = isCompact
    ? "flex w-full touch-manipulation items-center justify-between gap-2 px-2 py-2 text-start font-sans text-[11px] font-bold tabular-nums leading-tight text-black hover:bg-black/[0.05] active:bg-black/[0.08]"
    : "flex w-full touch-manipulation items-center justify-between gap-3 px-3 py-2.5 text-start font-sans text-base font-medium tabular-nums text-black hover:bg-black/[0.05] active:bg-black/[0.08]";

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
      >
        <span>{displayQty}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-black/55 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-10 max-h-56 overflow-y-auto overscroll-contain rounded-lg border border-black/10 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${menuPositionClass}`}
        >
          {options.map((option) => {
            const isSelected = option === 0 ? qty <= 0 : option === displayQty;
            return (
              <li key={option} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={optionClass}
                  onClick={() => handleSelect(option)}
                >
                  <span>{option}</span>
                  {isSelected ? <CheckIcon /> : <span className="w-[14px]" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

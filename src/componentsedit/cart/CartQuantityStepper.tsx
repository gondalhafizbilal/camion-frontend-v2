"use client";

import { MAX_CART_QUANTITY } from "@/lib/cart/maxQuantity";

export type CartQuantityStepperProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  /** Hard cap for the + control. Defaults to `MAX_CART_QUANTITY`. */
  max?: number;
  /** `pdp` = product detail; `cart` = cart page; `sheet` = mobile bottom sheet pill. */
  variant?: "pdp" | "cart" | "sheet";
  className?: string;
  decreaseAriaLabel?: string;
  increaseAriaLabel?: string;
};

export default function CartQuantityStepper({
  value,
  onDecrease,
  onIncrease,
  disabled = false,
  max = MAX_CART_QUANTITY,
  variant = "pdp",
  className = "",
  decreaseAriaLabel = "Decrease quantity",
  increaseAriaLabel = "Increase quantity",
}: CartQuantityStepperProps) {
  const qty = Math.max(1, Math.floor(Number(value) || 1));
  const atMax = qty >= max;

  if (variant === "sheet") {
    return (
      <div
        dir="ltr"
        className={`inline-flex h-12 shrink-0 items-center rounded-full border border-black/20 bg-white px-1 ${className}`}
      >
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || qty <= 1}
          className="flex h-10 w-10 touch-manipulation items-center justify-center font-sans text-xl leading-none text-black disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={decreaseAriaLabel}
        >
          −
        </button>
        <span
          className="min-w-[28px] text-center font-sans text-base font-medium tabular-nums text-black"
          aria-live="polite"
          aria-atomic="true"
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled || atMax}
          className="flex h-10 w-10 touch-manipulation items-center justify-center font-sans text-xl leading-none text-black disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={increaseAriaLabel}
        >
          +
        </button>
      </div>
    );
  }

  if (variant === "cart") {
    return (
      <div
        dir="ltr"
        className={`flex flex-row items-center justify-center gap-2 ${className}`}
      >
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || qty <= 1}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={decreaseAriaLabel}
        >
          <span className="block h-px w-[14.56px] bg-black" />
        </button>
        <div
          className="flex h-11 min-w-[40px] items-center justify-center rounded bg-[#CB262E] font-sans text-sm font-normal tabular-nums text-white"
          style={{ fontSize: 14.56, lineHeight: "15px" }}
          aria-live="polite"
          aria-atomic="true"
        >
          {qty}
        </div>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled || atMax}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={increaseAriaLabel}
        >
          <svg
            width={14.56}
            height={14.56}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-black"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className={`flex flex-row items-center justify-center ${className}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || qty <= 1}
        className="flex touch-manipulation items-center justify-center rounded-s-md border border-black/50 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ width: 40, height: 44 }}
        aria-label={decreaseAriaLabel}
      >
        <span className="block h-px w-6 bg-black" />
      </button>
      <div
        className="flex items-center justify-center border-y border-black/50 font-sans font-medium tabular-nums text-black"
        style={{ width: 80, height: 44, fontSize: 16, lineHeight: "28px" }}
        aria-live="polite"
        aria-atomic="true"
      >
        {qty}
      </div>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || atMax}
        className="flex touch-manipulation items-center justify-center rounded-e-md text-xl leading-none text-white disabled:cursor-not-allowed disabled:opacity-40"
        style={{ width: 41, height: 44, background: "#DB4444" }}
        aria-label={increaseAriaLabel}
      >
        +
      </button>
    </div>
  );
}

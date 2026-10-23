"use client";

import {
  getCheckoutLineTotal,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";
import { formatMinimumOrderMoney } from "@/lib/cart/formatMinimumOrderMoney";
import CartLineProductMedia from "./CartLineProductMedia";
import CartQuantityDropdown from "./CartQuantityDropdown";

export type CartDrawerCompactItemProps = {
  item: CheckoutCartLine;
  currencyCode: string;
  locale: string;
  highlighted?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  checkboxAriaLabel?: string;
  onQuantityChange?: (cartLineId: string | number | undefined, qty: number) => void;
  onRemove?: (cartLineId: string | number) => void;
};

export default function CartDrawerCompactItem({
  item,
  currencyCode,
  locale,
  highlighted = false,
  checked = true,
  onCheckedChange,
  checkboxAriaLabel = "Select item",
  onQuantityChange,
  onRemove,
}: CartDrawerCompactItemProps) {
  const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const lineTotal = getCheckoutLineTotal(item);
  const name = item.name ?? item.title ?? "Product";
  const cartLineId = item.id ?? item.key;
  const canMutateLine = cartLineId != null && cartLineId !== "";
  const priceLabel = formatMinimumOrderMoney(lineTotal, currencyCode, locale);
  const showCheckbox = typeof onCheckedChange === "function";

  const handleQtyChange = (next: number) => {
    if (!canMutateLine) return;
    if (next <= 0) {
      onRemove?.(cartLineId as string | number);
      return;
    }
    onQuantityChange?.(cartLineId, next);
  };

  return (
    <article className="flex w-full flex-col items-center gap-1.5">
      <div className="relative w-full">
        {showCheckbox ? (
          <label className="absolute start-1 top-1 z-[3] flex h-5 w-5 items-center justify-center rounded bg-white/95 shadow-sm ring-1 ring-black/10">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onCheckedChange(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#CB262E]"
              aria-label={checkboxAriaLabel}
            />
          </label>
        ) : null}
        <CartLineProductMedia
          item={item}
          alt={name}
          imageWidth={96}
          imageHeight={96}
          className="w-full"
          imageClassName="aspect-square h-full w-full object-cover"
          badgeClassName="text-[9px] px-1 py-0.5"
          showCampaign={false}
          overlay={
            highlighted ? (
              <span
                className="absolute end-1 top-1 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] text-white"
                aria-hidden
              >
                ✓
              </span>
            ) : null
          }
        />
      </div>

      <p className="w-full text-center font-sans text-[11px] font-semibold leading-tight tabular-nums text-black">
        {priceLabel}
      </p>

      <CartQuantityDropdown
        value={qty}
        onChange={handleQtyChange}
        disabled={!canMutateLine}
        ariaLabel={`Quantity for ${name}`}
        className="w-full"
        size="compact"
        menuPlacement="below"
      />
    </article>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { CART_DRAWER_Z } from "@/lib/cart/overlayZIndex";
import { CART_DRAWER_WIDTH_PX } from "@/lib/cart/cartDrawerLayout";
import { formatMinimumOrderMoney } from "@/lib/cart/formatMinimumOrderMoney";
import { summarizeCheckoutCart, type CheckoutCartLine } from "@/types/checkoutDisplay";
import { useCartProceedCheckout } from "@/hooks/useCartProceedCheckout";
import CartDrawerCompactItem from "./CartDrawerCompactItem";
import CartSummaryActionBar from "./CartSummaryActionBar";
import FreeShippingProgressBanner from "./FreeShippingProgressBanner";
import { EcommerceMotionLink, EcommerceMotionButton } from "@/componentsedit/buttons/EcommerceMotionButton";
import { writeCheckoutCartItemUuids } from "@/lib/checkout/checkoutReviewSession";
import {
  collectCheckoutLineUuids,
  getCheckoutLineUuid,
  isPartialCartCheckoutSelection,
} from "@/lib/checkout/checkoutCartItemUuids";

export type CartDrawerProps = {
  open: boolean;
  cart: CheckoutCartLine[];
  loading?: boolean;
  currencyCode: string;
  locale: string;
  totalItems: number;
  highlightedLineId?: string | null;
  showAddedBanner?: boolean;
  onClose: () => void;
  onQuantityChange?: (cartLineId: string | number | undefined, qty: number) => void;
  onRemove?: (cartLineId: string | number) => void;
};

export default function CartDrawer({
  open,
  cart,
  loading = false,
  currencyCode,
  locale,
  totalItems,
  highlightedLineId = null,
  showAddedBanner = false,
  onClose,
  onQuantityChange,
  onRemove,
}: CartDrawerProps) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const isLoggedIn = Boolean(Cookies.get("token"));
  const isRtl = locale === "ar";
  const slideOffset = isRtl ? -CART_DRAWER_WIDTH_PX : CART_DRAWER_WIDTH_PX;

  const allLineUuids = useMemo(() => collectCheckoutLineUuids(cart), [cart]);
  const [checkedUuids, setCheckedUuids] = useState<string[]>(() => allLineUuids);

  useEffect(() => {
    setCheckedUuids((prev) => {
      const prevSet = new Set(prev);
      const allSet = new Set(allLineUuids);
      const kept = prev.filter((id) => allSet.has(id));
      const added = allLineUuids.filter((id) => !prevSet.has(id));
      if (kept.length === prev.length && added.length === 0) return prev;
      return [...kept, ...added];
    });
  }, [allLineUuids]);

  const checkedSet = useMemo(() => new Set(checkedUuids), [checkedUuids]);
  const allChecked =
    allLineUuids.length > 0 && checkedUuids.length === allLineUuids.length;
  const someChecked = checkedUuids.length > 0;
  const selectedLines = useMemo(
    () => cart.filter((line) => checkedSet.has(getCheckoutLineUuid(line))),
    [cart, checkedSet],
  );
  const selectedSummary = useMemo(
    () => summarizeCheckoutCart(selectedLines),
    [selectedLines],
  );
  const subtotal = selectedSummary.cart_total ?? 0;
  const subtotalLabel = formatMinimumOrderMoney(subtotal, currencyCode, locale);
  const {
    minimumOrderAchieved,
    handleProceedCheckoutClick,
    handleBlockedCheckout,
  } = useCartProceedCheckout(subtotal);

  const toggleLineChecked = useCallback((uuid: string, next: boolean) => {
    if (!uuid) return;
    setCheckedUuids((prev) => {
      const has = prev.includes(uuid);
      if (next && !has) return [...prev, uuid];
      if (!next && has) return prev.filter((id) => id !== uuid);
      return prev;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setCheckedUuids((prev) =>
      prev.length === allLineUuids.length ? [] : [...allLineUuids],
    );
  }, [allLineUuids]);

  const persistCheckoutSelection = useCallback(() => {
    if (isPartialCartCheckoutSelection(allLineUuids, checkedUuids)) {
      writeCheckoutCartItemUuids(checkedUuids);
    } else {
      writeCheckoutCartItemUuids(null);
    }
  }, [allLineUuids, checkedUuids]);

  const handleCheckoutNav = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!someChecked) {
      e.preventDefault();
      toast.error(t("selectCartItemsToCheckout"), {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    persistCheckoutSelection();
    handleProceedCheckoutClick(e);
    if (!e.defaultPrevented) onClose();
  };

  const handleBlockedOrEmpty = () => {
    if (!someChecked) {
      toast.error(t("selectCartItemsToCheckout"), {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    handleBlockedCheckout();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const title = t("cartDrawerTitle");

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.aside
          key="cart-drawer-panel"
          role="complementary"
          aria-label={title}
          className="fixed inset-y-0 end-0 flex flex-col border-s border-black/[0.08] bg-white"
          style={{ zIndex: CART_DRAWER_Z, width: CART_DRAWER_WIDTH_PX }}
          initial={{ x: slideOffset, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: slideOffset, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        >
          <div
            className="h-[2px] w-full shrink-0"
            style={{
              background:
                "linear-gradient(90deg, #CB262E 0%, #F47919 55%, #CB262E 100%)",
            }}
            aria-hidden
          />

          <header className="flex shrink-0 flex-col items-center gap-1.5 border-b border-black/[0.06] px-2 py-2">
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded-full text-black/40 hover:bg-black/[0.05] hover:text-black/70"
                aria-label={t("close")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {cart.length > 0 ? (
              <CartSummaryActionBar
                variant="rail"
                totalItems={totalItems}
                subtotalLabel={subtotalLabel}
                href="/cart"
                onClick={onClose}
              />
            ) : null}

            {showAddedBanner ? (
              <p className="w-full text-center font-sans text-[9px] font-medium leading-tight text-[#16A34A]">
                {t("cartDrawerAddedSuccess")}
              </p>
            ) : null}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
            {loading && cart.length === 0 ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={`cart-rail-skel-${i}`}
                    className="aspect-square w-full animate-pulse rounded-md bg-black/[0.04]"
                  />
                ))}
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CB262E]/10 text-[#CB262E]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 6h15l-1.5 9h-12L6 6z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-sans text-[10px] font-medium leading-snug text-black/70">
                  {!isLoggedIn ? t("loginForBetterExperience") : t("yourCartIsEmpty")}
                </p>
                <Link
                  href="/shop"
                  className="font-sans text-[12px] font-bold leading-tight text-[#CB262E] underline underline-offset-2"
                >
                  {t("shopMore")}
                </Link>
              </div>
            ) : (
              <>
                <label className="mb-2 flex w-full items-center gap-1.5 px-0.5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked && !allChecked;
                    }}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 shrink-0 accent-[#CB262E]"
                    aria-label={
                      allChecked ? t("unselectAllCartItems") : t("selectAllCartItems")
                    }
                  />
                  <span className="min-w-0 truncate font-sans text-[10px] font-medium leading-tight text-black/70">
                    {allChecked ? t("unselectAllCartItems") : t("selectAllCartItems")}
                  </span>
                </label>
                <ul className="flex flex-col gap-3">
                  {cart.map((item) => {
                    const cartLineId = String(item.id ?? item.key ?? "").trim();
                    const lineUuid = getCheckoutLineUuid(item);
                    const rowKey = cartLineId || String(item.productId ?? item.name ?? "");
                    return (
                      <li key={rowKey}>
                        <CartDrawerCompactItem
                          item={item}
                          currencyCode={currencyCode}
                          locale={locale}
                          highlighted={Boolean(
                            highlightedLineId &&
                              cartLineId &&
                              cartLineId === highlightedLineId,
                          )}
                          checked={Boolean(lineUuid && checkedSet.has(lineUuid))}
                          onCheckedChange={(next) => toggleLineChecked(lineUuid, next)}
                          checkboxAriaLabel={t("selectCartItem")}
                          onQuantityChange={onQuantityChange}
                          onRemove={onRemove}
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {cart.length > 0 ? (
            <footer className="shrink-0 border-t border-black/[0.06] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <FreeShippingProgressBanner
                cartSubtotal={subtotal}
                currencyCode={currencyCode}
                locale={locale}
                variant="compact"
                className="mb-2"
              />

              {minimumOrderAchieved && someChecked ? (
                <EcommerceMotionLink
                  href="/checkout"
                  onClick={handleCheckoutNav}
                  className="flex min-h-[32px] w-full items-center justify-center rounded-md px-1 font-sans text-[12px] font-bold tabular-nums leading-tight text-white"
                  surfaceClassName="rounded-md bg-[#CB262E]"
                >
                  {t("cartDrawerGoToCheckout")}
                </EcommerceMotionLink>
              ) : (
                <EcommerceMotionButton
                  type="button"
                  onClick={handleBlockedOrEmpty}
                  className="flex min-h-[32px] w-full items-center justify-center rounded-md px-1 font-sans text-[12px] font-bold tabular-nums leading-tight text-white"
                  surfaceClassName="rounded-md bg-[#CB262E]"
                >
                  {t("cartDrawerGoToCheckout")}
                </EcommerceMotionButton>
              )}
            </footer>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

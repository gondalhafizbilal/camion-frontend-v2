"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CART_MOBILE_ADDED_SHEET_Z } from "@/lib/cart/overlayZIndex";
import type { CheckoutCartLine } from "@/types/checkoutDisplay";
import CartQuantityStepper from "./CartQuantityStepper";
import { clampCartQuantity, MAX_CART_QUANTITY } from "@/lib/cart/maxQuantity";

export type MobileCartAddedSheetProps = {
  open: boolean;
  cart: CheckoutCartLine[];
  loading?: boolean;
  highlightedLineId?: string | null;
  onClose: () => void;
  onQuantityChange?: (cartLineId: string | number | undefined, qty: number) => void;
};

function resolveSheetLine(
  cart: CheckoutCartLine[],
  highlightedLineId?: string | null,
): CheckoutCartLine | null {
  if (cart.length === 0) return null;

  const highlight = String(highlightedLineId ?? "").trim();
  if (highlight) {
    const match = cart.find(
      (item) => String(item.id ?? item.key ?? "").trim() === highlight,
    );
    if (match) return match;
  }

  return cart[cart.length - 1] ?? null;
}

export default function MobileCartAddedSheet({
  open,
  cart,
  loading = false,
  highlightedLineId = null,
  onClose,
  onQuantityChange,
}: MobileCartAddedSheetProps) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);

  const activeLine = useMemo(
    () => resolveSheetLine(cart, highlightedLineId),
    [cart, highlightedLineId],
  );

  const activeQty = Math.max(1, Math.floor(Number(activeLine?.quantity) || 1));
  const activeLineId = activeLine?.id ?? activeLine?.key;
  const canMutateLine = activeLineId != null && activeLineId !== "";
  const activeLineName = activeLine?.name ?? activeLine?.title ?? t("product");

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

  const handleDecrease = () => {
    if (!canMutateLine || loading) return;
    const next = Math.max(1, activeQty - 1);
    if (next === activeQty) return;
    onQuantityChange?.(activeLineId, next);
  };

  const handleIncrease = () => {
    if (!canMutateLine || loading) return;
    if (activeQty >= MAX_CART_QUANTITY) return;
    onQuantityChange?.(activeLineId, clampCartQuantity(activeQty + 1));
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-cart-added-sheet"
          role="complementary"
          aria-label={t("cartDrawerAddedSuccess")}
          className="fixed inset-x-0 bottom-0 isolate lg:hidden"
          style={{ zIndex: CART_MOBILE_ADDED_SHEET_Z }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          <div className="w-full rounded-t-[20px] bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_32px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3">
              {activeLine ? (
                <CartQuantityStepper
                  variant="sheet"
                  value={activeQty}
                  onDecrease={handleDecrease}
                  onIncrease={handleIncrease}
                  disabled={loading || !canMutateLine}
                  max={MAX_CART_QUANTITY}
                  decreaseAriaLabel={`${t("quantity")} ${activeLineName}`}
                  increaseAriaLabel={`${t("quantity")} ${activeLineName}`}
                />
              ) : null}

              <Link
                href="/cart"
                onClick={onClose}
                className="flex h-12 min-w-0 flex-1 touch-manipulation items-center justify-center rounded-full bg-[#CB262E] px-4 font-sans text-[15px] font-bold leading-tight text-white shadow-[0_4px_14px_rgba(203,38,46,0.28)] transition-opacity hover:opacity-95 active:opacity-95"
              >
                {t("cartDrawerGoToCart")}
              </Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

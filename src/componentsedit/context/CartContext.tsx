"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { invalidateUserCartCache } from "@/lib/cartCache";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import {
  summarizeCheckoutCart,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";
import {
  clearAllCartItemsViaApi,
  deleteCartItem,
  fetchCartLinesFromApi,
  patchCartItem,
  postAddCartItem,
  resolveV1CartIdentifiers,
  type CartProductRef,
} from "@/services/cart/cartItemsApi";
import { dispatchCartCountInvalidated } from "@/hooks/useCustomerCartCount";
import { clampCartQuantity } from "@/lib/cart/maxQuantity";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { trackFacebookAddToCartFromCartRef } from "@/componentsedit/analytics/facebookAddToCart";
import { trackTikTokAddToCartFromCartRef } from "@/componentsedit/analytics/tiktokAddToCart";
import { trackGtmAddToCartFromCartRef } from "@/componentsedit/analytics/gtmFunnel";
import { useCartDrawerEnabled } from "@/hooks/useCartDrawerEnabled";
import { isProductDetailPathname } from "@/lib/cart/isProductDetailPathname";
import { useMinimumOrder } from "@/componentsedit/context/MinimumOrderContext";
import { useFreeShipping } from "@/componentsedit/context/FreeShippingContext";
import {
  pushGtmCartLineEvent,
  pushGtmThresholdTransitions,
} from "@/componentsedit/analytics/gtmCommerceEvents";

export type ProductRef = CartProductRef;

export type CartLineItem = CheckoutCartLine;

export type AddToCartResult = {
  ok: boolean;
  cartItemUuid?: string;
};

export type AddToCartOptions = {
  /** Skip drawer / mobile sheet / highlight after a successful add (e.g. Buy Now → checkout). */
  suppressFeedback?: boolean;
};

type VariationInput = { attribute?: unknown; value?: unknown };

type CartContextValue = {
  cart: CheckoutCartLine[];
  setCart: Dispatch<SetStateAction<CheckoutCartLine[]>>;
  totalItems: number;
  loading: boolean;
  addToCart: (
    product: ProductRef,
    quantity?: number,
    variation?: VariationInput[],
    options?: AddToCartOptions,
  ) => Promise<AddToCartResult>;
  /** Removes a cart line by its **cart line UUID** (`item.id` from GET /v1/cart-items). */
  removeFromCart: (cartItemUuid: string | number) => Promise<void>;
  /** Updates quantity for a cart line by **cart line UUID**. */
  updateQuantity: (cartItemUuid: string | number, qty: number) => Promise<void>;
  fetchCart: (forceRefresh?: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
  isCartDrawerOpen: boolean;
  openCartDrawer: (opts?: { highlightLineId?: string | null; showAddedBanner?: boolean }) => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;
  highlightedLineId: string | null;
  showAddedBanner: boolean;
  isMobileCartAddedSheetOpen: boolean;
  closeMobileCartAddedSheet: () => void;
  /** Desktop drawer, mobile PDP sheet, or toast — after a successful add/update on PDP. */
  showPostAddCartFeedback: (opts?: {
    highlightLineId?: string | null;
    showAddedBanner?: boolean;
  }) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function safeUserId(): string {
  return Cookies.get("id") || "";
}

function cartLanguageFromPathname(pathname: string | null): "en" | "ar" {
  const seg = pathname?.split("/")[1] || "en";
  return seg === "ar" ? "ar" : "en";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { currency } = useCurrency();
  const { minimumAmount, ready: minimumOrderReady } = useMinimumOrder();
  const { thresholdAmount: freeShippingThreshold, ready: freeShippingReady } =
    useFreeShipping();
  const [cart, setCart] = useState<CheckoutCartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);
  const [showAddedBanner, setShowAddedBanner] = useState(false);
  const [isMobileCartAddedSheetOpen, setIsMobileCartAddedSheetOpen] = useState(false);
  const isCartDrawerEnabled = useCartDrawerEnabled();

  const closeMobileCartAddedSheet = useCallback(() => {
    setIsMobileCartAddedSheetOpen(false);
    setHighlightedLineId(null);
  }, []);

  const openMobileCartAddedSheet = useCallback(
    (opts?: { highlightLineId?: string | null }) => {
      if (isCartDrawerEnabled) return;
      setHighlightedLineId(opts?.highlightLineId ?? null);
      setIsMobileCartAddedSheetOpen(true);
    },
    [isCartDrawerEnabled],
  );

  const showPostAddCartFeedback = useCallback(
    (opts?: { highlightLineId?: string | null; showAddedBanner?: boolean }) => {
      if (pathname?.includes("/checkout")) return;
      toast.success(t("cartProductAddedSuccess"));
      if (isCartDrawerEnabled) {
        setHighlightedLineId(opts?.highlightLineId ?? null);
        setShowAddedBanner(opts?.showAddedBanner !== false);
        setIsCartDrawerOpen(true);
        return;
      }
      if (isProductDetailPathname(pathname)) {
        openMobileCartAddedSheet({
          highlightLineId: opts?.highlightLineId ?? null,
        });
        return;
      }
    },
    [pathname, isCartDrawerEnabled, openMobileCartAddedSheet, t],
  );

  const openCartDrawer = useCallback(
    (opts?: { highlightLineId?: string | null; showAddedBanner?: boolean }) => {
      if (!isCartDrawerEnabled) return;
      setHighlightedLineId(opts?.highlightLineId ?? null);
      setShowAddedBanner(Boolean(opts?.showAddedBanner));
      setIsCartDrawerOpen(true);
    },
    [isCartDrawerEnabled],
  );

  const closeCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(false);
    setHighlightedLineId(null);
    setShowAddedBanner(false);
  }, []);

  const toggleCartDrawer = useCallback(() => {
    setIsCartDrawerOpen((open) => {
      if (open) {
        setHighlightedLineId(null);
        setShowAddedBanner(false);
      }
      return !open;
    });
  }, []);

  const totalItems = cart.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0),
    0,
  );

  const loadCartFromApi = useCallback(
    async (opts?: { silent?: boolean }): Promise<CheckoutCartLine[]> => {
      const authToken = Cookies.get("token");
      const silent = Boolean(opts?.silent);
      if (!authToken) {
        setCart([]);
        setLoading(false);
        const userId = safeUserId();
        if (userId) invalidateUserCartCache(userId);
        return [];
      }

      if (!silent) setLoading(true);
      try {
        const lang = cartLanguageFromPathname(pathname);
        const lines = await fetchCartLinesFromApi(
          authToken,
          lang,
          String(currency || "QAR").toLowerCase(),
        );
        setCart(lines);
        return lines;
      } catch {
        setCart([]);
        return [];
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [pathname, currency],
  );

  const fetchCart = useCallback(
    async (_forceRefresh = false) => {
      await loadCartFromApi();
    },
    [loadCartFromApi],
  );

  useEffect(() => {
    void loadCartFromApi();
  }, [loadCartFromApi]);

  useEffect(() => {
    const onSessionUpdate = () => void loadCartFromApi();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSessionUpdate);
    return () =>
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSessionUpdate);
  }, [loadCartFromApi]);

  useEffect(() => {
    if (!isCartDrawerEnabled && isCartDrawerOpen) {
      closeCartDrawer();
    }
  }, [isCartDrawerEnabled, isCartDrawerOpen, closeCartDrawer]);

  const addToCart = async (
    product: ProductRef,
    quantity = 1,
    _variation: VariationInput[] = [],
    options?: AddToCartOptions,
  ): Promise<AddToCartResult> => {
    const authToken = Cookies.get("token");
    if (!authToken) {
      toast.error(t("cartSignInToAdd"), {
        position: "top-center",
        autoClose: 2000,
      });
      router.push("/auth/signup");
      return { ok: false };
    }

    const ids = resolveV1CartIdentifiers(product);
    if (!ids) {
      toast.error(t("cartProductCannotAdd"));
      return { ok: false };
    }

    const qty = clampCartQuantity(quantity);
    const previousCartValue = summarizeCheckoutCart(cart).cart_total ?? 0;

    try {
      setLoading(true);
      const result = await postAddCartItem(authToken, {
        productUuid: ids.productUuid,
        variantUuid: ids.variantUuid,
        quantity: qty,
        currency: String(currency || "QAR").toLowerCase(),
      });
      if (!result.ok) {
        toast.error(result.message);
        return { ok: false };
      }
      trackFacebookAddToCartFromCartRef(
        product,
        qty,
        String(currency || "QAR"),
      );
      trackTikTokAddToCartFromCartRef(
        product,
        qty,
        String(currency || "QAR"),
      );
      trackGtmAddToCartFromCartRef(
        product,
        qty,
        String(currency || "QAR"),
      );
      const lines = await loadCartFromApi();
      pushGtmThresholdTransitions({
        previousCartValue,
        nextCartValue: summarizeCheckoutCart(lines).cart_total ?? 0,
        minimumOrderThreshold: minimumOrderReady ? minimumAmount : null,
        freeShippingThreshold: freeShippingReady
          ? freeShippingThreshold
          : null,
        currency: String(currency || "QAR"),
        source: "add_to_cart",
      });
      dispatchCartCountInvalidated();
      let cartItemUuid = String(result.cartItemUuid ?? "").trim() || undefined;
      if (!cartItemUuid) {
        const match = lines.find((line) => {
          const lineVariant = String(line.variantUuid ?? "").trim();
          const lineProduct = String(line.productId ?? line.product_id ?? "").trim();
          return (
            lineVariant === ids.variantUuid &&
            lineProduct === ids.productUuid
          );
        });
        cartItemUuid = match
          ? String(match.cartItemUuid ?? match.id ?? match.key ?? "").trim() ||
            undefined
          : undefined;
      }
      if (!options?.suppressFeedback) {
        showPostAddCartFeedback({
          highlightLineId: cartItemUuid ?? null,
          showAddedBanner: true,
        });
      }
      return { ok: true, cartItemUuid };
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error(t("somethingWentWrong"));
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemUuid: string | number) => {
    const authToken = Cookies.get("token");
    if (!authToken) {
      toast.warn(t("cartSignInToRemove"), {
        position: "top-center",
        autoClose: 2000,
      });
      router.push("/auth/signup");
      return;
    }

    const lineId = String(cartItemUuid ?? "").trim();
    if (!lineId) {
      toast.error(t("cartInvalidItem"));
      return;
    }
    const removedLine = cart.find(
      (line) =>
        String(line.cartItemUuid ?? line.id ?? line.key ?? "").trim() === lineId,
    );
    const previousCartValue = summarizeCheckoutCart(cart).cart_total ?? 0;

    try {
      setLoading(true);
      const result = await deleteCartItem(authToken, lineId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (removedLine) {
        pushGtmCartLineEvent("remove_from_cart", removedLine, {
          cartValue: previousCartValue,
          currency: String(currency || "QAR"),
          source: "remove_line",
        });
      }
      await loadCartFromApi();
      toast.success(t("cartItemRemovedSuccess"));
    } catch (err) {
      console.error("Remove from cart error:", err);
      toast.error(t("cartRemoveItemError"));
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemUuid: string | number, qty: number) => {
    const authToken = Cookies.get("token");
    if (!authToken) {
      toast.warn(t("cartSignInToUpdate"), {
        position: "top-center",
        autoClose: 2000,
      });
      router.push("/auth/signup");
      return;
    }

    const lineId = String(cartItemUuid ?? "").trim();
    if (!lineId) {
      toast.error(t("cartInvalidItem"));
      return;
    }

    const nextQty = clampCartQuantity(qty);

    const line = cart.find((x) => String(x.id ?? "").trim() === lineId);
    const productUuid = String(
      line?.productId ?? line?.product_id ?? "",
    ).trim();
    const variantUuid =
      String(line?.variantUuid ?? "").trim() || productUuid;
    if (!line || !productUuid || !variantUuid) {
      toast.error(t("cartUpdateLineFailed"));
      void loadCartFromApi();
      dispatchCartCountInvalidated();
      return;
    }

    const previousLine = line;
    const previousCartValue = summarizeCheckoutCart(cart).cart_total ?? 0;
    // Optimistic local update so the cart UI does not remount / flash a skeleton.
    setCart((prev) =>
      prev.map((item) => {
        if (String(item.id ?? "").trim() !== lineId) return item;
        const unit = Number(item.price) || 0;
        const nextSub = unit * nextQty;
        return {
          ...item,
          quantity: nextQty,
          subTotal: nextSub,
          ...(item.total != null ? { total: nextSub } : {}),
        };
      }),
    );

    try {
      const result = await patchCartItem(authToken, lineId, {
        productUuid,
        variantUuid,
        quantity: nextQty,
        currency: String(currency || "QAR").toLowerCase(),
      });
      if (!result.ok) {
        setCart((prev) =>
          prev.map((item) =>
            String(item.id ?? "").trim() === lineId ? previousLine : item,
          ),
        );
        toast.error(result.message);
        void loadCartFromApi({ silent: true });
        return;
      }
      const lines = await loadCartFromApi({ silent: true });
      pushGtmThresholdTransitions({
        previousCartValue,
        nextCartValue: summarizeCheckoutCart(lines).cart_total ?? 0,
        minimumOrderThreshold: minimumOrderReady ? minimumAmount : null,
        freeShippingThreshold: freeShippingReady
          ? freeShippingThreshold
          : null,
        currency: String(currency || "QAR"),
        source: "update_cart_quantity",
      });
      dispatchCartCountInvalidated();
    } catch (err) {
      console.error("Update quantity error:", err);
      setCart((prev) =>
        prev.map((item) =>
          String(item.id ?? "").trim() === lineId ? previousLine : item,
        ),
      );
      toast.error(t("cartUpdateQuantityError"));
      void loadCartFromApi({ silent: true });
    }
  };

  const clearCart = async () => {
    const authToken = Cookies.get("token");
    if (!authToken) {
      toast.warn(t("cartSignInToClear"), {
        position: "top-center",
        autoClose: 2000,
      });
      router.push("/auth/signup");
      return;
    }

    const removedLines = [...cart];
    const previousCartValue = summarizeCheckoutCart(removedLines).cart_total ?? 0;

    try {
      setLoading(true);
      const result = await clearAllCartItemsViaApi(authToken);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      for (const line of removedLines) {
        pushGtmCartLineEvent("remove_from_cart", line, {
          cartValue: previousCartValue,
          currency: String(currency || "QAR"),
          source: "clear_cart",
        });
      }
      await loadCartFromApi();
      dispatchCartCountInvalidated();
      toast.success(t("cartClearedSuccess"));
    } catch (err) {
      console.error("Clear cart error:", err);
      toast.error(t("cartClearFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        totalItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        fetchCart,
        clearCart,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        toggleCartDrawer,
        highlightedLineId,
        showAddedBanner,
        isMobileCartAddedSheetOpen,
        closeMobileCartAddedSheet,
        showPostAddCartFeedback,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

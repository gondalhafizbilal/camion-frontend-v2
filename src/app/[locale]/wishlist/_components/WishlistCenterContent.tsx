"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import Cookies from "js-cookie";
import { loadWishlistCarouselProducts } from "@/services/graphql";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import { useCart } from "@/componentsedit/context/CartContext";
import { useUser } from "@/componentsedit/context/UserContext";
import AccountLoginPromptCard from "@/app/[locale]/myaccount/_components/AccountLoginPromptCard";
import {
  dispatchWishlistCountInvalidated,
  WISHLIST_COUNT_INVALIDATED_EVENT,
} from "@/hooks/useCustomerWishlistCount";
import { dispatchCartCountInvalidated } from "@/hooks/useCustomerCartCount";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import {
  carouselProductToCartRef,
  postAddCartItem,
  resolveV1CartIdentifiers,
} from "@/services/cart/cartItemsApi";
import { removeProductFromWishlistRequest } from "@/services/wishlist/addProductToWishlist";
import { toast } from "@/componentsedit/toast";
import { PAGE_CONTENT_INNER_CLASS } from "@/lib/layout/pageContentLayout";
import { trackFacebookAddToCartFromCartRef } from "@/componentsedit/analytics/facebookAddToCart";
import { trackGtmAddToCartFromCartRef } from "@/componentsedit/analytics/gtmFunnel";
import ProductCarouselTrack from "@/componentsedit/home/ProductCarouselTrack";
import {
  CAROUSEL_CARD_HEIGHT_CLASS,
  CAROUSEL_CARD_WIDTH_CLASS,
} from "@/lib/styles/carouselCardLayout";
import { trackTikTokAddToCartFromCartRef } from "@/componentsedit/analytics/tiktokAddToCart";

function wishlistEntryUuidOf(product: CarouselProduct): string {
  return typeof product.wishlistEntryUuid === "string"
    ? product.wishlistEntryUuid.trim()
    : "";
}

export default function WishlistCenterContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { addToCart, fetchCart } = useCart();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<CarouselProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [moveAllBusy, setMoveAllBusy] = useState(false);

  const isGuest = !userLoading && !user;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const language = locale === "ar" ? "ar" : "en";
      const currencyCode = String(currency || "QAR").toLowerCase();
      const token = Cookies.get("token") ?? null;
      const list = await loadWishlistCarouselProducts(
        { language, currency: currencyCode },
        token,
      );
      setItems(list);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [locale, currency]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    void fetchProducts();
  }, [fetchProducts, user, userLoading]);

  useEffect(() => {
    const onInvalidate = () => {
      if (userLoading || !user) return;
      void fetchProducts();
    };
    window.addEventListener(WISHLIST_COUNT_INVALIDATED_EVENT, onInvalidate);
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onInvalidate);
    return () => {
      window.removeEventListener(WISHLIST_COUNT_INVALIDATED_EVENT, onInvalidate);
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onInvalidate);
    };
  }, [fetchProducts, user, userLoading]);

  const handleAddToCart = async (product: CarouselProduct) => {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCart(ref, 1, []);
  };

  const handleMoveAllToBag = useCallback(async () => {
    if (items.length === 0) {
      toast.info(t("wishlistMoveAllEmpty"));
      return;
    }
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("pleaseSignInOrCreateAccount"));
      return;
    }
    setMoveAllBusy(true);
    let added = 0;
    let failed = 0;
    const removedEntryUuids = new Set<string>();
    try {
      for (const product of items) {
        const ref = carouselProductToCartRef(product);
        if (!ref) {
          failed += 1;
          continue;
        }
        const ids = resolveV1CartIdentifiers(ref);
        if (!ids) {
          failed += 1;
          continue;
        }
        const result = await postAddCartItem(token, {
          productUuid: ids.productUuid,
          variantUuid: ids.variantUuid,
          quantity: 1,
          currency: String(currency || "QAR").toLowerCase(),
        });
        if (!result.ok) {
          failed += 1;
          continue;
        }
        trackFacebookAddToCartFromCartRef(ref, 1, String(currency || "QAR"));
        trackTikTokAddToCartFromCartRef(ref, 1, String(currency || "QAR"));
        trackGtmAddToCartFromCartRef(ref, 1, String(currency || "QAR"));
        added += 1;
        const entryUuid = wishlistEntryUuidOf(product);
        if (!entryUuid) continue;
        const removed = await removeProductFromWishlistRequest(entryUuid, token);
        if (removed.ok) removedEntryUuids.add(entryUuid);
      }
      if (removedEntryUuids.size > 0) {
        setItems((prev) =>
          prev.filter((p) => {
            const id = wishlistEntryUuidOf(p);
            return !id || !removedEntryUuids.has(id);
          }),
        );
      }
      await fetchCart(true);
      dispatchCartCountInvalidated();
      dispatchWishlistCountInvalidated();
      if (added > 0 && failed === 0) {
        toast.success(t("wishlistMovedAllToCart", { count: added }));
      } else if (added > 0) {
        toast.warning(t("wishlistMoveAllPartial", { added, failed }));
      } else {
        toast.error(t("wishlistMoveAllNothingAdded"));
      }
    } catch {
      toast.error(t("wishlistMoveAllNothingAdded"));
    } finally {
      setMoveAllBusy(false);
    }
  }, [items, t, fetchCart, currency]);

  const count = items.length || 0;
  const headerCount = isGuest ? 0 : count;
  const moveAllDisabled =
    isGuest || userLoading || loading || items.length === 0 || moveAllBusy;

  return (
    <div className="flex w-full min-w-0 justify-center">
      <div className={`${PAGE_CONTENT_INNER_CLASS} flex min-w-0 flex-col items-stretch gap-8 px-0 md:gap-10 lg:gap-[60px]`}>
        <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className="font-sans text-lg font-semibold leading-tight text-black sm:text-xl sm:leading-[26px] md:text-xl">
            {t("wishlist")} ({headerCount})
          </h1>

          <button
            type="button"
            onClick={() => void handleMoveAllToBag()}
            disabled={moveAllDisabled}
            className="flex min-h-[48px] w-full shrink-0 flex-row items-center justify-center gap-2 rounded border border-black/50 px-5 py-3 font-sans text-sm font-medium leading-6 text-black transition-colors hover:bg-black/[0.03] disabled:pointer-events-none disabled:opacity-50 sm:min-h-[50px] sm:w-auto sm:px-8 sm:text-base sm:leading-6 md:max-w-none md:px-12"
          >
            {moveAllBusy ? t("loading") || "…" : t("moveAllToBag")}
          </button>
        </div>

        {userLoading ? (
          <ProductCarouselTrack
            variant="page"
            showNav={false}
            trackClassName="max-w-full"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`${CAROUSEL_CARD_WIDTH_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS} shrink-0 animate-pulse rounded-[2.87px] bg-gray-100`}
              />
            ))}
          </ProductCarouselTrack>
        ) : isGuest ? (
          <AccountLoginPromptCard promptIcon="wishlist" />
        ) : (
          <ProductCarouselTrack
            variant="page"
            trackClassName="max-w-full"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${CAROUSEL_CARD_WIDTH_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS} shrink-0 animate-pulse rounded-[2.87px] bg-gray-100`}
                  />
                ))
              : items.map((p) => (
                  <ProductCarouselCard
                    key={
                      (typeof p?.wishlistEntryUuid === "string"
                        ? p.wishlistEntryUuid
                        : null) ?? String(p?.id ?? p?.slug ?? p?.name ?? "")
                    }
                    product={p}
                    onAddToCart={handleAddToCart}
                  />
                ))}
          </ProductCarouselTrack>
        )}
      </div>
    </div>
  );
}

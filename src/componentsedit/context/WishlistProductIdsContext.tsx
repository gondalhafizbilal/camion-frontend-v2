"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { fetchCustomerWishlist } from "@/services/graphql";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import {
  WISHLIST_COUNT_INVALIDATED_EVENT,
  dispatchWishlistCountInvalidated,
} from "@/hooks/useCustomerWishlistCount";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import {
  addProductToWishlistRequest,
  removeProductFromWishlistRequest,
  resolveProductUuidForWishlist,
  WISHLIST_ERROR_ACCOUNT_REQUIRED,
} from "@/services/wishlist/addProductToWishlist";
import { pushGtmProductEvent } from "@/componentsedit/analytics/gtmCommerceEvents";

type WishlistProductIdsContextValue = {
  /** Whether `getCustomerWishlist` has been loaded for the current session (or guest cleared). */
  hydrated: boolean;
  isWishlisted: (productUuid: string) => boolean;
  toggleWishlist: (product: CarouselProduct) => Promise<void>;
};

const WishlistProductIdsContext = createContext<WishlistProductIdsContextValue | null>(
  null,
);

export function WishlistProductIdsProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations();
  const language = locale === "ar" ? "ar" : "en";
  const { currency } = useCurrency();
  const router = useRouter();
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [entryUuidByProductUuid, setEntryUuidByProductUuid] = useState<
    Map<string, string>
  >(() => new Map());
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setIds(new Set());
      setEntryUuidByProductUuid(new Map());
      setHydrated(true);
      return;
    }
    try {
      const data = await fetchCustomerWishlist(
        { language, currency: String(currency || "QAR").toLowerCase() },
        token,
      );
      const next = new Set<string>();
      const nextEntryMap = new Map<string, string>();
      for (const row of data.getCustomerWishlist ?? []) {
        const productUuid = row.product?.uuid?.trim();
        const entryUuid = typeof row?.uuid === "string" ? row.uuid.trim() : "";
        if (productUuid) {
          next.add(productUuid);
          if (entryUuid) nextEntryMap.set(productUuid, entryUuid);
        }
      }
      setIds(next);
      setEntryUuidByProductUuid(nextEntryMap);
    } catch {
      setIds(new Set());
      setEntryUuidByProductUuid(new Map());
    } finally {
      setHydrated(true);
    }
  }, [language, currency]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onRefresh);
    window.addEventListener(WISHLIST_COUNT_INVALIDATED_EVENT, onRefresh);
    return () => {
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onRefresh);
      window.removeEventListener(WISHLIST_COUNT_INVALIDATED_EVENT, onRefresh);
    };
  }, [load]);

  const isWishlisted = useCallback((productUuid: string) => ids.has(productUuid), [ids]);

  const toggleWishlist = useCallback(
    async (product: CarouselProduct) => {
      const productUuid = resolveProductUuidForWishlist(product);
      if (!productUuid) {
        toast.error(t("wishlistCannotUpdateProduct"));
        return;
      }
      const token = Cookies.get("token");
      if (!token) {
        toast.error(t("wishlistSignInToUse"));
        router.push("/auth/signup");
        return;
      }

      const inList = ids.has(productUuid);
      if (inList) {
        const entryUuid =
          (typeof (product as unknown as { wishlistEntryUuid?: unknown })
            ?.wishlistEntryUuid === "string"
            ? String(
                (product as unknown as { wishlistEntryUuid?: string }).wishlistEntryUuid,
              ).trim()
            : "") ||
          entryUuidByProductUuid.get(productUuid) ||
          "";
        if (!entryUuid) {
          toast.error(t("wishlistMissingEntryRefreshing"));
          await load();
          return;
        }
        const result = await removeProductFromWishlistRequest(entryUuid, token);
        if (!result.ok) {
          if (result.message === WISHLIST_ERROR_ACCOUNT_REQUIRED) {
            toast.error(t("wishlistRequiresRegisteredAccount"));
            router.push("/auth/signup");
            return;
          }
          toast.error(result.message);
          return;
        }
        setIds((prev) => {
          const n = new Set(prev);
          n.delete(productUuid);
          return n;
        });
        setEntryUuidByProductUuid((prev) => {
          const n = new Map(prev);
          n.delete(productUuid);
          return n;
        });
        toast.success(t("wishlistRemovedSuccess"));
      } else {
        const result = await addProductToWishlistRequest(product, token);
        if (!result.ok) {
          if (result.message === WISHLIST_ERROR_ACCOUNT_REQUIRED) {
            toast.error(t("wishlistRequiresRegisteredAccount"));
            router.push("/auth/signup");
            return;
          }
          toast.error(result.message);
          return;
        }
        setIds((prev) => new Set(prev).add(productUuid));
        pushGtmProductEvent("add_to_wishlist", product, {
          currency: String(currency || "QAR"),
          source: "wishlist_toggle",
        });
        toast.success(t("wishlistAddedSuccess"));
      }
      await load();
      dispatchWishlistCountInvalidated();
    },
    [ids, router, entryUuidByProductUuid, load, t, currency],
  );

  const value = useMemo(
    () => ({ hydrated, isWishlisted, toggleWishlist }),
    [hydrated, isWishlisted, toggleWishlist],
  );

  return (
    <WishlistProductIdsContext.Provider value={value}>
      {children}
    </WishlistProductIdsContext.Provider>
  );
}

export function useWishlistProductIds(): WishlistProductIdsContextValue {
  const ctx = useContext(WishlistProductIdsContext);
  if (!ctx) {
    throw new Error(
      "useWishlistProductIds must be used within WishlistProductIdsProvider",
    );
  }
  return ctx;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import {
  clearProductListSession,
  readProductListSession,
  updateProductListSessionScrollY,
  writeProductListSession,
  type ProductListSessionSnapshot,
} from "@/lib/productListSessionCache";

const SCROLL_SAVE_DEBOUNCE_MS = 200;

export type ProductListSessionListState = {
  products: CarouselProduct[];
  page: number;
  hasMore: boolean;
  filtersKey?: string;
};

export type UseProductListSessionRestoreOptions = {
  listId: string;
  queryKey?: string;
  locale: string;
  currency: string;
};

export function useProductListSessionRestore({
  listId,
  queryKey = "",
  locale,
  currency,
}: UseProductListSessionRestoreOptions) {
  const [sessionBoot] = useState<ProductListSessionSnapshot | null>(() => {
    if (typeof window === "undefined") return null;
    return readProductListSession(listId, locale, currency, queryKey);
  });

  const skipInitialFetchRef = useRef(Boolean(sessionBoot));
  const skipPageFetchRef = useRef(Boolean(sessionBoot && sessionBoot.page > 1));
  const scrollRestoreYRef = useRef<number | null>(
    sessionBoot && sessionBoot.scrollY > 0 ? sessionBoot.scrollY : null,
  );

  const persist = useCallback(
    (state: ProductListSessionListState) => {
      if (state.products.length === 0) return;
      writeProductListSession(listId, locale, currency, queryKey, {
        products: state.products,
        page: state.page,
        hasMore: state.hasMore,
        scrollY: typeof window !== "undefined" ? window.scrollY : 0,
        filtersKey: state.filtersKey,
      });
    },
    [listId, locale, currency, queryKey],
  );

  const clearSession = useCallback(() => {
    clearProductListSession(listId, locale, currency, queryKey);
    skipInitialFetchRef.current = false;
    skipPageFetchRef.current = false;
    scrollRestoreYRef.current = null;
  }, [listId, locale, currency, queryKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        updateProductListSessionScrollY(listId, locale, currency, queryKey);
      }, SCROLL_SAVE_DEBOUNCE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [listId, locale, currency, queryKey]);

  const restoreScrollAfterPaint = useCallback(() => {
    const y = scrollRestoreYRef.current;
    if (y == null || y <= 0) return;
    scrollRestoreYRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    });
  }, []);

  const consumeInitialFetchSkip = useCallback((): boolean => {
    if (!skipInitialFetchRef.current) return false;
    skipInitialFetchRef.current = false;
    return true;
  }, []);

  const consumePageFetchSkip = useCallback((): boolean => {
    if (!skipPageFetchRef.current) return false;
    skipPageFetchRef.current = false;
    return true;
  }, []);

  return {
    sessionBoot,
    persist,
    clearSession,
    restoreScrollAfterPaint,
    consumeInitialFetchSkip,
    consumePageFetchSkip,
  };
}

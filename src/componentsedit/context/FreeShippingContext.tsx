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
import Cookies from "js-cookie";
import { fetchFreeShippingValue } from "@/services/graphql/operations/settings";
import { parseFreeShippingValue } from "@/lib/cart/parseFreeShippingValue";
import { shouldShowFreeShippingBar } from "@/lib/cart/freeShipping";
import { useCurrency } from "./CurrencyContext";

type FreeShippingContextValue = {
  /** From API when loaded; `null` if missing, error, or invalid response. */
  thresholdAmount: number | null;
  loading: boolean;
  /** True after a successful fetch with a valid threshold amount. */
  ready: boolean;
  /** True when threshold is configured and should be shown in UI. */
  active: boolean;
  refresh: () => Promise<void>;
};

const FreeShippingContext = createContext<FreeShippingContextValue | null>(null);

export function FreeShippingProvider({ children }: { children: ReactNode }) {
  const { currency } = useCurrency();
  const [thresholdAmount, setThresholdAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const currencyCode = String(currency || "QAR").trim().toLowerCase();
    setLoading(true);
    setReady(false);
    try {
      const token = Cookies.get("token") ?? null;
      const data = await fetchFreeShippingValue({ currency: currencyCode }, token);
      const parsed = parseFreeShippingValue(data.getFreeShippingValue);
      if (parsed != null) {
        setThresholdAmount(parsed);
        setReady(true);
      } else {
        setThresholdAmount(null);
        setReady(false);
      }
    } catch {
      setThresholdAmount(null);
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = shouldShowFreeShippingBar(ready, thresholdAmount);

  const value = useMemo(
    () => ({
      thresholdAmount,
      loading,
      ready,
      active,
      refresh: load,
    }),
    [thresholdAmount, loading, ready, active, load],
  );

  return (
    <FreeShippingContext.Provider value={value}>{children}</FreeShippingContext.Provider>
  );
}

export function useFreeShipping(): FreeShippingContextValue {
  const ctx = useContext(FreeShippingContext);
  if (!ctx) {
    throw new Error("useFreeShipping must be used within FreeShippingProvider");
  }
  return ctx;
}

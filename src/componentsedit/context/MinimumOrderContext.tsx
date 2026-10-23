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
import { fetchMinimumOrderValue } from "@/services/graphql/operations/settings";
import { parseMinimumOrderValue } from "@/lib/cart/parseMinimumOrderValue";
import { shouldEnforceMinimumOrder } from "@/lib/cart/minimumOrder";
import { useCurrency } from "./CurrencyContext";

type MinimumOrderContextValue = {
  /** From API when loaded; `null` if missing, error, or invalid response. */
  minimumAmount: number | null;
  loading: boolean;
  /** True after a successful fetch with a valid minimum amount. */
  ready: boolean;
  /** False when API failed — checkout is allowed; server order APIs enforce minimum. */
  enforceMinimum: boolean;
  refresh: () => Promise<void>;
};

const MinimumOrderContext = createContext<MinimumOrderContextValue | null>(null);

export function MinimumOrderProvider({ children }: { children: ReactNode }) {
  const { currency } = useCurrency();
  const [minimumAmount, setMinimumAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const currencyCode = String(currency || "QAR").trim().toLowerCase();
    setLoading(true);
    setReady(false);
    try {
      const token = Cookies.get("token") ?? null;
      const data = await fetchMinimumOrderValue(
        { currency: currencyCode },
        token,
      );
      const parsed = parseMinimumOrderValue(data.getMinimumOrderValue);
      if (parsed != null) {
        setMinimumAmount(parsed);
        setReady(true);
      } else {
        setMinimumAmount(null);
        setReady(false);
      }
    } catch {
      setMinimumAmount(null);
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    void load();
  }, [load]);

  const enforceMinimum = shouldEnforceMinimumOrder(ready, minimumAmount);

  const value = useMemo(
    () => ({
      minimumAmount,
      loading,
      ready,
      enforceMinimum,
      refresh: load,
    }),
    [minimumAmount, loading, ready, enforceMinimum, load],
  );

  return (
    <MinimumOrderContext.Provider value={value}>
      {children}
    </MinimumOrderContext.Provider>
  );
}

export function useMinimumOrder(): MinimumOrderContextValue {
  const ctx = useContext(MinimumOrderContext);
  if (!ctx) {
    throw new Error("useMinimumOrder must be used within MinimumOrderProvider");
  }
  return ctx;
}

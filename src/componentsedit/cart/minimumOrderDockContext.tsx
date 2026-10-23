"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type EmphasizeCheckoutBlockedOptions = {
  /**
   * When set (e.g. Buy Now line total = unit price × qty), the min-order dock
   * evaluates/displays this amount instead of the full cart subtotal.
   */
  subtotal?: number;
};

type MinimumOrderDockContextValue = {
  /** Expanded “checkout blocked” emphasis (same dock, Temu-style). */
  checkoutBlocked: boolean;
  /**
   * Optional subtotal for the blocked dock (Buy Now). `null` → use live cart.
   */
  blockSubtotalOverride: number | null;
  emphasizeCheckoutBlocked: (opts?: EmphasizeCheckoutBlockedOptions) => void;
  dismissCheckoutBlocked: () => void;
};

const MinimumOrderDockContext = createContext<MinimumOrderDockContextValue | null>(
  null,
);

export function MinimumOrderDockProvider({ children }: { children: ReactNode }) {
  const [checkoutBlocked, setCheckoutBlocked] = useState(false);
  const [blockSubtotalOverride, setBlockSubtotalOverride] = useState<number | null>(
    null,
  );

  const emphasizeCheckoutBlocked = useCallback(
    (opts?: EmphasizeCheckoutBlockedOptions) => {
      const raw = opts?.subtotal;
      if (raw != null && Number.isFinite(Number(raw))) {
        setBlockSubtotalOverride(Math.max(0, Number(raw)));
      } else {
        setBlockSubtotalOverride(null);
      }
      setCheckoutBlocked(true);
    },
    [],
  );

  const dismissCheckoutBlocked = useCallback(() => {
    setCheckoutBlocked(false);
    setBlockSubtotalOverride(null);
  }, []);

  const value = useMemo(
    () => ({
      checkoutBlocked,
      blockSubtotalOverride,
      emphasizeCheckoutBlocked,
      dismissCheckoutBlocked,
    }),
    [
      checkoutBlocked,
      blockSubtotalOverride,
      emphasizeCheckoutBlocked,
      dismissCheckoutBlocked,
    ],
  );

  return (
    <MinimumOrderDockContext.Provider value={value}>
      {children}
    </MinimumOrderDockContext.Provider>
  );
}

export function useMinimumOrderDock(): MinimumOrderDockContextValue {
  const ctx = useContext(MinimumOrderDockContext);
  if (!ctx) {
    throw new Error("useMinimumOrderDock must be used within MinimumOrderDockProvider");
  }
  return ctx;
}

/** Safe when provider is optional (e.g. tests). */
export function useMinimumOrderDockOptional(): MinimumOrderDockContextValue | null {
  return useContext(MinimumOrderDockContext);
}

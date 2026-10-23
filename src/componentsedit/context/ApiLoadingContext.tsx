"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useFakeProgress } from "@/hooks/useFakeProgress";

/** If `startFetch`/`endFetch` ever desync, the overlay can stick; this clears it. */
const API_LOADING_STUCK_RESET_MS = 45_000;

export type ApiLoadingContextValue = {
  isApiLoading: boolean;
  progress: number;
  startFetch: () => void;
  endFetch: () => void;
};

const ApiLoadingContext = createContext<ApiLoadingContextValue | null>(null);

export function ApiLoadingProvider({ children }: { children: ReactNode }) {
  const [activeFetches, setActiveFetches] = useState(0);
  const isApiLoading = activeFetches > 0;
  const progress = useFakeProgress(isApiLoading);

  useEffect(() => {
    if (activeFetches <= 0) return;
    const t = window.setTimeout(() => {
      console.warn(
        "[ApiLoadingProvider] activeFetches > 0 for",
        API_LOADING_STUCK_RESET_MS,
        "ms — resetting overlay (safeguard).",
      );
      setActiveFetches(0);
    }, API_LOADING_STUCK_RESET_MS);
    return () => window.clearTimeout(t);
  }, [activeFetches]);

  const startFetch = useCallback(() => {
    setActiveFetches((prev) => prev + 1);
  }, []);

  const endFetch = useCallback(() => {
    setActiveFetches((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <ApiLoadingContext.Provider
      value={{ isApiLoading, progress, startFetch, endFetch }}
    >
      {children}
    </ApiLoadingContext.Provider>
  );
}

export function useApiLoading(): ApiLoadingContextValue {
  const ctx = useContext(ApiLoadingContext);
  if (!ctx) {
    throw new Error("useApiLoading must be used within ApiLoadingProvider");
  }
  return ctx;
}

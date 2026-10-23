export const CURRENCY_STORAGE_KEY = "camion_currency_code_v1";

const COOKIE_MAX_AGE_SECONDS = 31536000;

/** Persist selected currency in localStorage + cookie (SSR reads the cookie). */
export function persistCurrencyPreference(code: string): void {
  if (typeof window === "undefined") return;
  const normalized = String(code || "")
    .toUpperCase()
    .trim();
  if (!/^[A-Z]{3}$/.test(normalized)) return;

  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, normalized);
    document.cookie = `${CURRENCY_STORAGE_KEY}=${encodeURIComponent(normalized)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch {
    /* quota / private mode */
  }
}

export function readStoredCurrencyCode(): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY)?.toUpperCase()?.trim();
  return stored && /^[A-Z]{3}$/.test(stored) ? stored : null;
}

/** Re-run server components so GraphQL SSR uses the updated currency cookie. */
export function scheduleCurrencyRouteRefresh(refresh: () => void | Promise<void>): void {
  if (typeof window === "undefined") return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void refresh();
    });
  });
}

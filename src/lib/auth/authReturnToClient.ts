"use client";

import Cookies from "js-cookie";
import {
  AUTH_RETURN_TO_COOKIE,
  AUTH_RETURN_TO_KEY,
  AUTH_RETURN_TO_MAX_MS,
  buildLocalizedPathname,
  normalizeAuthReturnPath,
} from "@/lib/auth/authReturnTo";
import { normalizeAppLocale } from "@/lib/auth/oauthReturnLocale";

function authReturnCookieOptions() {
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  return {
    path: "/" as const,
    sameSite: "Lax" as const,
    expires: new Date(Date.now() + AUTH_RETURN_TO_MAX_MS),
    ...(isSecure ? { secure: true as const } : {}),
  };
}

export function setAuthReturnTo(path: string): void {
  const normalized = normalizeAuthReturnPath(path);
  if (!normalized) return;
  sessionStorage.setItem(AUTH_RETURN_TO_KEY, normalized);
  Cookies.set(AUTH_RETURN_TO_COOKIE, normalized, authReturnCookieOptions());
}

/** Read `?returnTo=/cart` when landing on login/signup/verify. */
export function captureAuthReturnToFromUrl(): void {
  if (typeof window === "undefined") return;
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  if (returnTo) setAuthReturnTo(returnTo);
}

export function peekAuthReturnTo(): string | null {
  const fromStorage = normalizeAuthReturnPath(sessionStorage.getItem(AUTH_RETURN_TO_KEY));
  if (fromStorage) return fromStorage;
  return normalizeAuthReturnPath(Cookies.get(AUTH_RETURN_TO_COOKIE));
}

export function clearAuthReturnTo(): void {
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  Cookies.remove(AUTH_RETURN_TO_COOKIE, { path: "/" });
}

export function resolveAuthReturnPath(
  explicitPath?: string | null,
  fallback = "/",
): string {
  const urlReturn =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("returnTo")
      : null;
  for (const raw of [
    explicitPath,
    urlReturn,
    sessionStorage.getItem(AUTH_RETURN_TO_KEY),
    Cookies.get(AUTH_RETURN_TO_COOKIE),
  ]) {
    const normalized = normalizeAuthReturnPath(raw);
    if (normalized) return normalized;
  }
  return fallback;
}

export function consumeAuthReturnTo(fallback = "/"): string {
  const path = resolveAuthReturnPath(null, fallback);
  clearAuthReturnTo();
  return path;
}

export function buildAuthVerifyHref(returnPath?: string | null): string {
  const path = normalizeAuthReturnPath(returnPath ?? undefined);
  if (!path || path === "/") return "/auth/verify";
  return `/auth/verify?returnTo=${encodeURIComponent(path)}`;
}

export function navigateAfterAuth(
  locale: string,
  fallback = "/",
  explicitPath?: string | null,
): void {
  const path = resolveAuthReturnPath(explicitPath, fallback);
  clearAuthReturnTo();
  window.location.assign(
    buildLocalizedPathname(normalizeAppLocale(locale), path),
  );
}

type I18nRouter = { push: (href: string) => void };

export function goToLogin(router: I18nRouter, returnTo = "/cart"): void {
  setAuthReturnTo(returnTo);
  router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
}

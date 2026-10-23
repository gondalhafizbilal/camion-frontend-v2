import { routing, type AppLocale } from "@/i18n/routing";

export const AUTH_RETURN_TO_KEY = "auth_return_to";

/** Client cookie backup (sessionStorage can be lost across some auth steps). */
export const AUTH_RETURN_TO_COOKIE = "auth_return_to_path";

/** OAuth callback reads this (sessionStorage is not available server-side). */
export const OAUTH_RETURN_PATH_COOKIE = "oauth_return_path";

export const AUTH_RETURN_TO_MAX_MS = 15 * 60 * 1000;

/** Safe internal path only — blocks open redirects and auth loops. */
export function normalizeAuthReturnPath(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  let path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/auth")) return null;

  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (path === prefix) return "/";
    if (path.startsWith(`${prefix}/`)) {
      path = path.slice(prefix.length);
      break;
    }
  }

  return path || "/";
}

export function buildLocalizedPathname(
  locale: AppLocale,
  returnPath?: string | null,
): string {
  const normalized = normalizeAuthReturnPath(returnPath);
  if (!normalized || normalized === "/") return `/${locale}/`;
  return `/${locale}${normalized}`;
}

export function resolveLocalizedAuthReturnUrl(
  origin: string,
  locale: AppLocale,
  returnPath?: string | null,
): URL {
  return new URL(buildLocalizedPathname(locale, returnPath), origin);
}

export function clearOauthReturnPathSetCookie(isHttps: boolean): string {
  let line = `${OAUTH_RETURN_PATH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  if (isHttps) line += "; Secure";
  return line;
}

/** No-op (debug logging removed). Kept so dev hot-reload does not break mid-session. */
export function logAuthReturn(_step?: string, _details?: Record<string, unknown>): void {}

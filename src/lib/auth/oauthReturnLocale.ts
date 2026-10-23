import { routing, type AppLocale } from "@/i18n/routing";

/** Set on the client before leaving to Google/Facebook; read on OAuth callback redirect. */
export const OAUTH_RETURN_LOCALE_COOKIE = "oauth_return_locale";

/** Enough time to complete provider login + redirects. */
export const OAUTH_RETURN_LOCALE_MAX_MS = 15 * 60 * 1000;

export function normalizeAppLocale(raw: string | undefined | null): AppLocale {
  const v = String(raw ?? "").trim().toLowerCase();
  if ((routing.locales as readonly string[]).includes(v)) {
    return v as AppLocale;
  }
  return routing.defaultLocale;
}

export function clearOauthReturnLocaleSetCookie(isHttps: boolean): string {
  let line = `${OAUTH_RETURN_LOCALE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  if (isHttps) line += "; Secure";
  return line;
}

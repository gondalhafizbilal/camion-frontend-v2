"use client";

import Cookies from "js-cookie";
import { getGuestUuidForCustomerAuth } from "@/lib/auth/isGuestClient";
import { clearAuthReturnTo, peekAuthReturnTo } from "@/lib/auth/authReturnToClient";
import { OAUTH_RETURN_PATH_COOKIE } from "@/lib/auth/authReturnTo";
import {
  OAUTH_GUEST_UUID_COOKIE,
  OAUTH_GUEST_UUID_MAX_MS,
} from "./oauthGuestUuid";
import {
  OAUTH_RETURN_LOCALE_COOKIE,
  OAUTH_RETURN_LOCALE_MAX_MS,
  normalizeAppLocale,
} from "./oauthReturnLocale";

/** Call immediately before navigating to Google/Facebook. */
export function setOauthReturnLocaleBeforeProviderRedirect(locale: string): void {
  const l = normalizeAppLocale(locale);
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const cookieOpts = {
    path: "/",
    sameSite: "Lax" as const,
    expires: new Date(Date.now() + OAUTH_RETURN_LOCALE_MAX_MS),
    ...(isSecure ? { secure: true } : {}),
  };

  Cookies.set(OAUTH_RETURN_LOCALE_COOKIE, l, cookieOpts);

  const guestUUID = getGuestUuidForCustomerAuth();
  if (guestUUID) {
    Cookies.set(OAUTH_GUEST_UUID_COOKIE, guestUUID, {
      ...cookieOpts,
      expires: new Date(Date.now() + OAUTH_GUEST_UUID_MAX_MS),
    });
  }

  const returnTo = peekAuthReturnTo();
  if (returnTo) {
    Cookies.set(OAUTH_RETURN_PATH_COOKIE, returnTo, cookieOpts);
    clearAuthReturnTo();
  }
}

import { type NextRequest, NextResponse } from "next/server";
import {
  clearOauthGuestUuidSetCookie,
  OAUTH_GUEST_UUID_COOKIE,
} from "@/lib/auth/oauthGuestUuid";
import {
  clearOauthReturnPathSetCookie,
  OAUTH_RETURN_PATH_COOKIE,
  resolveLocalizedAuthReturnUrl,
} from "@/lib/auth/authReturnTo";
import {
  clearOauthReturnLocaleSetCookie,
  normalizeAppLocale,
  OAUTH_RETURN_LOCALE_COOKIE,
} from "@/lib/auth/oauthReturnLocale";

export const runtime = "nodejs";

const BASE_URL_AUTH = process.env.NEXT_PUBLIC_API_BASE_URL;
const ORIGINAL_CALLBACK_URL = `${BASE_URL_AUTH}/auth/facebook/callback`;

function envSiteOrigin(): string | null {
  const raw = String(process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const isInternalHost = /(^ip-\d|\.compute\.internal$)/i.test(host);
  const envOrigin = envSiteOrigin();

  if (isInternalHost && envOrigin) return envOrigin;

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const proto =
    forwardedProto || (host.includes("localhost") || host.startsWith("192.168.") ? "http" : "https");

  return `${proto}://${host}`;
}

function getAllSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const sc = headers.get("set-cookie");
  return sc ? [sc] : [];
}

type RedirectResult = {
  response: Response | null;
  allSetCookies: string[];
};

async function fetchWithRedirects(
  url: string,
  fetchOptions: RequestInit,
  maxHops = 5,
): Promise<RedirectResult> {
  let currentUrl = url;
  let response: Response | null = null;
  const allSetCookies: string[] = [];

  for (let i = 0; i < maxHops; i++) {
    response = await fetch(currentUrl, { ...fetchOptions, redirect: "manual" });

    const hopCookies = getAllSetCookies(response.headers);
    hopCookies.forEach((c) => allSetCookies.push(c));

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      const location = response.headers.get("location");
      if (location) {
        currentUrl = new URL(location, currentUrl).toString();
      }
      continue;
    }

    return { response, allSetCookies };
  }

  return { response, allSetCookies };
}

type TokenCandidate = { name: string; value: string; original: string };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const fullOriginalCallbackUrl = new URL(ORIGINAL_CALLBACK_URL);
  searchParams.forEach((value, key) => {
    fullOriginalCallbackUrl.searchParams.append(key, value);
  });
  const guestUUID = request.cookies.get(OAUTH_GUEST_UUID_COOKIE)?.value?.trim();
  if (guestUUID) {
    fullOriginalCallbackUrl.searchParams.set("guestUUID", guestUUID);
  }

  try {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    const { response, allSetCookies } = await fetchWithRedirects(
      fullOriginalCallbackUrl.toString(),
      { method: "GET", headers },
    );

    if (!response) {
      return new NextResponse("No response from backend callback.", {
        status: 502,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return new NextResponse(`Backend callback failed: ${errorText}`, {
        status: response.status,
      });
    }

    const locale = normalizeAppLocale(
      request.cookies.get(OAUTH_RETURN_LOCALE_COOKIE)?.value,
    );
    const returnPath = request.cookies.get(OAUTH_RETURN_PATH_COOKIE)?.value;
    const finalRedirect = resolveLocalizedAuthReturnUrl(
      getPublicOrigin(request),
      locale,
      returnPath,
    );
    const nextRes = NextResponse.redirect(finalRedirect);

    const isHttps = finalRedirect.protocol === "https:";

    const duplicatedTokenCandidates: TokenCandidate[] = [];

    for (const cookie of allSetCookies) {
      if (!cookie) continue;

      let rewritten = cookie.replace(/;?\s*Domain=[^;]+/gi, "");

      if (!isHttps) rewritten = rewritten.replace(/;?\s*Secure/gi, "");

      const finalCookie = rewritten
        .replace(/^\s*;\s*/g, "")
        .replace(/;\s*$/, "");

      nextRes.headers.append("set-cookie", finalCookie);

      const m = finalCookie.match(/^\s*([^=;\s]+)=([^;]*)/);
      if (m) {
        const name = m[1];
        const value = m[2];
        const lower = name.toLowerCase();
        if (
          lower === "token" ||
          lower === "accesstoken" ||
          lower === "access_token" ||
          lower === "jwt" ||
          lower === "session" ||
          lower === "auth"
        ) {
          duplicatedTokenCandidates.push({
            name,
            value,
            original: finalCookie,
          });
        }
      }
    }

    nextRes.headers.append(
      "set-cookie",
      clearOauthReturnLocaleSetCookie(isHttps),
    );
    nextRes.headers.append(
      "set-cookie",
      clearOauthReturnPathSetCookie(isHttps),
    );
    nextRes.headers.append(
      "set-cookie",
      clearOauthGuestUuidSetCookie(isHttps),
    );

    if (duplicatedTokenCandidates.length > 0) {
      const preferred =
        duplicatedTokenCandidates.find((c) => c.name.toLowerCase() === "token") ??
        duplicatedTokenCandidates[0];

      const maxAgeMatch = preferred.original.match(/;\s*Max-Age=(\d+)/i);
      const expiresMatch = preferred.original.match(/;\s*Expires=([^;]+)/i);
      let maxAge: number | null = null;
      if (maxAgeMatch) maxAge = Number(maxAgeMatch[1]);

      if (!maxAge && expiresMatch) {
        try {
          const exp = new Date(expiresMatch[1]);
          const diff = Math.max(
            0,
            Math.floor((exp.getTime() - Date.now()) / 1000),
          );
          if (diff > 0) maxAge = diff;
        } catch {
          /* ignore */
        }
      }

      let clientCookie = `token=${preferred.value}; Path=/; SameSite=Lax`;
      if (maxAge) clientCookie += `; Max-Age=${maxAge}`;
      if (isHttps) clientCookie += `; Secure`;

      nextRes.headers.append("set-cookie", clientCookie);
      nextRes.headers.append(
        "set-cookie",
        `loginType=customer; Path=/; SameSite=Lax${maxAge ? `; Max-Age=${maxAge}` : ""}${isHttps ? "; Secure" : ""}`,
      );
      nextRes.headers.append(
        "set-cookie",
        `auth_method=oauth; Path=/; SameSite=Lax${maxAge ? `; Max-Age=${maxAge}` : ""}${isHttps ? "; Secure" : ""}`,
      );
    }

    return nextRes;
  } catch (e) {
    console.error("Facebook callback proxy error:", e);
    return new NextResponse(
      "Internal Server Error during callback processing.",
      { status: 500 },
    );
  }
}

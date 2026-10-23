import { type NextRequest, NextResponse } from "next/server";

const BASE_URL_AUTH = process.env.NEXT_PUBLIC_API_BASE_URL;
const EXTERNAL_FACEBOOK_AUTH_URL = `${BASE_URL_AUTH}/auth/facebook`;
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

export async function GET(request: NextRequest) {
  try {
    const forwardedHeaders = new Headers();
    forwardedHeaders.set("Content-Type", "application/json");

    const response = await fetch(EXTERNAL_FACEBOOK_AUTH_URL, {
      method: "GET",
      headers: forwardedHeaders,
      redirect: "manual",
    });

    let facebookRedirectUrl: string | null | undefined;

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      facebookRedirectUrl = response.headers.get("location") ?? undefined;
    } else if (
      response.ok &&
      response.headers.get("content-type")?.includes("application/json")
    ) {
      const data = (await response.json()) as { redirectUrl?: string };
      if (data.redirectUrl) facebookRedirectUrl = data.redirectUrl;
    }

    if (!facebookRedirectUrl) {
      const body = await response.text();
      console.error("Facebook auth: no redirect url", response.status, body);
      return NextResponse.json(
        { message: "Failed to get Facebook redirect URL" },
        { status: 500 },
      );
    }

    const myProxyCallbackUrl = `${getPublicOrigin(request)}/auth/facebook/callback`;

    try {
      const url = new URL(facebookRedirectUrl);
      if (url.searchParams.has("redirect_uri")) {
        url.searchParams.set("redirect_uri", myProxyCallbackUrl);
        facebookRedirectUrl = url.toString();
      }
    } catch {
      facebookRedirectUrl = facebookRedirectUrl.replace(
        encodeURIComponent(ORIGINAL_CALLBACK_URL),
        encodeURIComponent(myProxyCallbackUrl),
      );
    }

    return NextResponse.json({ redirectUrl: facebookRedirectUrl });
  } catch (e) {
    console.error("Facebook auth proxy error:", e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

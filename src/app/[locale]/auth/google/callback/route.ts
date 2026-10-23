import { type NextRequest, NextResponse } from "next/server";

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
  const proxyCallbackUrl = new URL("/api/auth/google/callback", getPublicOrigin(request));
  proxyCallbackUrl.search = new URL(request.url).search;

  return NextResponse.redirect(proxyCallbackUrl);
}

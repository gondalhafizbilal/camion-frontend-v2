import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOW_HOSTS = new Set([
  "assets.dev.camiontrading.com",
  "assets.camiontrading.com",
  "comio-artifacts.s3.us-east-1.amazonaws.com",
  "camion-woocommerce-media.s3.amazonaws.com",
  "camion-bkt.s3.us-east-1.amazonaws.com",
]);

function hostAllowed(hostname: string): boolean {
  if (ALLOW_HOSTS.has(hostname)) return true;
  // Allow any AWS S3 virtual-hosted style and path-style endpoints.
  if (hostname.endsWith(".s3.amazonaws.com")) return true;
  return false;
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return badRequest("Missing url");

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return badRequest("Invalid url");
  }

  if (target.protocol !== "https:") return badRequest("Only https URLs are allowed");
  if (!hostAllowed(target.hostname)) return badRequest("Host not allowed", 403);

  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("range", range);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch (err) {
    console.error("[api/media-proxy] fetch failed", target.toString(), err);
    return badRequest("Upstream request failed", 502);
  }

  const out = new NextResponse(upstream.body, { status: upstream.status });

  // Forward key headers for video playback (Range/206 support).
  const passthrough = [
    "content-type",
    "content-length",
    "accept-ranges",
    "content-range",
    "etag",
    "last-modified",
  ] as const;
  for (const h of passthrough) {
    const v = upstream.headers.get(h);
    if (v) out.headers.set(h, v);
  }
  out.headers.set("cache-control", "no-store");

  return out;
}


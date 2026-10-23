import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const AUTH_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const CART_BASE = (process.env.NEXT_PUBLIC_CART_BASE_URL ?? "").replace(/\/$/, "");

const FORWARD_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
] as const;

/** Cap upstream wait (Undici defaults can exceed 5m). Keeps browser/proxy connections from stalling the UI. */
const UPSTREAM_FETCH_TIMEOUT_MS = 45_000;

function upstreamFetchSignal(request: NextRequest): AbortSignal | undefined {
  try {
    if (typeof AbortSignal === "undefined" || typeof AbortSignal.timeout !== "function") {
      return request.signal;
    }
    const t = AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS);
    if (typeof AbortSignal.any === "function") {
      return request.signal
        ? AbortSignal.any([t, request.signal])
        : t;
    }
    return t;
  } catch {
    return request.signal;
  }
}

function upstreamBase(request: NextRequest): { url: string; error?: string } {
  const key = request.nextUrl.searchParams.get("base");
  if (key === "cart") {
    if (!CART_BASE) return { url: "", error: "Cart API base URL not configured" };
    return { url: CART_BASE };
  }
  if (!AUTH_BASE) return { url: "", error: "API base URL not configured" };
  return { url: AUTH_BASE };
}

function isValidPathSegments(segments: string[]): boolean {
  if (!segments.length) return false;
  return !segments.some(
    (s) => !s || s === ".." || s.includes("/") || s.includes("\\"),
  );
}

/** Client disconnect or our proxy abort signal — not an upstream outage (Undici uses `ResponseAborted`). */
function isAbortLikeError(err: unknown): boolean {
  let e: unknown = err;
  for (let d = 0; d < 8 && e; d += 1) {
    if (e instanceof Error) {
      const n = e.name;
      const m = e.message ?? "";
      if (n === "AbortError" || n === "ResponseAborted") return true;
      if (/ResponseAborted|aborted|AbortError/i.test(m)) return true;
    }
    e = (e as { cause?: unknown })?.cause;
  }
  return /ResponseAborted|AbortError|aborted/i.test(String(err));
}

function isTimeoutLikeError(err: unknown): boolean {
  let e: unknown = err;
  for (let d = 0; d < 8 && e; d += 1) {
    if (e instanceof Error) {
      const n = e.name;
      const m = e.message ?? "";
      if (n === "TimeoutError") return true;
      if (/timeout/i.test(m)) return true;
    }
    e = (e as { cause?: unknown })?.cause;
  }
  return false;
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (!isValidPathSegments(segments)) {
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  }

  const { url: base, error } = upstreamBase(request);
  if (!base) {
    return NextResponse.json(
      { message: error ?? "Misconfiguration" },
      { status: 500 },
    );
  }

  const pathPart = segments.map((s) => encodeURIComponent(s)).join("/");
  const fwd = new URLSearchParams(request.nextUrl.searchParams);
  fwd.delete("base");
  const q = fwd.toString();

  const targetUrl = `${base}/${pathPart}${q ? `?${q}` : ""}`;

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const v = request.headers.get(name);
    if (v) headers.set(name, v);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    signal: upstreamFetchSignal(request),
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    // Stream the body when possible. Buffering multipart with `arrayBuffer()` can break
    // some upstream parsers; Node fetch requires `duplex: "half"` when forwarding a stream.
    const streamBody = request.body;
    if (streamBody) {
      init.body = streamBody;
      (init as RequestInit & { duplex?: "half" }).duplex = "half";
    } else {
      const buf = await request.arrayBuffer();
      if (buf.byteLength) init.body = buf;
    }
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const out = new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
    });
    const ct = upstream.headers.get("content-type");
    if (ct) out.headers.set("content-type", ct);
    return out;
  } catch (err) {
    if (isAbortLikeError(err)) {
      /** 499: client closed / request superseded — expected in dev (Strict Mode, fast nav, stale fetch). */
      return new NextResponse(null, { status: 499 });
    }
    if (isTimeoutLikeError(err)) {
      console.warn("[api/upstream] timeout", request.method, targetUrl);
      return NextResponse.json({ message: "Upstream timeout" }, { status: 504 });
    }
    console.error("[api/upstream]", request.method, targetUrl, err);
    return NextResponse.json(
      { message: "Upstream request failed" },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

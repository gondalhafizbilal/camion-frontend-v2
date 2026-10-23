import { type NextRequest, NextResponse } from "next/server";
import { CHATBOT_UPSTREAM_BASE } from "@/services/chatbot/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    if (!sessionId) {
      return NextResponse.json({ message: "sessionId is required" }, { status: 400 });
    }

    const upstreamUrl = `${CHATBOT_UPSTREAM_BASE}/v1/chatbot/sessions/${encodeURIComponent(
      sessionId,
    )}/history`;

    /** Upstream: GET by session id only; no Bearer (matches API contract). */
    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await upstreamRes.text();

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { message: "Proxy error (history)", error: String(e) },
      { status: 500 },
    );
  }
}

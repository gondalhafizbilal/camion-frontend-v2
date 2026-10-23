import { type NextRequest, NextResponse } from "next/server";
import { CHATBOT_UPSTREAM_BASE } from "@/services/chatbot/upstream";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const body: unknown = await req.json();

    /** Upstream expects JSON body (e.g. `{ "token", "question" }`), not Bearer on this route. */
    const upstreamRes = await fetch(
      `${CHATBOT_UPSTREAM_BASE}/v1/chatbot/sessions/${encodeURIComponent(sessionId)}/ask`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const text = await upstreamRes.text();
    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message: "Proxy error", error: msg }, { status: 500 });
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { CHATBOT_UPSTREAM_BASE } from "@/services/chatbot/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const customerUUID =
      url.searchParams.get("customerUUID") || url.searchParams.get("userId");

    if (!customerUUID) {
      return NextResponse.json(
        { message: "customerUUID is required" },
        { status: 400 },
      );
    }

    const upstreamUrl = `${CHATBOT_UPSTREAM_BASE}/v1/chatbot/sessions?customerUUID=${encodeURIComponent(
      customerUUID,
    )}`;

    /** Upstream lists sessions by query only; no Bearer (see API GET `/v1/chatbot/sessions`). */
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
      { message: "Proxy error (list sessions)", error: String(e) },
      { status: 500 },
    );
  }
}

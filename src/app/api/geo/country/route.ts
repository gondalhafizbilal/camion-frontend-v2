import { NextResponse } from "next/server";
import { ipQueryLookupUrl, resolveClientIp } from "@/lib/geo/clientIp";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 8000;

type IpQueryPayload = {
  location?: {
    country_code?: string | null;
  } | null;
};

function normalizeCountryCode(value: unknown): string | null {
  const code = String(value ?? "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export async function GET(request: Request) {
  try {
    const clientIp = resolveClientIp(request);
    const res = await fetch(ipQueryLookupUrl(clientIp), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { countryCode: null },
        { status: 200, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const data = (await res.json().catch(() => null)) as IpQueryPayload | null;
    const countryCode = normalizeCountryCode(data?.location?.country_code);

    return NextResponse.json(
      { countryCode },
      {
        status: 200,
        headers: {
          "Cache-Control": countryCode
            ? "private, max-age=3600"
            : "private, no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { countryCode: null },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

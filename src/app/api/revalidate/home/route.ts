import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * On-demand catalog cache bust (deploy hooks / CMS publish).
 * `POST /api/revalidate/home?secret=...` with optional JSON `{ "locale": "en", "slug": "product-slug" }`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "REVALIDATE_SECRET not configured" }, { status: 503 });
  }

  const provided =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-revalidate-secret") ??
    "";
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let locale: string | null = null;
  let slug: string | null = null;
  try {
    const body = (await request.json()) as { locale?: string; slug?: string };
    locale = typeof body?.locale === "string" ? body.locale : null;
    slug = typeof body?.slug === "string" ? body.slug.trim() : null;
  } catch {
    /* no body */
  }

  revalidateTag("home");
  revalidateTag("home-graphql");
  revalidateTag("catalog-product");
  revalidateTag("shop-product");

  if (slug) {
    revalidateTag(`product-${slug}`);
    revalidatePath(`/en/shop/${slug}`);
    revalidatePath(`/ar/shop/${slug}`);
  }

  if (locale === "en" || locale === "ar") {
    revalidatePath(`/${locale}`);
  } else if (!slug) {
    revalidatePath("/en");
    revalidatePath("/ar");
  }

  return NextResponse.json({ ok: true, revalidated: true, locale, slug });
}

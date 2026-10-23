import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (
    pathname === "/robots" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap" ||
    pathname === "/sitemap.xml" ||
    pathname === "/firebase-config.js" ||
    pathname.startsWith("/.well-known") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

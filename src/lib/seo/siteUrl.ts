/** Absolute site origin without trailing slash. */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Locale path segment: `/en/shop` or `/ar` (empty path → `/{locale}`). */
export function localePath(locale: string, path = ""): string {
  const normalized = path.replace(/^\/+|\/+$/g, "");
  return normalized ? `/${locale}/${normalized}` : `/${locale}`;
}

export function absoluteLocaleUrl(locale: string, path = ""): string {
  return `${getSiteUrl()}${localePath(locale, path)}`;
}

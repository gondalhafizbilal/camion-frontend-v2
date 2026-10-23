/** Fallback when CMS does not send `color` or value is not a safe CSS color. */
export const DEFAULT_BANNER_TEXT_COLOR = "#CB262E";

/**
 * Maps API `color` to a safe CSS `color` value (hex, optional `#`, or rgb/rgba).
 * Unknown values fall back to {@link DEFAULT_BANNER_TEXT_COLOR}.
 */
export function normalizeBannerTextColor(
  color: string | null | undefined,
  fallback: string = DEFAULT_BANNER_TEXT_COLOR,
): string {
  const c = color?.trim();
  if (!c) return fallback;
  if (/^#[0-9A-Fa-f]{3}$/i.test(c)) return c;
  if (/^#[0-9A-Fa-f]{6}$/i.test(c)) return c;
  if (/^#[0-9A-Fa-f]{8}$/i.test(c)) return c;
  if (/^[0-9A-Fa-f]{6}$/i.test(c)) return `#${c}`;
  if (/^[0-9A-Fa-f]{3}$/i.test(c)) return `#${c}`;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*[\d.]+\s*)?\)$/i.test(c)) {
    return c;
  }
  return fallback;
}

/** Normalize API `placement` for comparisons (e.g. `"hot deals"` → `"hot_deals"`). */
export function normalizePlacement(p: string | null | undefined): string {
  return String(p ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * CMS may return a real URL, a path, or a plain label (e.g. `"New Products"`).
 * Only `http(s)://…` and rooted paths are used as-is; otherwise `/shop`.
 */
export function normalizeBannerHref(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "/shop";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return "/shop";
}

export function isHeroPlacement(p: string | null | undefined): boolean {
  const n = normalizePlacement(p);
  return (
    n === "hero" ||
    n === "homepage" ||
    n === "home_hero" ||
    n === "home" ||
    n === "main_banner"
  );
}

export function isHotDealsPlacement(p: string | null | undefined): boolean {
  const n = normalizePlacement(p);
  return n === "hot_deals" || n === "hotdeals" || n === "hotdeals_web";
}

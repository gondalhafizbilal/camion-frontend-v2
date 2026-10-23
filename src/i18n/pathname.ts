import { routing } from "./routing";

/**
 * next-intl `usePathname()` should omit the locale prefix; when it does not (e.g. `/en` on home),
 * passing that value to `router.replace` stacks `/en/en/...` on each language toggle.
 */
export function stripLocaleFromPathname(pathname: string | null | undefined): string {
  let p = String(pathname ?? "").trim();
  if (!p || p === ".") return "/";
  if (!p.startsWith("/")) {
    if (routing.locales.includes(p as (typeof routing.locales)[number])) {
      return "/";
    }
    p = `/${p}`;
  }

  for (const loc of routing.locales) {
    if (p === `/${loc}`) return "/";
    const prefix = `/${loc}/`;
    if (p.startsWith(prefix)) {
      const rest = p.slice(prefix.length);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
  }

  return p;
}

/** Pathname + current URL search for locale switches (keeps `?collection=` etc.). */
export function pathnameWithCurrentSearch(
  pathname: string | null | undefined,
): string {
  const base = stripLocaleFromPathname(pathname);
  if (typeof window === "undefined") return base;
  const search = window.location.search;
  return search ? `${base}${search}` : base;
}

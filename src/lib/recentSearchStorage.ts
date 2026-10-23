const STORAGE_KEY_PREFIX = "camion_header_recent_searches_v1";
const MAX_RECENT = 5;

function storageKey(locale: string): string {
  return `${STORAGE_KEY_PREFIX}_${locale}`;
}

export function readRecentSearches(locale: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(locale));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecentSearch(locale: string, raw: string): string[] {
  const term = raw.trim();
  if (!term || typeof window === "undefined") return readRecentSearches(locale);

  const key = storageKey(locale);
  let list = readRecentSearches(locale);
  list = list.filter((x) => x.toLowerCase() !== term.toLowerCase());
  list.unshift(term);
  list = list.slice(0, MAX_RECENT);

  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore quota / private mode */
  }
  return list;
}

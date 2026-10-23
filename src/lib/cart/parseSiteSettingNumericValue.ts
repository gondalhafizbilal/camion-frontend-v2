import type { GqlSiteSettingValue } from "@/services/graphql/types/settings";

/** Resolves a numeric amount from a site-settings row (no hardcoded fallback). */
export function parseSiteSettingNumericValue(
  row: GqlSiteSettingValue | null | undefined,
): number | null {
  if (!row) return null;

  const type = String(row.type ?? "").trim().toLowerCase();

  if (type === "integer") {
    const n = Number(row.integerValue);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  if (type === "decimal") {
    const n = Number(row.decimalValue);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  if (type === "string") {
    const n = Number(row.stringValue);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  if (row.integerValue != null) {
    const n = Number(row.integerValue);
    if (Number.isFinite(n) && n >= 0) return n;
  }

  if (row.decimalValue != null) {
    const n = Number(row.decimalValue);
    if (Number.isFinite(n) && n >= 0) return n;
  }

  const fromString = Number(row.stringValue);
  if (Number.isFinite(fromString) && fromString >= 0) return fromString;

  return null;
}

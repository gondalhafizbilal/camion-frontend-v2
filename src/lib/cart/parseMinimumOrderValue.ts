import type { GqlMinimumOrderValue } from "@/services/graphql/types/settings";
import { parseSiteSettingNumericValue } from "@/lib/cart/parseSiteSettingNumericValue";

/** Resolves minimum order amount from `getMinimumOrderValue` (no hardcoded fallback). */
export function parseMinimumOrderValue(
  row: GqlMinimumOrderValue | null | undefined,
): number | null {
  return parseSiteSettingNumericValue(row);
}

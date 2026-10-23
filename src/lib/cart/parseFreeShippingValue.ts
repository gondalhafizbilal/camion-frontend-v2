import type { GqlFreeShippingValue } from "@/services/graphql/types/settings";
import { parseSiteSettingNumericValue } from "@/lib/cart/parseSiteSettingNumericValue";

/** Resolves free-shipping threshold from `getFreeShippingValue` (no hardcoded fallback). */
export function parseFreeShippingValue(
  row: GqlFreeShippingValue | null | undefined,
): number | null {
  return parseSiteSettingNumericValue(row);
}

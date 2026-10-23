import type { GqlOrderVariant } from "@/services/graphql/types/order";

export type OrderLineVariationRow = {
  attribute: string;
  value: string;
};

/**
 * All selected variant options for an order line (`variant.optionValues` from GraphQL).
 */
export function parseOrderLineVariations(
  variant: GqlOrderVariant | null | undefined,
  optionFallback: string,
): OrderLineVariationRow[] {
  const rows = variant?.optionValues ?? [];
  const parsed = rows
    .map((r) => r?.optionValue)
    .filter((ov): ov is NonNullable<typeof ov> => {
      if (!ov) return false;
      const value = String(ov.value ?? "").trim();
      const name = String(ov.option?.name ?? "").trim();
      return Boolean(value || name);
    });

  parsed.sort((a, b) => {
    const ao = Number(a.option?.position ?? 0);
    const bo = Number(b.option?.position ?? 0);
    if (ao !== bo) return ao - bo;
    return Number(a.position ?? 0) - Number(b.position ?? 0);
  });

  const variations = parsed
    .map((ov) => {
      const value = String(ov.value ?? "").trim();
      const attribute = String(ov.option?.name ?? "").trim() || optionFallback;
      if (!value && !attribute) return null;
      return {
        attribute,
        value: value || "—",
      };
    })
    .filter((row): row is OrderLineVariationRow => row != null);

  return variations;
}

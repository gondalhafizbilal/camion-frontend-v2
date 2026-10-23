/** GraphQL Money-shaped value (`amount` + optional `minorAmount` + `currencyCode`). */
export type GqlMoneyLike = {
  amount?: number | string | null;
  minorAmount?: number | string | null;
  currencyCode?: string | null;
};

/**
 * Converts API money to a decimal number.
 * Example: `{ amount: 20, minorAmount: 25 }` → `20.25`
 */
export function gqlMoneyToNumber(
  m: GqlMoneyLike | null | undefined,
): number | null {
  if (m == null || typeof m !== "object") return null;
  const major = Number(m.amount);
  if (!Number.isFinite(major)) return null;

  if (m.minorAmount == null || m.minorAmount === "") {
    return major;
  }
  const minor = Number(m.minorAmount);
  if (!Number.isFinite(minor) || minor < 0) return major;

  return major + minor / 100;
}

/** Same as {@link gqlMoneyToNumber}, but returns `0` when missing/invalid. */
export function gqlMoneyToNumberOrZero(
  m: GqlMoneyLike | null | undefined,
): number {
  return gqlMoneyToNumber(m) ?? 0;
}

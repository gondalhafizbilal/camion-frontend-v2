import type { GqlCurrentAffiliate } from "@/services/graphql";

export type PartnerProgram = "affiliate" | "influencer";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * Partner program: prefers `role` from the verify (session) cookie, then `getCurrentAffiliate.type`.
 * GraphQL partner fields are scoped by the backend to the authenticated program.
 */
export function resolvePartnerProgram(
  roleFromVerifySession: string | null | undefined,
  partner: GqlCurrentAffiliate | null | undefined,
): PartnerProgram | null {
  const role = norm(roleFromVerifySession);
  if (role === "affiliate" || role === "influencer") return role;
  const t = norm(partner?.type);
  if (t === "affiliate" || t === "influencer") return t;
  return null;
}

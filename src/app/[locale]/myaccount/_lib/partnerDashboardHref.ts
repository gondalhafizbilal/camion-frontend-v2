export type PartnerProgram = "affiliate" | "influencer" | null;

export function partnerDashboardHref(program: PartnerProgram): string {
  if (program === "influencer") return "/myaccount/influencer-dashboard";
  if (program === "affiliate") return "/myaccount/affiliate-dashboard";
  return "/myaccount";
}


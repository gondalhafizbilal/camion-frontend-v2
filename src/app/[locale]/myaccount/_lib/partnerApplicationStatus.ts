/**
 * Partner / affiliate application status from the API (`getCurrentAffiliate.status`, request-status endpoints).
 * Legacy `approved` is treated as `accepted`.
 */
export function normalizePartnerApplicationStatus(value: unknown): string {
  const s = String(value ?? "").trim().toLowerCase();
  if (s === "pending" || s === "accepted" || s === "rejected") return s;
  if (s === "approved") return "accepted";
  if (s === "declined" || s === "denied") return "rejected";
  return s;
}

export function isPartnerApplicationAccepted(value: unknown): boolean {
  return normalizePartnerApplicationStatus(value) === "accepted";
}

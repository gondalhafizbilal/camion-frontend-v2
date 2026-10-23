export type CustomerSelfFields = {
  fullName: string;
  email: string;
  phone: string;
};

/** Normalizes `GET/PUT v1/auth/customer/self` JSON (flat or `{ customer: ... }`). */
export function parseCustomerSelfJson(data: unknown): CustomerSelfFields {
  const d =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested =
    d.customer && typeof d.customer === "object"
      ? (d.customer as Record<string, unknown>)
      : null;
  const src = nested ?? d;
  return {
    fullName: String(src.fullName ?? "").trim(),
    email: String(src.emailAddress ?? src.email ?? "").trim(),
    phone: String(src.phoneNumber ?? src.phone ?? "").trim(),
  };
}

import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import type { CouponLike } from "./gqlAffiliateCouponToPartnerRow";

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : null;
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const o = asRecord(raw);
  if (!o) return [];
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.coupons)) return o.coupons;
  const data = asRecord(o.data);
  if (data && Array.isArray(data.coupons)) return data.coupons;
  return [];
}

function normalizeItem(raw: unknown): CouponLike | null {
  const o = asRecord(raw);
  if (!o) return null;
  const uuid = String(o.uuid ?? o.id ?? "").trim();
  if (!uuid) return null;
  return {
    uuid,
    code: (o.code as string | null | undefined) ?? null,
    discountPercentage:
      typeof o.discountPercentage === "number"
        ? o.discountPercentage
        : o.discountPercentage != null
          ? Number(o.discountPercentage)
          : null,
    ordersCount:
      typeof o.ordersCount === "number"
        ? o.ordersCount
        : o.ordersCount != null
          ? Number(o.ordersCount)
          : typeof o.orders_count === "number"
            ? o.orders_count
            : o.orders_count != null
              ? Number(o.orders_count)
              : null,
    expiresAt: (o.expiresAt ?? o.expiryDate ?? o.expires_at ?? null) as string | null,
    createdAt: (o.createdAt ?? o.created_at ?? null) as string | null,
  };
}

/** GET `v1/referral/coupons` — tolerates several JSON envelope shapes. */
export async function fetchReferralCouponsList(
  authToken: string,
): Promise<CouponLike[]> {
  const res = await apiFetch(API_ENDPOINTS.REFERRAL_COUPONS, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const arr = extractArray(body);
  const out: CouponLike[] = [];
  for (const item of arr) {
    const row = normalizeItem(item);
    if (row) out.push(row);
  }
  return out;
}

import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import type { PartnerCouponStatsRow, RawCoupon } from "../_types/partnerCoupon";

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
}

function unwrapDetail(raw: unknown): RawCoupon | null {
  const o = asRecord(raw);
  if (!o) return null;
  const data = o.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as RawCoupon;
  }
  return o as RawCoupon;
}

function toStatsRow(c: RawCoupon): PartnerCouponStatsRow {
  const ordersRaw = c.orders;
  const orders = Array.isArray(ordersRaw)
    ? ordersRaw
    : Array.isArray((c as { order?: unknown[] }).order)
      ? ((c as { order: unknown[] }).order)
      : [];

  return {
    id: (c.uuid ?? c.id ?? c._id) as string | number | undefined,
    code: String(c.code ?? c.coupon ?? c.coupon_code ?? "—"),
    status: String(c.status ?? "active"),
    discount: c.discount
      ? String(c.discount)
      : c.amount
        ? String(c.amount)
        : "0",
    discountPercentage: (c.discountPercentage ?? c.discount ?? 0) as
      | string
      | number,
    commissionPercentage:
      c.commissionPercentage !== undefined || c.commission !== undefined
        ? ((c.commissionPercentage ?? c.commission ?? 0) as string | number)
        : undefined,
    createdAt: (c.createdAt ?? c.created_at ?? null) as string | null,
    expiryDate: (c.expiryDate ?? c.expiresAt ?? null) as string | null,
    isActive: (c.isActive ?? c.active ?? true) as boolean,
    usage: Number(
      c.usage_count ?? c.used_count ?? c.count ?? c.ordersCount ?? 0,
    ),
    orders,
  };
}

/** GET `v1/referral/coupons/{uuid}` for statistics / detail UI. */
export async function fetchReferralCouponDetail(
  authToken: string,
  uuid: string,
): Promise<PartnerCouponStatsRow | null> {
  const id = String(uuid ?? "").trim();
  if (!id) return null;

  const res = await apiFetch(API_ENDPOINTS.REFERRAL_COUPON_BY_ID(id), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  const row = unwrapDetail(body);
  if (!row) return null;
  return toStatsRow(row);
}

import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import type { CreateOrderResponse } from "@/services/orders/createOrder";

export async function fetchOrderById(
  authToken: string,
  orderId: string,
): Promise<CreateOrderResponse | null> {
  const id = String(orderId || "").trim();
  if (!id) return null;

  const base = String(API_ENDPOINTS.ORDERS_CREATE || "").replace(/\/$/, "");
  const url = `${base}/${encodeURIComponent(id)}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
    },
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok || !raw || typeof raw !== "object") return null;
  return raw as CreateOrderResponse;
}


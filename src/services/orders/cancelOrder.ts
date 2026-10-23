import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { extractResponseErrorMessage } from "@/services/api/parseApiErrorResponse";

export type CancelOrderResponse = {
  uuid?: string;
  status?: string;
  [key: string]: unknown;
};

export async function cancelOrder(
  authToken: string,
  orderUuid: string,
): Promise<CancelOrderResponse> {
  const uuid = String(orderUuid || "").trim();
  if (!uuid) throw new Error("Missing orderUuid");

  const res = await apiFetch(API_ENDPOINTS.ORDER_BY_UUID(uuid), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
    },
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      extractResponseErrorMessage(raw) ||
      `Order cancellation failed (${res.status})`;
    throw new Error(msg);
  }

  if (!raw || typeof raw !== "object") {
    return { uuid };
  }

  return raw as CancelOrderResponse;
}

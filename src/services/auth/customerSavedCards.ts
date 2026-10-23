import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";

export type UpdateSavedCardPayload = {
  uuid: string;
  tokenId: string;
  cardBrand?: string | null;
  last4?: string | number | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
};

async function parseJsonSafe(res: Response): Promise<unknown> {
  const txt = await res.text();
  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    return txt;
  }
}

export async function setCustomerSavedCardAsDefault(
  cardUuid: string,
  payload: UpdateSavedCardPayload,
  authToken: string,
) {
  const res = await apiFetch(API_ENDPOINTS.CUSTOMER_SAVED_CARD_DEFAULT(cardUuid), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const msg = (data && (data as any).message) || "Failed to update saved card";
    throw new Error(String(msg));
  }
  return data;
}

export async function deleteCustomerSavedCard(cardUuid: string, authToken: string) {
  const res = await apiFetch(API_ENDPOINTS.CUSTOMER_SAVED_CARD_BY_UUID(cardUuid), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const msg = (data && (data as any).message) || "Failed to delete saved card";
    throw new Error(String(msg));
  }
  return data;
}

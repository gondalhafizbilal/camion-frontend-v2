import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";

export type ReturnReason =
  | "wrong_variation"
  | "damaged_broken"
  | "wrong_product";

export type CreateReturnRequestBody = {
  orderUuid: string;
  orderItemUuid?: string;
  reason: ReturnReason;
  reasonDetail?: string;
};

export type ReturnRequestResponse = {
  uuid: string;
  reason: ReturnReason;
  reasonDetail: string | null;
  status: "pending" | "approved" | "rejected" | "refunded";
  refundAmount?: { amount?: number; minorAmount?: number; currencyCode?: string } | null;
  evidence?: unknown[];
  createdAt?: string;
  [key: string]: unknown;
};

export type ApiValidationError = Error & {
  status?: number;
  fieldErrors?: Record<string, string>;
};

export async function createReturnRequest(
  authToken: string,
  body: CreateReturnRequestBody,
): Promise<ReturnRequestResponse> {
  const orderUuid = String(body?.orderUuid || "").trim();
  if (!orderUuid) throw new Error("Missing orderUuid");

  const res = await apiFetch(API_ENDPOINTS.RETURN_REQUESTS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderUuid,
      orderItemUuid: body.orderItemUuid ? String(body.orderItemUuid) : undefined,
      reason: body.reason,
      reasonDetail: body.reasonDetail ?? "",
    }),
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      raw && typeof raw === "object" && "message" in raw
        ? String((raw as { message?: unknown }).message || "")
        : "";
    const fieldErrorsRaw =
      raw && typeof raw === "object" && "errors" in raw
        ? (raw as { errors?: unknown }).errors
        : null;
    const fieldErrors =
      fieldErrorsRaw && typeof fieldErrorsRaw === "object" && !Array.isArray(fieldErrorsRaw)
        ? Object.fromEntries(
            Object.entries(fieldErrorsRaw as Record<string, unknown>).map(([k, v]) => [
              k,
              String(v ?? ""),
            ]),
          )
        : undefined;

    const err: ApiValidationError = new Error(
      msg || (fieldErrors && Object.values(fieldErrors).filter(Boolean)[0]) || `Return request failed (${res.status})`,
    );
    err.status = res.status;
    if (fieldErrors) err.fieldErrors = fieldErrors;
    throw err;
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid return request response");
  }

  return raw as ReturnRequestResponse;
}


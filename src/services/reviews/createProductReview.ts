import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";

export type CreateProductReviewBody = {
  productUuid: string;
  rating: number;
  comment: string;
};

export type ProductReviewResponse = {
  uuid: string;
  rating?: string | number;
  comment?: string | null;
  isEdited?: boolean;
  [key: string]: unknown;
};

export type ApiValidationError = Error & {
  status?: number;
  fieldErrors?: Record<string, string>;
};

function readApiMessage(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  if ("message" in raw) return String((raw as { message?: unknown }).message || "");
  return "";
}

function readFieldErrors(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || !("errors" in raw)) return undefined;
  const errors = (raw as { errors?: unknown }).errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return undefined;
  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>).map(([key, value]) => [
      key,
      String(value ?? ""),
    ]),
  );
}

export async function createProductReview(
  authToken: string,
  body: CreateProductReviewBody,
): Promise<ProductReviewResponse> {
  const productUuid = String(body?.productUuid || "").trim();
  const comment = String(body?.comment || "").trim();
  const rating = Number(body?.rating);

  if (!productUuid) throw new Error("Missing productUuid");
  if (!Number.isFinite(rating) || rating <= 0) throw new Error("Invalid rating");
  if (!comment) throw new Error("Missing comment");

  const res = await apiFetch(API_ENDPOINTS.PRODUCT_REVIEWS(productUuid), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rating, comment }),
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const fieldErrors = readFieldErrors(raw);
    const err: ApiValidationError = new Error(
      readApiMessage(raw) ||
        (fieldErrors && Object.values(fieldErrors).filter(Boolean)[0]) ||
        `Review submit failed (${res.status})`,
    );
    err.status = res.status;
    if (fieldErrors) err.fieldErrors = fieldErrors;
    throw err;
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid review response");
  }

  return raw as ProductReviewResponse;
}

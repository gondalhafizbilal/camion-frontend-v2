import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";

/**
 * Returned when the API rejects the call with 401/403 or a generic “forbidden” payload
 * (e.g. guest JWT). UI should map this to a translated, user-facing string.
 */
export const WISHLIST_ERROR_ACCOUNT_REQUIRED = "__WISHLIST_ACCOUNT_REQUIRED__";

function isWishlistAuthForbidden(status: number, message: string): boolean {
  if (status === 401 || status === 403) return true;
  const m = message.toLowerCase();
  return (
    m.includes("forbidden") ||
    m.includes("unauthorized") ||
    m.includes("access denied")
  );
}

function firstApiErrorMessage(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  const msg = data.message ?? data.error;
  if (typeof msg === "string" && msg.trim()) return msg;
  const errors = data.errors;
  if (errors && typeof errors === "object") {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v) && v[0] != null) return String(v[0]);
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

/** Catalog product UUID for `POST /v1/wishlist` (not variant id when both exist). */
export function resolveProductUuidForWishlist(
  product: CarouselProduct,
): string | null {
  const p = product as unknown as Record<string, unknown>;
  const fromField =
    typeof product.productUuid === "string" ? product.productUuid.trim() : "";
  if (fromField) return fromField;
  const fromAltField =
    typeof p.productUUID === "string" ? String(p.productUUID).trim() : "";
  if (fromAltField) return fromAltField;
  const fromUuid = typeof p.uuid === "string" ? String(p.uuid).trim() : "";
  if (fromUuid) return fromUuid;
  const id = product.id;
  if (id != null && String(id).trim()) return String(id).trim();
  return null;
}

/** Resolves both identifiers for `POST /v1/wishlist` (API expects `productUUID` and `variantUUID`). */
export function resolveWishlistIdentifiers(
  product: CarouselProduct,
): { productUUID: string; variantUUID: string } | null {
  const productUUID = resolveProductUuidForWishlist(product);
  if (!productUUID) return null;
  // In our GraphQL→carousel mapping, `id` is the variant UUID (falls back to product UUID).
  const variantUUID =
    typeof (product as unknown as { variantUuid?: unknown }).variantUuid === "string"
      ? String((product as unknown as { variantUuid?: string }).variantUuid).trim()
      : product.id != null
        ? String(product.id).trim()
        : "";
  if (!variantUUID) return null;
  return { productUUID, variantUUID };
}

export type AddToWishlistRequestResult =
  | { ok: true }
  | { ok: false; message: string };

export async function addProductToWishlistRequest(
  product: CarouselProduct,
  authToken: string,
): Promise<AddToWishlistRequestResult> {
  const ids = resolveWishlistIdentifiers(product);
  if (!ids) return { ok: false, message: "Missing product or variant id." };
  const res = await apiFetch(API_ENDPOINTS.WISHLIST, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(ids),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const raw =
      firstApiErrorMessage(data) || `Could not update wishlist (${res.status}).`;
    return {
      ok: false,
      message: isWishlistAuthForbidden(res.status, raw)
        ? WISHLIST_ERROR_ACCOUNT_REQUIRED
        : raw,
    };
  }
  return { ok: true };
}

export type RemoveFromWishlistRequestResult =
  | { ok: true }
  | { ok: false; message: string };

export async function removeProductFromWishlistRequest(
  wishlistEntryUuid: string,
  authToken: string,
): Promise<RemoveFromWishlistRequestResult> {
  const id = String(wishlistEntryUuid ?? "").trim().replace(/^\/+/, "");
  if (!id) {
    return { ok: false, message: "Missing wishlist item id." };
  }

  const res = await apiFetch(API_ENDPOINTS.WISHLIST_ITEM_BY_UUID(id), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
    },
  });

  if (res.ok) {
    return { ok: true };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const raw =
    firstApiErrorMessage(data) || `Could not remove from wishlist (${res.status}).`;
  return {
    ok: false,
    message: isWishlistAuthForbidden(res.status, raw)
      ? WISHLIST_ERROR_ACCOUNT_REQUIRED
      : raw,
  };
}

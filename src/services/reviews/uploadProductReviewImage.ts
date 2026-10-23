import { getTransformedImageUrl } from "@/lib/images/getTransformedImageUrl";
import { API_ENDPOINTS } from "@/services/api/api";
import { formatUploadErrorResponse } from "@/services/api/formatUploadErrorResponse";
import { apiFetch } from "@/services/api/apiClient";

export type ProductReviewImageResponse = {
  uuid: string;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  [key: string]: unknown;
};

export async function uploadProductReviewImage(
  authToken: string,
  productUuid: string,
  reviewUuid: string,
  file: File,
): Promise<ProductReviewImageResponse> {
  const safeProductUuid = String(productUuid || "").trim();
  const safeReviewUuid = String(reviewUuid || "").trim();
  if (!safeProductUuid) throw new Error("Missing productUuid");
  if (!safeReviewUuid) throw new Error("Missing reviewUuid");
  if (!file) throw new Error("Missing file");

  const form = new FormData();
  const safeName = String(file.name || "review-image").trim() || "review-image";
  form.append("file", file, safeName);

  const res = await apiFetch(
    API_ENDPOINTS.PRODUCT_REVIEW_IMAGES(safeProductUuid, safeReviewUuid),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
        // Browser must set multipart boundary.
      },
      body: form,
      timeoutMs: 120_000,
    },
  );

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(
      formatUploadErrorResponse(raw, res.status, "Review image upload failed"),
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid review image response");
  }

  const obj = raw as ProductReviewImageResponse;
  const assetsHost =
    process.env.NEXT_PUBLIC_ASSETS_HOST || "https://assets.camiontrading.com";

  const thumb = obj.thumbnailUrl
    ? getTransformedImageUrl(String(obj.thumbnailUrl), assetsHost) || String(obj.thumbnailUrl)
    : obj.thumbnailUrl;
  const img = obj.imageUrl
    ? getTransformedImageUrl(String(obj.imageUrl), assetsHost) || String(obj.imageUrl)
    : obj.imageUrl;

  return { ...obj, thumbnailUrl: thumb, imageUrl: img };
}

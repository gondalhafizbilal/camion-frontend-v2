import { API_ENDPOINTS } from "@/services/api/api";
import { formatUploadErrorResponse } from "@/services/api/formatUploadErrorResponse";
import { apiFetch } from "@/services/api/apiClient";
import { getTransformedImageUrl } from "@/lib/images/getTransformedImageUrl";

export type ReturnRequestEvidenceResponse = {
  uuid: string;
  url: string;
  mimeType: string;
  createdAt: string;
  [key: string]: unknown;
};

function evidenceFormFieldName(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? String(process.env.NEXT_PUBLIC_RETURN_EVIDENCE_FORM_FIELD || "").trim()
      : "";
  return fromEnv || "file";
}

export async function uploadReturnRequestEvidence(
  authToken: string,
  returnRequestUuid: string,
  file: File,
): Promise<ReturnRequestEvidenceResponse> {
  const uuid = String(returnRequestUuid || "").trim();
  if (!uuid) throw new Error("Missing returnRequestUuid");
  if (!file) throw new Error("Missing file");

  const form = new FormData();
  // Third argument sets multipart filename (server `originalname`); some parsers rely on it.
  const safeName = String(file.name || "evidence").trim() || "evidence";
  const field = evidenceFormFieldName();
  form.append(field, file, safeName);

  const res = await apiFetch(API_ENDPOINTS.RETURN_REQUEST_EVIDENCE(uuid), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
      // Don't set Content-Type for multipart; browser will set boundary.
    },
    body: form,
    /** Evidence can be large; avoid default 20s timeout killing uploads. */
    timeoutMs: 120_000,
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(
      formatUploadErrorResponse(raw, res.status, "Evidence upload failed"),
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid evidence upload response");
  }

  const obj = raw as ReturnRequestEvidenceResponse;
  const assetsHost =
    process.env.NEXT_PUBLIC_ASSETS_HOST || "https://assets.camiontrading.com";
  const transformed = obj.url ? getTransformedImageUrl(String(obj.url), assetsHost) : "";
  if (transformed) {
    return { ...obj, url: transformed };
  }
  return obj;
}

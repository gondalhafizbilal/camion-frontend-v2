/**
 * Builds a readable message from common API error JSON shapes (Nest, etc.).
 * Used by multipart upload helpers (reviews, return evidence).
 */
export function formatUploadErrorResponse(
  raw: unknown,
  status: number,
  fallback: string,
): string {
  if (!raw || typeof raw !== "object") {
    return `${fallback} (${status})`;
  }
  const o = raw as Record<string, unknown>;
  const details = typeof o.details === "string" ? o.details.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";
  const error = typeof o.error === "string" ? o.error.trim() : "";
  const combined = [details, message, error].filter(Boolean).join(" — ");
  return combined || `${fallback} (${status})`;
}

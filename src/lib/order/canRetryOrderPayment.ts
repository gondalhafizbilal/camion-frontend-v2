/**
 * Statuses where POST /v1/orders/{uuid}/retry-payment is allowed.
 * Must match backend: payment_pending | payment_failed | payment_cancelled only.
 * Not allowed: payment_rejected, payment_expired, payment_successful, etc.
 */
const RETRYABLE_PAYMENT_STATUSES = new Set([
  "payment_pending",
  "payment_failed",
  "payment_cancelled",
  "payment_canceled",
]);

export function normalizeOrderStatusToken(
  statusRaw: string | undefined | null,
): string {
  return String(statusRaw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s—–-]+/g, "_")
    .replace(/_+/g, "_");
}

export function canRetryOrderPayment(
  statusRaw: string | undefined | null,
): boolean {
  const token = normalizeOrderStatusToken(statusRaw);
  return RETRYABLE_PAYMENT_STATUSES.has(token);
}

import { pushGtmEvent } from "./gtmDataLayer";

export type AuthCheckoutGtmEvent =
  | "login_required"
  | "otp_requested"
  | "otp_verified"
  | "otp_failed"
  | "address_started"
  | "address_completed"
  | "add_shipping_info"
  | "payment_method_selected"
  | "add_payment_info";

export type AuthCheckoutGtmParams = {
  source?: string;
  method?: string;
  address_id?: string;
  shipping_method?: string;
  shipping_cost?: number;
  payment_method?: string;
  cart_value?: number;
  currency?: string;
  coupon?: string;
  error_code?: string;
  error_stage?: string;
};

const STRING_PARAM_KEYS = [
  "source",
  "method",
  "address_id",
  "shipping_method",
  "payment_method",
  "currency",
  "coupon",
  "error_code",
  "error_stage",
] as const;

/** Pushes only the allowlisted, non-PII auth/checkout fields. */
export function pushAuthCheckoutGtmEvent(
  event: AuthCheckoutGtmEvent,
  params: AuthCheckoutGtmParams = {},
): void {
  const safeParams: Record<string, unknown> = {};
  for (const key of STRING_PARAM_KEYS) {
    const value = params[key]?.trim();
    if (value) safeParams[key] = value;
  }
  if (Number.isFinite(params.shipping_cost)) {
    safeParams.shipping_cost = params.shipping_cost;
  }
  if (Number.isFinite(params.cart_value)) {
    safeParams.cart_value = params.cart_value;
  }
  pushGtmEvent(event, safeParams);
}

function safeMachineCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim();
  if (!code || code.length > 64 || !/^[A-Za-z0-9_.:-]+$/.test(code)) return undefined;
  return code;
}

/** Returns a bounded machine-safe API code and never falls back to response messages. */
export function getSafeGtmErrorCode(
  data: unknown,
  status?: number,
  fallback = "verification_failed",
): string {
  const record =
    data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
  const nestedError =
    record?.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : undefined;
  const apiCode = safeMachineCode(record?.code) ?? safeMachineCode(nestedError?.code);
  if (apiCode) return apiCode;
  if (Number.isInteger(status) && Number(status) > 0) return `http_${status}`;
  return fallback;
}

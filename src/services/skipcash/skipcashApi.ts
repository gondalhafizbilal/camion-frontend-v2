import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { extractResponseErrorMessage } from "@/services/api/parseApiErrorResponse";
import { createOrder, type CreateOrderResponse } from "@/services/orders/createOrder";

export type SkipCashPaymentStatus = "paid" | "failed" | "cancelled" | "rejected";

export type CreateSkipCashTokenizationSessionResult = {
  orderUuid: string | null;
  tokenId: string | null;
  paymentId: string | null;
  error: string | null;
};

/**
 * Some pages may mount SkipCash immediately after route changes.
 * This helper prevents UI code from racing the SDK script download.
 */
export async function waitForSkipCashSdk({
  timeoutMs = 20_000,
  pollMs = 100,
}: {
  timeoutMs?: number;
  pollMs?: number;
} = {}): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("waitForSkipCashSdk must run in the browser.");
  }

  const existing = window.SkipCash;
  if (existing) return existing;

  // Fallback loader: if layout script hasn't loaded yet, inject it now.
  const src = "https://sdk.skipcash.com/checkout/skipcash-embed.js";
  const already = document.querySelector(`script[src="${src}"]`);
  if (!already) {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }

  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const sdk = window.SkipCash;
    if (sdk) return sdk;

    if (Date.now() - started > timeoutMs) {
      throw new Error("SkipCash SDK did not load in time.");
    }

    await new Promise((r) => setTimeout(r, pollMs));
  }
}

function normalizeToString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

/**
 * Best-effort deep-search for a string value by keys.
 * (Backend response shapes can evolve; this keeps UI code resilient.)
 */
function extractStringByKeysDeep(input: unknown, keys: string[]): string | null {
  if (!input || typeof input !== "object") return null;
  const root = input as Record<string, unknown>;

  const seen = new Set<unknown>();
  const stack: unknown[] = [root];

  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
      if (keys.includes(k)) {
        const s = normalizeToString(v);
        if (s) return s;
      }

      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

function extractTokenIdFromOrder(order: CreateOrderResponse): string | null {
  // Fast path for likely locations.
  const topTokenId = normalizeToString((order as any)?.tokenId);
  if (topTokenId) return topTokenId;

  const pt = (order as any)?.paymentTransaction;
  const fast =
    normalizeToString(pt?.tokenId) ??
    normalizeToString(pt?.token_id) ??
    normalizeToString(pt?.tokenid);
  if (fast) return fast;

  return extractStringByKeysDeep(order as unknown, [
    "tokenId",
    "token_id",
    "tokenid",
  ]);
}

function extractPaymentIdFromOrder(order: CreateOrderResponse): string | null {
  // Fast path — follow existing paymentTransaction conventions.
  const pt = (order as any)?.paymentTransaction;
  const fast =
    normalizeToString(pt?.paymentId) ??
    normalizeToString(pt?.payment_id) ??
    normalizeToString(pt?.paymentID) ??
    normalizeToString(pt?.transactionId) ??
    normalizeToString(pt?.transaction_id) ??
    normalizeToString(pt?.id);
  if (fast) return fast;

  return extractStringByKeysDeep(order as unknown, [
    "paymentId",
    "payment_id",
    "paymentID",
    "transactionId",
    "transaction_id",
    "payment_id",
  ]);
}

export async function createSkipCashTokenizationSession(
  authToken: string,
  args: {
    cartItemUuids: string[];
    currency: string;
    couponCode?: string;
  },
): Promise<CreateSkipCashTokenizationSessionResult> {
  const { order, error } = await createOrder(authToken, {
    cartItemUuids: args.cartItemUuids,
    paymentMethod: "credit_card",
    currency: args.currency,
    couponCode: args.couponCode,
    tokenizeCard: true,
  });

  if (!order?.uuid) {
    return {
      orderUuid: null,
      tokenId: null,
      paymentId: null,
      error: error ?? "Failed to create SkipCash tokenization session",
    };
  }

  return {
    orderUuid: order.uuid,
    tokenId: extractTokenIdFromOrder(order),
    paymentId: extractPaymentIdFromOrder(order),
    error: null,
  };
}

export type SubmitSkipCashPaymentResultRequest = {
  amount: string | number;
  currency: string;
  orderUUID: string;
  paymentStatus: SkipCashPaymentStatus;
  paymentId: string;
  tokenId?: string;
  failureReason?: string;
  errorCode?: string;
};

export type SubmitSkipCashPaymentResultResult = {
  ok: boolean;
  error: string | null;
  raw: unknown | null;
};

/**
 * POST `/v1/payments/result`
 * Used by SkipCash embedded flows to persist card + mark payment result.
 */
export async function submitSkipCashPaymentResult(
  authToken: string,
  body: SubmitSkipCashPaymentResultRequest,
): Promise<SubmitSkipCashPaymentResultResult> {
  const res = await apiFetch(API_ENDPOINTS.PAYMENTS_RESULT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      amount: String(body.amount),
      currency: String(body.currency).toLowerCase(),
      orderUUID: String(body.orderUUID).trim(),
      paymentStatus: body.paymentStatus,
      paymentId: String(body.paymentId).trim(),
      ...(body.tokenId ? { tokenId: String(body.tokenId).trim() } : {}),
      ...(body.failureReason ? { failureReason: String(body.failureReason) } : {}),
      ...(body.errorCode ? { errorCode: String(body.errorCode) } : {}),
    }),
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      error: extractResponseErrorMessage(raw),
      raw,
    };
  }

  return { ok: true, error: null, raw };
}


import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { extractResponseErrorMessage } from "@/services/api/parseApiErrorResponse";
import {
  readCheckoutReviewSession,
  type CheckoutReviewSession,
} from "@/lib/checkout/checkoutReviewSession";
import type { CreateOrderResponse } from "@/services/orders/createOrder";

export type RetryOrderPaymentRequestBody = {
  paymentMethod?: string;
  platform?: string;
  tokenizeCard?: boolean;
  tokenId?: string;
  redirectUrl?: string;
};

export function normalizeRetryPaymentMethod(_paymentMethod?: string): string {
  // Backend contract currently accepts only the credit-card method for these flows.
  // Keep the UI options for display, but always send `credit_card` in the payload.
  return "credit_card";
}

export function buildRetryPaymentRequestBody(params: {
  redirectUrl?: string;
  fallbackPaymentMethod?: string;
  session?: CheckoutReviewSession | null;
}): RetryOrderPaymentRequestBody {
  const session = params.session ?? readCheckoutReviewSession();
  const storedPaymentType = String(session.paymentMethodType ?? "")
    .trim()
    .toLowerCase();
  const savedCardToken =
    typeof session.skipcashSavedCardTokenId === "string"
      ? session.skipcashSavedCardTokenId.trim()
      : "";

  const resolvedPaymentMethod = normalizeRetryPaymentMethod(
    storedPaymentType || params.fallbackPaymentMethod || "credit_card",
  );

  if (savedCardToken) {
    return {
      paymentMethod: "credit_card",
      platform: "web",
      tokenId: savedCardToken,
      ...(params.redirectUrl ? { redirectUrl: params.redirectUrl } : {}),
    };
  }

  if (session.skipcashTokenizeCard) {
    return {
      paymentMethod: "credit_card",
      platform: "web",
      tokenizeCard: false,
      ...(params.redirectUrl ? { redirectUrl: params.redirectUrl } : {}),
    };
  }

  return {
    paymentMethod: resolvedPaymentMethod,
    platform: "web",
    tokenizeCard: false,
    ...(params.redirectUrl ? { redirectUrl: params.redirectUrl } : {}),
  };
}

export type RetryOrderPaymentResult = {
  order: CreateOrderResponse | null;
  error: string | null;
};

/**
 * POST `v1/orders/{orderUuid}/retry-payment` — retry an unpaid order using the same
 * payment metadata as the new checkout flow. For web, `platform` must be sent as
 * `web` and a `redirectUrl` should be provided when the backend requires a redirect.
 */
export async function retryOrderPayment(
  authToken: string,
  orderUuid: string,
  body: RetryOrderPaymentRequestBody = {},
): Promise<RetryOrderPaymentResult> {
  const uuid = String(orderUuid || "").trim();
  if (!uuid) {
    return { order: null, error: "Missing orderUuid" };
  }

  const paymentMethod = String(body.paymentMethod || "credit_card").toLowerCase();
  const platform = String(body.platform || "web").toLowerCase();
  const tokenizeCard =
    typeof body.tokenizeCard === "boolean" ? body.tokenizeCard : undefined;
  const tokenId = body.tokenId ? String(body.tokenId).trim() : undefined;
  const redirectUrl = body.redirectUrl ? String(body.redirectUrl).trim() : undefined;

  const res = await apiFetch(API_ENDPOINTS.ORDER_RETRY_PAYMENT(uuid), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      paymentMethod,
      platform,
      ...(tokenizeCard !== undefined ? { tokenizeCard } : {}),
      ...(tokenId ? { tokenId } : {}),
      ...(redirectUrl ? { redirectUrl } : {}),
    }),
  });

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { order: null, error: extractResponseErrorMessage(raw) };
  }
  if (!raw || typeof raw !== "object") {
    return { order: null, error: null };
  }
  const order = raw as CreateOrderResponse;
  if (!order.uuid) {
    return { order: null, error: extractResponseErrorMessage(raw) };
  }
  return { order, error: null };
}

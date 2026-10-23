import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { extractResponseErrorMessage } from "@/services/api/parseApiErrorResponse";

export type CreateOrderRequestBody = {
  cartItemUuids: string[];
  paymentMethod: string;
  currency?: string;
  couponCode?: string;
  redirectUrl?: string;
  /**
   * SkipCash / embedded-card flow:
   * - first call: `tokenizeCard: true` (no `tokenId` required)
   * - payment call: `tokenId` provided by tokenize session
   */
  tokenizeCard?: boolean;
  tokenId?: string;
};

export type OrderMoney = {
  amount: number;
  minorAmount?: number;
  currencyCode: string;
};

export type CreateOrderProductSummary = {
  uuid?: string;
  slug?: string;
  titleEn?: string;
  titleAr?: string;
  briefEn?: string;
  briefAr?: string;
  description?: string;
  descriptionEn?: string;
  status?: string;
};

export type CreateOrderVariantSummary = {
  uuid?: string;
  titleEn?: string;
  titleAr?: string;
  sku?: string;
  barcode?: string;
  price?: OrderMoney;
  weight?: { amount?: number; unit?: string };
  dimensions?: {
    width?: number;
    height?: number;
    length?: number;
    unit?: string;
  };
};

export type CreateOrderLineItem = {
  uuid: string;
  product?: CreateOrderProductSummary;
  variant?: CreateOrderVariantSummary;
  price?: OrderMoney;
  quantity?: number;
  total?: OrderMoney;
};

export type CreateOrderResponse = {
  uuid: string;
  status: string;
  subTotal: OrderMoney;
  shippingCost: OrderMoney;
  discount: OrderMoney;
  total: OrderMoney;
  eta?: string;
  orderItems?: CreateOrderLineItem[];
  paymentTransaction?: {
    id?: string;
    provider?: string;
    transactionId?: string;
    amount?: number;
    currency?: string;
    status?: string;
    rawResponse?: {
      resultObj?: {
        payUrl?: string;
        payURL?: string;
        pay_url?: string;
      };
    };
  };
};

export function getOrderPayUrl(order: CreateOrderResponse | null): string | null {
  function normUrl(x: unknown): string | null {
    const s = typeof x === "string" ? x.trim() : "";
    return s ? s : null;
  }

  const pt = order?.paymentTransaction as Record<string, unknown> | undefined;
  if (!pt) return null;

  const direct =
    normUrl((pt as any).payUrl) ??
    normUrl((pt as any).payURL) ??
    normUrl((pt as any).pay_url) ??
    normUrl((pt as any).paymentUrl) ??
    normUrl((pt as any).paymentURL) ??
    normUrl((pt as any).payment_url) ??
    normUrl((pt as any).checkoutUrl) ??
    normUrl((pt as any).checkoutURL) ??
    normUrl((pt as any).checkout_url) ??
    normUrl((pt as any)?.rawResponse?.payUrl) ??
    normUrl((pt as any)?.rawResponse?.payURL) ??
    normUrl((pt as any)?.rawResponse?.pay_url) ??
    normUrl((pt as any)?.rawResponse?.paymentUrl) ??
    normUrl((pt as any)?.rawResponse?.paymentURL) ??
    normUrl((pt as any)?.rawResponse?.payment_url) ??
    normUrl((pt as any)?.rawResponse?.checkoutUrl) ??
    normUrl((pt as any)?.rawResponse?.checkoutURL) ??
    normUrl((pt as any)?.rawResponse?.checkout_url) ??
    normUrl((pt as any)?.rawResponse?.resultObj?.payUrl) ??
    normUrl((pt as any)?.rawResponse?.resultObj?.payURL) ??
    normUrl((pt as any)?.rawResponse?.resultObj?.pay_url) ??
    normUrl((pt as any)?.rawResponse?.resultObj?.checkoutUrl) ??
    normUrl((pt as any)?.rawResponse?.resultObj?.checkoutURL) ??
    normUrl((pt as any)?.rawResponse?.resultObj?.checkout_url);
  if (direct) return direct;

  // Fallback: deep-search for known redirect keys anywhere in the object.
  const seen = new Set<unknown>();
  const stack: unknown[] = [pt];
  const redirectKeys = new Set([
    "payUrl",
    "payURL",
    "pay_url",
    "paymentUrl",
    "paymentURL",
    "payment_url",
    "checkoutUrl",
    "checkoutURL",
    "checkout_url",
  ]);
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
      if (redirectKeys.has(k)) {
        const found = normUrl(v);
        if (found) return found;
      }
      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

export type CreateOrderResult = {
  order: CreateOrderResponse | null;
  error: string | null;
};

/**
 * POST `v1/orders` — places an order from the current cart lines.
 * Returns the order on success; on failure includes API error text when available.
 */
export async function createOrder(
  authToken: string,
  body: CreateOrderRequestBody,
): Promise<CreateOrderResult> {
  const paymentMethod = String(body.paymentMethod || "credit_card").toLowerCase();
  const currency = body.currency ? String(body.currency).toLowerCase() : undefined;
  const couponCode = body.couponCode ? String(body.couponCode).trim() : undefined;
  const tokenizeCard =
    typeof body.tokenizeCard === "boolean" ? body.tokenizeCard : undefined;
  const tokenId = body.tokenId ? String(body.tokenId).trim() : undefined;
  const redirectUrl = body.redirectUrl ? String(body.redirectUrl).trim() : undefined;

  const res = await apiFetch(API_ENDPOINTS.ORDERS_CREATE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      // Keep payload keys aligned with backend expectations.
      cartItemUuids: body.cartItemUuids,
      paymentMethod,
      currency,
      couponCode,
      redirectUrl,
      tokenizeCard,
      tokenId,
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

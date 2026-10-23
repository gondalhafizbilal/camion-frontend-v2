import { normalizeKnownOrderStatus } from "@/lib/order/orderDisplayStatus";
import { gqlMoneyToNumber } from "@/services/graphql/money";
import type { TikTokCommerceParams, TikTokContentItem } from "./tiktokProductCommerce";
import { trackTikTokCommerceEvent } from "./tiktokTrack";
import { runWhenTikTokPixelReady } from "./tiktokPixelClient";

export type TikTokPurchaseOrderLine = {
  quantity?: number | null;
  price?: { amount?: unknown; minorAmount?: unknown } | null;
  total?: { amount?: unknown; minorAmount?: unknown } | null;
  product?: { uuid?: string | null; title?: string | null } | null;
  variant?: { uuid?: string | null; title?: string | null } | null;
};

export type TikTokPurchaseOrderInput = {
  orderUuid: string;
  status?: string | null;
  total?: {
    amount?: unknown;
    minorAmount?: unknown;
    currencyCode?: string | null;
  } | null;
  orderItems?: TikTokPurchaseOrderLine[] | null;
};

const PURCHASE_TRACKED_STORAGE_KEY = "camion_tt_purchase_ids_v1";

function safeMoney(
  m: { amount?: unknown; minorAmount?: unknown } | null | undefined,
): number | null {
  const n = gqlMoneyToNumber(
    m as {
      amount?: number | string | null;
      minorAmount?: number | string | null;
    } | null,
  );
  return n != null && n >= 0 ? n : null;
}

function readTrackedPurchaseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.sessionStorage.getItem(PURCHASE_TRACKED_STORAGE_KEY) ??
      window.localStorage.getItem(PURCHASE_TRACKED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function markPurchaseTracked(orderUuid: string): void {
  if (typeof window === "undefined") return;
  const id = orderUuid.trim();
  if (!id) return;
  try {
    const ids = [...new Set([...readTrackedPurchaseIds(), id])].slice(-100);
    const serialized = JSON.stringify(ids);
    window.sessionStorage.setItem(PURCHASE_TRACKED_STORAGE_KEY, serialized);
    window.localStorage.setItem(PURCHASE_TRACKED_STORAGE_KEY, serialized);
  } catch {
    /* ignore */
  }
}

function wasTikTokPurchaseTracked(orderUuid: string): boolean {
  const id = orderUuid.trim();
  return id ? readTrackedPurchaseIds().includes(id) : false;
}

function isOrderEligibleForTikTokPurchase(status?: string | null): boolean {
  const known = normalizeKnownOrderStatus(status);
  if (known === "cancelled" || known === "payment_rejected") return false;
  if (known === "payment_pending") return false;
  return true;
}

function orderLineToTikTokContent(
  line: TikTokPurchaseOrderLine,
): TikTokContentItem | null {
  const content_id = String(line.product?.uuid ?? line.variant?.uuid ?? "").trim();
  if (!content_id) return null;

  const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
  const lineTotal = safeMoney(line.total);
  const unitFromApi = safeMoney(line.price);
  const price =
    unitFromApi != null
      ? unitFromApi
      : lineTotal != null && quantity > 0
        ? lineTotal / quantity
        : 0;
  const content_name = String(
    line.product?.title ?? line.variant?.title ?? content_id,
  ).trim();

  return {
    content_id,
    content_type: "product",
    content_name: content_name || content_id,
    quantity,
    price,
  };
}

export function buildTikTokPurchaseParams(
  order: TikTokPurchaseOrderInput,
): TikTokCommerceParams | null {
  const orderUuid = String(order.orderUuid ?? "").trim();
  if (!orderUuid) return null;
  if (!isOrderEligibleForTikTokPurchase(order.status)) return null;

  const contents = (order.orderItems ?? [])
    .map(orderLineToTikTokContent)
    .filter((entry): entry is TikTokContentItem => entry != null);
  if (!contents.length) return null;

  const value = safeMoney(order.total);
  if (value == null || value <= 0) return null;

  const currency =
    String(order.total?.currencyCode ?? "QAR")
      .trim()
      .toUpperCase() || "QAR";

  return { contents, value, currency };
}

/** TikTok purchase conversion — `CompletePayment` (Purchase / ROAS in Ads Manager). */
export function trackTikTokPurchaseFromOrder(
  order: TikTokPurchaseOrderInput,
): void {
  const orderUuid = String(order.orderUuid ?? "").trim();
  if (!orderUuid || wasTikTokPurchaseTracked(orderUuid)) return;

  const params = buildTikTokPurchaseParams(order);
  if (!params) return;

  markPurchaseTracked(orderUuid);
  runWhenTikTokPixelReady(() => {
    trackTikTokCommerceEvent("CompletePayment", params, orderUuid);
  });
}

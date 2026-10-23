import { normalizeKnownOrderStatus } from "@/lib/order/orderDisplayStatus";
import { gqlMoneyToNumber } from "@/services/graphql/money";
import { runWhenFacebookPixelReady } from "./facebookPixelClient";

export type FacebookPurchaseParams = {
  content_ids: string[];
  content_type: "product";
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  value: number;
  currency: string;
  num_items: number;
};

export type FacebookPurchaseOrderLine = {
  quantity?: number | null;
  price?: { amount?: unknown; minorAmount?: unknown } | null;
  total?: { amount?: unknown; minorAmount?: unknown } | null;
  product?: { uuid?: string | null } | null;
  variant?: { uuid?: string | null } | null;
};

export type FacebookPurchaseOrderInput = {
  orderUuid: string;
  status?: string | null;
  total?: {
    amount?: unknown;
    minorAmount?: unknown;
    currencyCode?: string | null;
  } | null;
  orderItems?: FacebookPurchaseOrderLine[] | null;
};

const PURCHASE_TRACKED_STORAGE_KEY = "camion_fb_purchase_ids_v1";

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
    /* ignore quota / private mode */
  }
}

export function wasFacebookPurchaseTracked(orderUuid: string): boolean {
  const id = orderUuid.trim();
  if (!id) return false;
  return readTrackedPurchaseIds().includes(id);
}

/** Skip cancelled, rejected, or unpaid orders. */
export function isOrderEligibleForFacebookPurchase(
  status?: string | null,
): boolean {
  const known = normalizeKnownOrderStatus(status);
  if (known === "cancelled" || known === "payment_rejected") return false;
  if (known === "payment_pending") return false;
  return true;
}

function orderLineContentId(line: FacebookPurchaseOrderLine): string {
  return String(line.product?.uuid ?? line.variant?.uuid ?? "").trim();
}

function orderLineToContentEntry(
  line: FacebookPurchaseOrderLine,
): FacebookPurchaseParams["contents"][number] | null {
  const id = orderLineContentId(line);
  if (!id) return null;

  const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
  const lineTotal = safeMoney(line.total);
  const unitFromApi = safeMoney(line.price);
  const item_price =
    unitFromApi != null
      ? unitFromApi
      : lineTotal != null && quantity > 0
        ? lineTotal / quantity
        : 0;

  return { id, quantity, item_price };
}

/** Builds Meta Purchase payload from a placed order. */
export function buildFacebookPurchaseParams(
  order: FacebookPurchaseOrderInput,
): FacebookPurchaseParams | null {
  const orderUuid = String(order.orderUuid ?? "").trim();
  if (!orderUuid) return null;
  if (!isOrderEligibleForFacebookPurchase(order.status)) return null;

  const lines = order.orderItems ?? [];
  const contents = lines
    .map(orderLineToContentEntry)
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  if (!contents.length) return null;

  const content_ids = [...new Set(contents.map((c) => c.id))];
  const num_items = contents.reduce((sum, c) => sum + c.quantity, 0);
  const value = safeMoney(order.total);
  if (value == null || value <= 0) return null;

  const currency =
    String(order.total?.currencyCode ?? "QAR")
      .trim()
      .toUpperCase() || "QAR";

  return {
    content_ids,
    content_type: "product",
    contents,
    value,
    currency,
    num_items,
  };
}

export function trackFacebookPurchase(
  params: FacebookPurchaseParams,
  eventId: string,
): void {
  if (typeof window.fbq !== "function") return;
  const id = eventId.trim();
  window.fbq(
    "track",
    "Purchase",
    params,
    id ? { eventID: id } : undefined,
  );
}

/** Fires Purchase once per order UUID (persistent dedupe + Meta `eventID`). */
export function trackFacebookPurchaseFromOrder(
  order: FacebookPurchaseOrderInput,
): void {
  const orderUuid = String(order.orderUuid ?? "").trim();
  if (!orderUuid || wasFacebookPurchaseTracked(orderUuid)) return;

  const params = buildFacebookPurchaseParams(order);
  if (!params) return;

  markPurchaseTracked(orderUuid);
  runWhenFacebookPixelReady(() => {
    trackFacebookPurchase(params, orderUuid);
  });
}

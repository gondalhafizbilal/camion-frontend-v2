import type { CartProductRef } from "@/services/cart/cartItemsApi";
import { resolveV1CartIdentifiers } from "@/services/cart/cartItemsApi";
import {
  buildFacebookAddToCartParams,
} from "./facebookAddToCart";
import {
  buildFacebookPurchaseParams,
  type FacebookPurchaseOrderInput,
} from "./facebookPurchase";
import { pushGtmEvent } from "./gtmDataLayer";

/** Event names aligned with the marketing funnel sheet (exact GTM Custom Event names). */
export const GTM_FUNNEL_EVENT = {
  PageView: "PageView",
  ViewContent: "ViewContent",
  LandingPageView: "Landing Page view",
  AddToCart: "AddToCart",
  ViewCart: "ViewCart",
  Checkout: "Checkout",
  OrderReview: "Order-review",
  Purchase: "Purchase",
} as const;

export const GTM_WEB_EVENT = {
  ViewHome: "view_home",
  AddToCart: "add_to_cart",
  ViewCart: "view_cart",
  BeginCheckout: "begin_checkout",
  Purchase: "purchase",
} as const;

/** Strip `/en` or `/ar` so route rules stay locale-agnostic. */
export function stripLocalePath(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|ar)(?=\/|$)/, "");
  return stripped || "/";
}

/**
 * Page-load funnel events for a pathname (always includes PageView).
 * Mapped to Camion App Router routes, not the sheet’s generic examples.
 */
export function resolveGtmPageFunnelEvents(pathname: string): string[] {
  const path = stripLocalePath(pathname);
  const events: string[] = [GTM_FUNNEL_EVENT.PageView];

  if (path === "/cart") {
    events.push(GTM_FUNNEL_EVENT.ViewCart);
    return events;
  }

  if (path === "/checkout" || path.startsWith("/checkout/payment")) {
    events.push(GTM_FUNNEL_EVENT.Checkout);
    return events;
  }

  if (path === "/checkout/order-review") {
    events.push(GTM_FUNNEL_EVENT.OrderReview);
    return events;
  }

  // PDP: /shop/[slug] — not shop listing
  if (/^\/shop\/[^/]+\/?$/.test(path)) {
    events.push(GTM_FUNNEL_EVENT.LandingPageView);
    return events;
  }

  // Category / listing pages
  if (
    path === "/shop" ||
    path === "/categories" ||
    path.startsWith("/categories/") ||
    path.startsWith("/campaign/")
  ) {
    events.push(GTM_FUNNEL_EVENT.ViewContent);
  }

  return events;
}

export function buildGtmPageParams(
  pathname: string,
  search: string,
): Record<string, unknown> {
  const pagePath = search ? `${pathname}?${search}` : pathname;
  const path = stripLocalePath(pathname);
  const slugMatch = path.match(/^\/(?:shop|categories|campaign)\/([^/]+)/);

  return {
    page_path: pagePath,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
    page_type: path === "/" ? "home" : path.split("/").filter(Boolean)[0] || "home",
    content_slug: slugMatch?.[1] || undefined,
  };
}

/** Fire all route-based funnel events for the current page. */
export function trackGtmPageFunnel(pathname: string, search = ""): void {
  const params = buildGtmPageParams(pathname, search);
  for (const event of resolveGtmPageFunnelEvents(pathname)) {
    pushGtmEvent(event, params);
  }

  const path = stripLocalePath(pathname);
  if (path === "/") pushGtmEvent(GTM_WEB_EVENT.ViewHome, params);
  if (path === "/cart") pushGtmEvent(GTM_WEB_EVENT.ViewCart, params);
  if (path === "/checkout") pushGtmEvent(GTM_WEB_EVENT.BeginCheckout, params);
}

export function trackGtmAddToCartFromCartRef(
  product: CartProductRef,
  quantity: number,
  currency?: string,
): void {
  const ids = resolveV1CartIdentifiers(product);
  if (!ids) return;

  const commerce = buildFacebookAddToCartParams({
    contentId: ids.productUuid,
    contentName: product.name,
    contentCategory: product.contentCategory,
    prices: product.prices,
    variantUuid: ids.variantUuid,
    quantity,
    currency,
  });
  if (!commerce) return;

  const payload = {
    product_id: ids.productUuid,
    variant_id: ids.variantUuid || undefined,
    category: product.contentCategory || undefined,
    quantity,
    item_value: commerce.value,
    currency: commerce.currency,
    content_ids: commerce.content_ids,
    content_type: commerce.content_type,
    contents: commerce.contents,
    value: commerce.value,
  };

  pushGtmEvent(GTM_FUNNEL_EVENT.AddToCart, payload);
  pushGtmEvent(GTM_WEB_EVENT.AddToCart, payload);
}

export type GtmPurchaseOrderInput = FacebookPurchaseOrderInput;

const PURCHASE_STORAGE_KEY = "gtm_purchase_tracked_ids";

function readTrackedPurchaseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const values = [
      window.sessionStorage.getItem(PURCHASE_STORAGE_KEY),
      window.localStorage.getItem(PURCHASE_STORAGE_KEY),
    ].flatMap((raw) => {
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    });
    return [...new Set(values)];
  } catch {
    return [];
  }
}

function markPurchaseTracked(orderUuid: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = [...new Set([...readTrackedPurchaseIds(), orderUuid])].slice(-100);
    const serialized = JSON.stringify(ids);
    window.sessionStorage.setItem(PURCHASE_STORAGE_KEY, serialized);
    window.localStorage.setItem(PURCHASE_STORAGE_KEY, serialized);
  } catch {
    /* ignore */
  }
}

/** Paid/eligible purchase on confirmation (persistently deduped per order UUID). */
export function trackGtmPurchaseFromOrder(order: GtmPurchaseOrderInput): void {
  const orderUuid = String(order.orderUuid ?? "").trim();
  if (!orderUuid) return;
  if (readTrackedPurchaseIds().includes(orderUuid)) return;

  const commerce = buildFacebookPurchaseParams(order);
  if (!commerce) return;

  markPurchaseTracked(orderUuid);
  const payload = {
    event_id: orderUuid,
    transaction_id: orderUuid,
    order_id: orderUuid,
    value: commerce.value,
    currency: commerce.currency,
    status: order.status || undefined,
    content_ids: commerce.content_ids,
    content_type: commerce.content_type,
    contents: commerce.contents,
    num_items: commerce.num_items,
  };

  pushGtmEvent(GTM_FUNNEL_EVENT.Purchase, payload);
  pushGtmEvent(GTM_WEB_EVENT.Purchase, payload);
}

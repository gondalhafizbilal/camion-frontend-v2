import {
  ORDER_TRACKING_STAGE,
  type GqlOrderTrackingStage,
} from "@/services/graphql/types/orderTracking";

export function getTrackingStage(
  stages: GqlOrderTrackingStage[] | null | undefined,
  id: number,
): GqlOrderTrackingStage | undefined {
  return (stages ?? []).find((s) => s.id === id);
}

export function isOrderCancelledFromTracking(
  stages: GqlOrderTrackingStage[] | null | undefined,
): boolean {
  return Boolean(getTrackingStage(stages, ORDER_TRACKING_STAGE.CANCELLED)?.checked);
}

export function isDeliveredFromTracking(
  stages: GqlOrderTrackingStage[] | null | undefined,
): boolean {
  return Boolean(getTrackingStage(stages, ORDER_TRACKING_STAGE.DELIVERED)?.checked);
}

export function canReviewFromTracking(
  stages: GqlOrderTrackingStage[] | null | undefined,
): boolean {
  if (!isDeliveredFromTracking(stages) || isOrderCancelledFromTracking(stages)) return false;
  return !getTrackingStage(stages, ORDER_TRACKING_STAGE.REVIEW)?.checked;
}

export function canRequestReturnFromTracking(
  stages: GqlOrderTrackingStage[] | null | undefined,
): boolean {
  return isDeliveredFromTracking(stages) && !isOrderCancelledFromTracking(stages);
}

export function trackingIdFromStages(
  stages: GqlOrderTrackingStage[] | null | undefined,
): string {
  const dispatch = getTrackingStage(stages, ORDER_TRACKING_STAGE.DISPATCHING);
  if (!dispatch?.checked) return "";
  return String(dispatch.metadata?.trackingId ?? "").trim();
}

export function cancellationReasonFromStages(
  stages: GqlOrderTrackingStage[] | null | undefined,
): string {
  const cancelled = getTrackingStage(stages, ORDER_TRACKING_STAGE.CANCELLED);
  if (!cancelled?.checked) return "";
  return String(cancelled.metadata?.cancellationReason ?? "").trim();
}

export function lastCheckedTrackingStage(
  stages: GqlOrderTrackingStage[] | null | undefined,
): GqlOrderTrackingStage | null {
  const checked = (stages ?? []).filter((s) => s.checked);
  if (!checked.length) return null;
  return checked.reduce((latest, stage) => (stage.id > latest.id ? stage : latest));
}

export function formatTrackingDate(
  date: string | null | undefined,
  locale: string,
): string {
  const raw = String(date ?? "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const loc = locale === "ar" ? "ar" : "en-US";
  return d.toLocaleString(loc, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formats `orderPlacementDate` (ISO string or epoch seconds/ms). */
export function formatOrderPlacementDate(
  date: string | number | null | undefined,
  locale: string,
): string {
  if (date == null || date === "") return "";
  if (typeof date === "number") {
    if (!Number.isFinite(date)) return "";
    const ms = date < 1e12 ? date * 1000 : date;
    return formatTrackingDate(new Date(ms).toISOString(), locale);
  }
  return formatTrackingDate(String(date), locale);
}

/** Short display id — matches account order list / confirmation style. */
export function shortOrderNumber(uuid: string | null | undefined): string {
  const id = String(uuid ?? "").trim();
  if (!id) return "";
  return id.length > 8 ? id.slice(0, 8) : id;
}

type ShippingAddressLike = {
  fullName?: string | null;
  phoneNumber?: string | null;
  streetAddress?: string | null;
  apartment?: string | null;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
} | null | undefined;

/** Non-empty address lines for delivery summary blocks. */
export function shippingAddressLines(address: ShippingAddressLike): string[] {
  if (!address) return [];
  return [
    String(address.fullName ?? "").trim(),
    String(address.phoneNumber ?? "").trim(),
    [address.streetAddress, address.apartment]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join(", "),
    [address.city, address.state, address.zipCode]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join(", "),
    String(address.country ?? "").trim(),
  ].filter(Boolean);
}

export const DEMO_ORDER_TRACKING_STAGES: GqlOrderTrackingStage[] = [
  {
    id: 1,
    name: "Order Placed",
    checked: true,
    date: "2026-06-23T10:00:00.000Z",
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
  {
    id: 2,
    name: "Payment Confirmed",
    checked: true,
    date: "2026-06-23T10:01:00.000Z",
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
  {
    id: 3,
    name: "Order Confirmed",
    checked: true,
    date: "2026-06-23T10:05:00.000Z",
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
  {
    id: 4,
    name: "Processing",
    checked: true,
    date: "2026-06-23T11:00:00.000Z",
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
  {
    id: 5,
    name: "Packing",
    checked: true,
    date: "2026-06-24T06:00:00.000Z",
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
  {
    id: 6,
    name: "Dispatching",
    checked: true,
    date: "2026-06-25T08:00:00.000Z",
    metadata: {
      trackingId: "TRK1234567890",
      cancellationReason: null,
      reviewText: null,
      reviewRating: null,
    },
  },
  {
    id: 7,
    name: "Order Delivered",
    checked: false,
    date: null,
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
  {
    id: 8,
    name: "Order Review",
    checked: false,
    date: null,
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
  {
    id: 9,
    name: "Order Cancelled",
    checked: false,
    date: null,
    metadata: { trackingId: null, cancellationReason: null, reviewText: null, reviewRating: null },
  },
];

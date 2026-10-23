import { normalizeKnownOrderStatus } from "./orderDisplayStatus";

/** next-intl message keys for WMS `tracking.status` labels (English API strings). */
export const WMS_STATUS_MESSAGE_KEYS: Record<string, string> = {
  order_confirmed: "wmsStatusOrderConfirmed",
  procurement_in_progress: "wmsStatusProcurementInProgress",
  goods_being_sourced: "wmsStatusGoodsBeingSourced",
  goods_arrived_at_warehouse: "wmsStatusGoodsArrivedAtWarehouse",
  goods_being_processed: "wmsStatusGoodsBeingProcessed",
  ready_to_ship: "wmsStatusReadyToShip",
  processing_complete: "wmsStatusProcessingComplete",
  order_issue_contact_support: "wmsStatusOrderIssueContactSupport",
  preparing_your_shipment: "wmsStatusPreparingYourShipment",
  shipment_in_progress: "wmsStatusShipmentInProgress",
  shipment_delayed: "wmsStatusShipmentDelayed",
  shipment_ready: "wmsStatusShipmentReady",
  shipped: "wmsStatusShipped",
  shipment_cancelled: "wmsStatusShipmentCancelled",
};

export function statusLabelToToken(statusRaw: string | undefined | null): string {
  return String(statusRaw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s—–-]+/g, "_")
    .replace(/_+/g, "_");
}

export function getWmsStatusMessageKey(displayStatus: string): string | null {
  const token = statusLabelToToken(displayStatus);
  return WMS_STATUS_MESSAGE_KEYS[token] ?? null;
}

type TranslateFn = (key: string) => string;

/**
 * Localized label for order / WMS status (payment codes + documented WMS strings).
 */
export function translateOrderDisplayStatus(
  displayStatus: string | undefined | null,
  t: TranslateFn,
): string {
  const raw = String(displayStatus ?? "").trim();
  if (!raw) return "—";

  const known = normalizeKnownOrderStatus(raw);
  if (known) {
    switch (known) {
      case "pending":
        return t("trackStatusPending");
      case "confirmed":
        return t("trackStatusConfirmed");
      case "cancelled":
        return t("trackStatusCancelled");
      case "delivered":
        return t("trackStatusDelivered");
      case "payment_pending":
        return t("trackStatusPaymentPending");
      case "payment_successful":
        return t("trackStatusPaymentSuccessful");
      case "payment_rejected":
        return t("trackStatusPaymentRejected");
      case "payment_failed":
        return t("trackStatusPaymentFailed");
      case "payment_cancelled":
        return t("trackStatusPaymentCancelled");
      case "payment_expired":
        return t("trackStatusPaymentExpired");
      default:
        break;
    }
  }

  const wmsKey = getWmsStatusMessageKey(raw);
  if (wmsKey) return t(wmsKey);

  return raw;
}

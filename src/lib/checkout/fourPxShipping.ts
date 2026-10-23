import type { OrderPreviewResponse } from "@/services/orders/fetchOrderPreview";

export const FOUR_PX_BRAND_NAME = "4PX";

/** 4PX brand blue (badge background). */
export const FOUR_PX_BRAND_BLUE = "#0067C5";

/**
 * Maps order-preview API `shipping` + `shippingTotal` to UI (fee, currency, transit line).
 */
export function getFourPxShippingFromPreview(
  preview: OrderPreviewResponse | null | undefined,
  fallbackFee: number,
  fallbackCurrency: string,
): { fee: number; currency: string; transitLine: string } {
  if (!preview) {
    return {
      fee: fallbackFee,
      currency: fallbackCurrency,
      transitLine: "",
    };
  }
  const ship = preview.shipping;
  const rawFee =
    preview.shippingTotal != null
      ? Number(preview.shippingTotal)
      : Number(ship?.totalShippingCost ?? fallbackFee);
  const fee = Number.isFinite(rawFee) ? rawFee : fallbackFee;
  const previewCurrency = String(ship?.currency ?? "").trim();
  const fallback = String(fallbackCurrency ?? "").trim();
  const currency =
    previewCurrency &&
    fallback &&
    previewCurrency.toUpperCase() !== fallback.toUpperCase()
      ? fallback
      : (previewCurrency || fallback || "QAR");
  const transit =
    ship?.transitTime?.estimatedRange ||
    (ship?.transitTime?.minDays != null && ship?.transitTime?.maxDays != null
      ? `${ship.transitTime.minDays}–${ship.transitTime.maxDays} working days`
      : "");
  const dest = ship?.country ?? "";
  const transitLine = [transit, dest].filter(Boolean).join(" · ");
  return { fee, currency, transitLine };
}

import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";

function readNumericField(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Fake urgency stock count from API — display only, no inventory logic. */
export function resolveProductUrgencyCount(
  product: CarouselProduct | Record<string, unknown>,
): number {
  const record = product as Record<string, unknown>;
  const raw =
    record.urgency_count ??
    record.urgencyCount ??
    record.stockCount ??
    record.stock_count ??
    record.hurryUpCount ??
    record.hurry_up_count;

  const parsed = readNumericField(raw);
  if (parsed == null || parsed <= 0) return 0;
  return Math.floor(parsed);
}

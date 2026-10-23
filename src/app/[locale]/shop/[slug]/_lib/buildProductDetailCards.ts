import type {
  ProductDefaultVariantSpecs,
  ProductDetailsCenterProduct,
} from "@/types/checkoutDisplay";

type Translate = (key: string) => string;

/** PDP detail grid: SKU and barcode only (from default variant specs). */
export function buildProductDetailCards(
  product: ProductDetailsCenterProduct,
  t: Translate,
): { title: string; text: string }[] {
  const cards: { title: string; text: string }[] = [];
  const specs = product.defaultVariantSpecs as ProductDefaultVariantSpecs | null | undefined;

  if (specs?.sku) cards.push({ title: t("productDetailSku"), text: specs.sku });
  if (specs?.barcode) cards.push({ title: t("productDetailBarcode"), text: specs.barcode });

  return cards;
}

/** Variant UUID shown on list/card surfaces (`CarouselProduct.id` when distinct from product). */
export function resolveListingVariantUuid(product: {
  id?: string | number;
  productUuid?: string;
  variantUuid?: string;
}): string {
  const explicit = String(product.variantUuid ?? "").trim();
  if (explicit) return explicit;
  const id = String(product.id ?? "").trim();
  const productId = String(product.productUuid ?? "").trim();
  if (id && productId && id !== productId) return id;
  return "";
}

/** PDP path; includes `?variant=` when the listing showed a specific catalog variant. */
export function buildProductDetailHref(
  slug: string | undefined | null,
  variantUuid?: string | null,
  productUuid?: string | null,
): string {
  const s = String(slug ?? "").trim();
  if (!s) return "/shop";
  const variant = String(variantUuid ?? "").trim();
  const product = String(productUuid ?? "").trim();
  if (variant && (!product || variant !== product)) {
    return `/shop/${encodeURIComponent(s)}?variant=${encodeURIComponent(variant)}`;
  }
  return `/shop/${encodeURIComponent(s)}`;
}

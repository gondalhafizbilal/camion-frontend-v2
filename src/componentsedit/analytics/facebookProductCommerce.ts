export type FacebookProductPrices = {
  regular_price?: string | number;
  sale_price?: string | number;
  price?: string | number;
  currency_code?: string;
};

export type FacebookProductVariation = {
  id?: string | number;
  prices?: FacebookProductPrices;
};

export type FacebookCommerceParams = {
  content_ids: string[];
  content_name: string;
  content_type: "product";
  content_category?: string;
  value: number;
  currency: string;
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
};

export function parseFacebookPriceAmount(
  raw: string | number | undefined,
): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function resolveFacebookUnitPrice(
  prices: FacebookProductPrices | undefined,
): number {
  const sale = parseFacebookPriceAmount(prices?.sale_price);
  const regular = parseFacebookPriceAmount(
    prices?.regular_price ?? prices?.price,
  );
  if (sale != null && regular != null && sale < regular) return sale;
  if (sale != null) return sale;
  if (regular != null) return regular;
  return 0;
}

export function resolveFacebookPricesForVariant(
  topPrices: FacebookProductPrices | undefined,
  variations: FacebookProductVariation[] | undefined,
  variantUuid?: string | null,
): FacebookProductPrices | undefined {
  const variantId = String(variantUuid ?? "").trim();
  const match = variantId
    ? variations?.find((v) => String(v?.id ?? "").trim() === variantId)
    : variations?.[0];
  return match?.prices ?? topPrices;
}

type BuildFacebookCommerceOptions = {
  contentId: string;
  contentName?: string;
  contentCategory?: string;
  prices?: FacebookProductPrices;
  variations?: FacebookProductVariation[];
  variantUuid?: string | null;
  quantity?: number;
  currency?: string;
};

/** Shared Meta product payload for ViewContent, AddToCart, etc. */
export function buildFacebookCommerceParams(
  options: BuildFacebookCommerceOptions,
): FacebookCommerceParams | null {
  const contentId = String(options.contentId ?? "").trim();
  if (!contentId) return null;

  const qty = Math.max(1, Math.floor(Number(options.quantity) || 1));
  const resolvedPrices = resolveFacebookPricesForVariant(
    options.prices,
    options.variations,
    options.variantUuid,
  );
  const unitPrice = resolveFacebookUnitPrice(resolvedPrices);
  const currency = String(
    options.currency ??
      resolvedPrices?.currency_code ??
      "QAR",
  )
    .trim()
    .toUpperCase() || "QAR";
  const contentName = String(options.contentName ?? "").trim() || contentId;
  const category = String(options.contentCategory ?? "").trim();

  return {
    content_ids: [contentId],
    content_name: contentName,
    content_type: "product",
    ...(category ? { content_category: category } : {}),
    value: unitPrice * qty,
    currency,
    contents: [
      {
        id: contentId,
        quantity: qty,
        item_price: unitPrice,
      },
    ],
  };
}

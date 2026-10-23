"use client";

import { useEffect, useMemo, useRef } from "react";
import { pushGtmEvent } from "./gtmDataLayer";

type ProductPrices = {
  price?: string | number;
  sale_price?: string | number;
  regular_price?: string | number;
  currency_code?: string;
};

type ProductVariation = {
  id?: string | number;
  prices?: ProductPrices;
};

export type GtmDiscoveryProduct = {
  id?: string | number;
  productUuid?: string;
  variantUuid?: string;
  name?: string;
  slug?: string;
  prices?: ProductPrices;
  variations?: unknown[];
  categories?: Array<{ name?: string; slug?: string }>;
};

export type GtmItemListContext = {
  itemListId: string;
  itemListName: string;
  category?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function finiteAmount(value: unknown): number | undefined {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

function resolveProductValues(
  product: GtmDiscoveryProduct,
  variantUuid?: string | null,
) {
  const productId = clean(product.productUuid ?? product.id);
  const variations = Array.isArray(product.variations)
    ? (product.variations as ProductVariation[])
    : [];
  const resolvedVariantId =
    clean(variantUuid ?? product.variantUuid) || clean(variations[0]?.id);
  const variant = resolvedVariantId
    ? variations.find((row) => clean(row?.id) === resolvedVariantId)
    : variations[0];
  const prices = variant?.prices ?? product.prices;
  const sale = finiteAmount(prices?.sale_price);
  const regular = finiteAmount(prices?.regular_price ?? prices?.price);
  const itemValue =
    sale !== undefined && (regular === undefined || sale < regular)
      ? sale
      : (regular ?? sale ?? 0);
  const currency = clean(prices?.currency_code).toUpperCase() || "QAR";
  const category = clean(product.categories?.[0]?.name);

  return { productId, resolvedVariantId, itemValue, currency, category };
}

function buildItem(
  product: GtmDiscoveryProduct,
  index?: number,
  categoryOverride?: string,
  variantUuid?: string | null,
): Record<string, unknown> | null {
  const values = resolveProductValues(product, variantUuid);
  if (!values.productId) return null;
  const category = clean(categoryOverride) || values.category;

  return {
    item_id: values.productId,
    product_id: values.productId,
    ...(values.resolvedVariantId
      ? { variant_id: values.resolvedVariantId }
      : {}),
    item_name: clean(product.name) || values.productId,
    ...(category ? { category, item_category: category } : {}),
    price: values.itemValue,
    item_value: values.itemValue,
    currency: values.currency,
    ...(index === undefined ? {} : { index }),
  };
}

function buildItems(
  products: GtmDiscoveryProduct[],
  category?: string,
): Array<Record<string, unknown>> {
  return products
    .slice(0, 100)
    .map((product, index) => buildItem(product, index, category))
    .filter((item): item is Record<string, unknown> => item !== null);
}

export function trackGtmSearch(searchTerm: string): void {
  const term = clean(searchTerm);
  if (!term) return;
  pushGtmEvent("search", { search_term: term });
}

export function trackGtmSearchResults(
  searchTerm: string,
  products: GtmDiscoveryProduct[],
): void {
  const term = clean(searchTerm);
  if (!term) return;
  pushGtmEvent("view_search_results", {
    search_term: term,
    result_count: products.length,
    items: buildItems(products),
  });
}

export function trackGtmSelectItem(
  product: GtmDiscoveryProduct,
  list?: GtmItemListContext,
  index?: number,
): void {
  const item = buildItem(product, index, list?.category);
  if (!item) return;
  pushGtmEvent("select_item", {
    product_id: item.product_id,
    variant_id: item.variant_id,
    category: item.category,
    item_value: item.item_value,
    currency: item.currency,
    item_list_id: list?.itemListId,
    item_list_name: list?.itemListName,
    items: [item],
  });
}

export function useGtmItemList(
  products: GtmDiscoveryProduct[],
  list: GtmItemListContext,
  enabled = true,
): void {
  const lastFingerprintRef = useRef<string | null>(null);
  const fingerprint = useMemo(
    () =>
      [
        clean(list.itemListId),
        clean(list.itemListName),
        clean(list.category),
        ...products.map((product) => {
          const values = resolveProductValues(product);
          return `${values.productId}:${values.resolvedVariantId}:${values.currency}`;
        }),
      ].join("|"),
    [products, list.itemListId, list.itemListName, list.category],
  );

  useEffect(() => {
    if (!enabled || products.length === 0 || !clean(list.itemListId)) return;
    if (lastFingerprintRef.current === fingerprint) return;
    const items = buildItems(products, list.category);
    if (items.length === 0) return;
    lastFingerprintRef.current = fingerprint;
    pushGtmEvent("view_item_list", {
      category: clean(list.category) || undefined,
      item_list_id: clean(list.itemListId),
      item_list_name: clean(list.itemListName) || clean(list.itemListId),
      items,
    });
  }, [enabled, fingerprint, list, products]);
}

export function useGtmViewCategory({
  category,
  products,
  enabled = true,
}: {
  category: string;
  products: GtmDiscoveryProduct[];
  enabled?: boolean;
}): void {
  const lastFingerprintRef = useRef<string | null>(null);
  const identity = clean(category);
  const fingerprint = identity;

  useEffect(() => {
    if (!enabled || !identity || lastFingerprintRef.current === fingerprint) return;
    lastFingerprintRef.current = fingerprint;
    pushGtmEvent("view_category", {
      category: identity,
      result_count: products.length,
      items: buildItems(products, identity),
    });
  }, [enabled, fingerprint, identity, products]);
}

export function useGtmViewItem({
  enabled,
  product,
  slug,
  variantUuid,
  currency,
}: {
  enabled: boolean;
  product: GtmDiscoveryProduct | null;
  slug?: string;
  variantUuid?: string | null;
  currency?: string;
}): void {
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !product) return;
    const item = buildItem(product, undefined, undefined, variantUuid);
    if (!item) return;
    const fingerprint = [
      clean(slug),
      item.product_id,
      item.variant_id,
      clean(currency || item.currency).toUpperCase(),
    ].join("|");
    if (lastFingerprintRef.current === fingerprint) return;
    lastFingerprintRef.current = fingerprint;
    pushGtmEvent("view_item", {
      product_id: item.product_id,
      variant_id: item.variant_id,
      category: item.category,
      item_value: item.item_value,
      currency: clean(currency || item.currency).toUpperCase(),
      items: [item],
    });
  }, [enabled, product, slug, variantUuid, currency]);
}

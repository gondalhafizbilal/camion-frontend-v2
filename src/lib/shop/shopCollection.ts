/** Query param on `/shop` to show the same product list as a home or PDP section. */
export const SHOP_COLLECTION_QUERY_KEY = "collection";

/** Product slug for `related` / `recommended` collections on `/shop`. */
export const SHOP_COLLECTION_PRODUCT_QUERY_KEY = "product";

export const SHOP_PRODUCT_COLLECTIONS = [
  "popular",
  "featured",
  "thisMonth",
  "related",
  "recommended",
] as const;

export type ShopProductCollection = (typeof SHOP_PRODUCT_COLLECTIONS)[number];

export function parseShopCollection(
  value: string | null | undefined,
): ShopProductCollection | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "popular") return "popular";
  if (normalized === "featured") return "featured";
  if (normalized === "thismonth" || normalized === "this-month") return "thisMonth";
  if (normalized === "related") return "related";
  if (normalized === "recommended") return "recommended";
  return null;
}

export function buildShopCollectionHref(
  collection: Exclude<ShopProductCollection, "related" | "recommended">,
): string {
  return `/shop?${SHOP_COLLECTION_QUERY_KEY}=${collection}`;
}

/** Same list API as PDP sections when no product slug (cart, wishlist, confirmation). */
export function buildShopContextCollectionHref(
  collection: "related" | "recommended",
): string {
  return `/shop?${SHOP_COLLECTION_QUERY_KEY}=${collection}`;
}

export function buildShopProductCollectionHref(
  collection: "related" | "recommended",
  productSlug: string,
): string {
  const slug = productSlug.trim();
  if (!slug) return buildShopContextCollectionHref(collection);
  const params = new URLSearchParams({
    [SHOP_COLLECTION_QUERY_KEY]: collection,
    [SHOP_COLLECTION_PRODUCT_QUERY_KEY]: slug,
  });
  return `/shop?${params.toString()}`;
}

export function shopCollectionRequiresProductSlug(
  collection: ShopProductCollection | null,
): collection is "related" | "recommended" {
  return collection === "related" || collection === "recommended";
}

export function shopCollectionTitleKey(
  collection: ShopProductCollection,
): "popularProducts" | "topProducts" | "recentlyViewed" | "similarProducts" | "youMayAlsoLikeThis" {
  switch (collection) {
    case "popular":
      return "popularProducts";
    case "featured":
      return "topProducts";
    case "thisMonth":
      return "recentlyViewed";
    case "related":
      return "similarProducts";
    case "recommended":
      return "youMayAlsoLikeThis";
  }
}

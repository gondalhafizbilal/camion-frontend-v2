import { getCatalogGraphqlToken } from "@/services/auth/guestRegisterServer";
import { fetchProduct } from "@/services/graphql";
import type { GqlProduct } from "@/services/graphql/types/product";
import {
  gqlProductToProductDetailsCenter,
  gqlReviewsToProductReviewRows,
  ratingSummaryFromGqlReviews,
  type ProductReviewListRow,
} from "@/services/graphql/mappers/gqlProductToProductDetails";
import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import type { ProductRatingSummary } from "@/componentsedit/home/ProductCarouselSection";
import { CATALOG_SSR_CURRENCY } from "@/lib/catalog/catalogSsr";
import { PRODUCT_DETAIL_REVALIDATE_SECONDS } from "@/lib/home/homeCacheConfig";
import { unstable_cache } from "next/cache";

export type ShopProductPayload = {
  gql: GqlProduct;
  product: ProductDetailsCenterProduct;
  productName: string;
  categoryName: string | null;
  categorySlug: string | null;
  initialRating: ProductRatingSummary;
  reviewRows: ProductReviewListRow[];
};

const SHOP_PRODUCT_CACHE_KEY_VERSION = "v2-campaign-pdp";

function mapGqlToPayload(
  getProduct: GqlProduct,
  slug: string,
): ShopProductPayload {
  const product = gqlProductToProductDetailsCenter(getProduct);
  const productName = String(product.name ?? slug);
  const primaryCategory = product.categories?.[0];
  return {
    gql: getProduct,
    product,
    productName,
    categoryName: (primaryCategory?.name as string | undefined) ?? null,
    categorySlug: (primaryCategory?.slug as string | undefined) ?? null,
    initialRating: ratingSummaryFromGqlReviews(getProduct.reviews),
    reviewRows: gqlReviewsToProductReviewRows(getProduct.reviews),
  };
}

async function fetchShopProductPayloadOnce(
  locale: string,
  slug: string,
  currencyCode: string,
): Promise<ShopProductPayload | null> {
  const token = await getCatalogGraphqlToken();
  const language = locale === "ar" ? "ar" : "en";
  const { getProduct } = await fetchProduct(
    { slug, language, currency: currencyCode },
    token,
  );
  if (!getProduct) return null;
  return mapGqlToPayload(getProduct, slug);
}

const readCachedShopProduct = unstable_cache(
  async (locale: string, slug: string, currencyCode: string) => {
    return fetchShopProductPayloadOnce(locale, slug, currencyCode);
  },
  ["shop-product-graphql", SHOP_PRODUCT_CACHE_KEY_VERSION],
  {
    revalidate: PRODUCT_DETAIL_REVALIDATE_SECONDS,
    tags: ["catalog-product", "shop-product"],
  },
);

/**
 * Product PDP GraphQL for SSR. Shared catalog token + cache per locale + slug + currency.
 */
export async function loadShopProductGraphql(
  locale: string,
  slug: string,
  currency: string = CATALOG_SSR_CURRENCY.toUpperCase(),
): Promise<ShopProductPayload | null> {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;

  const currencyCode = String(currency || "QAR").toLowerCase();
  return readCachedShopProduct(locale, normalizedSlug, currencyCode);
}

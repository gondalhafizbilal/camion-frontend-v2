import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import { fetchCustomerWishlist } from "./operations/customer";
import { fetchProduct } from "./operations/products";
import { gqlProductToCarouselProduct } from "./mappers/gqlProductToCarousel";
import { gqlWishlistRowToCarouselProduct } from "./mappers/gqlWishlistRowToCarousel";
import type { GqlCustomerWishlistRow } from "./types/customer";

type LoadWishlistOpts = {
  language: string;
  currency: string;
};

function currencyParam(c: string) {
  return String(c || "QAR").toLowerCase();
}

/**
 * Loads the signed-in customer's wishlist and maps each row to {@link CarouselProduct},
 * preferring `getProduct(slug)` for images, price, and default variant id when the product exists.
 */
export async function loadWishlistCarouselProducts(
  opts: LoadWishlistOpts,
  authToken: string | null | undefined,
): Promise<CarouselProduct[]> {
  const language = opts.language === "ar" ? "ar" : "en";
  const currency = currencyParam(opts.currency);

  const { getCustomerWishlist } = await fetchCustomerWishlist(
    { language, currency },
    authToken,
  );
  const rows = (getCustomerWishlist ?? []).filter((r): r is GqlCustomerWishlistRow =>
    Boolean(r && typeof r.uuid === "string" && r.product?.slug),
  );

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const slug = row.product!.slug;
      try {
        const { getProduct } = await fetchProduct(
          { slug, language, currency },
          authToken,
        );
        if (getProduct) {
          const card = gqlProductToCarouselProduct(getProduct);
          return { ...card, wishlistEntryUuid: row.uuid } as CarouselProduct;
        }
      } catch {
        /* use wishlist-only row */
      }
      return gqlWishlistRowToCarouselProduct(row);
    }),
  );

  return enriched;
}

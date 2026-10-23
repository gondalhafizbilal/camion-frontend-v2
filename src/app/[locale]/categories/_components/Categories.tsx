"use client";
import { Link } from "@/i18n/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "@/componentsedit/StaticImage";
import Cookies from "js-cookie";
import { fetchCategories, fetchProducts } from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import type { GqlCategory } from "@/services/graphql/types/category";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import type { CategoryNavItem } from "@/types/checkoutDisplay";
import {
  PAGE_CONTENT_INNER_CLASS,
  PAGE_SECTION_X_PADDING_CLASS,
} from "@/lib/layout/pageContentLayout";
import ProductGrid, { productGridClassName } from "@/componentsedit/products/ProductGrid";
import { PRODUCT_LIST_MAX_ITEMS_PER_PAGE, hasMoreProductListPages } from "@/services/graphql/constants/productListPageSize";
import {
  CAROUSEL_CARD_HEIGHT_CLASS,
  PRODUCT_GRID_TILE_SHELL_CLASS,
} from "@/lib/styles/carouselCardLayout";
import { localeCurrencyCacheKey } from "@/lib/home/homeCarouselClientSync";
import { useProductListSessionRestore } from "@/hooks/useProductListSessionRestore";
import { useGtmItemList } from "@/componentsedit/analytics/gtmDiscovery";

const CATEGORIES_HUB_LIST_ID = "categories-hub";

export default function Categories() {
  const [categories, setCategories] = useState<CategoryNavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations();
  const { currency } = useCurrency();
  const { addToCart: addToCartContext } = useCart();
  const productsPerPage = PRODUCT_LIST_MAX_ITEMS_PER_PAGE;
  const {
    sessionBoot,
    persist,
    clearSession,
    restoreScrollAfterPaint,
    consumeInitialFetchSkip,
    consumePageFetchSkip,
  } = useProductListSessionRestore({
    listId: CATEGORIES_HUB_LIST_ID,
    locale,
    currency,
  });
  const [products, setProducts] = useState<CarouselProduct[]>(
    () => sessionBoot?.products ?? [],
  );
  const [productsLoading, setProductsLoading] = useState(() => !sessionBoot);
  const [productsLoadingMore, setProductsLoadingMore] = useState(false);
  const [productsPage, setProductsPage] = useState(() => sessionBoot?.page ?? 1);
  const [productsHasMore, setProductsHasMore] = useState(
    () => sessionBoot?.hasMore ?? false,
  );
  const prevLocaleCurrencyRef = useRef<string | null>(null);

  // Helper function to decode HTML entities and fix common issues
  const decodeHtml = (html: unknown): string => {
    if (!html || typeof html !== "string") return "";
    // Handle common HTML entities and fix "$amp" issue
    return html
      .replace(/\$amp/g, "&") // Fix "$amp" first
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&apos;/g, "'")
      .trim();
  };

  // Helper function to check if a category is valid
  const isValidCategory = (cat: unknown): cat is CategoryNavItem => {
    if (!cat || typeof cat !== "object") return false;
    const c = cat as CategoryNavItem;
    const name = c.name || "";
    const slug = c.slug || "";

    // Check if name or slug contains invalid patterns (only "$amp" with dollar sign, not "&amp;")
    const invalidPatterns = ["$amp", "undefined", "null", "NaN"];
    const hasInvalidPattern = invalidPatterns.some(
      (pattern) =>
        name.toLowerCase().includes(pattern.toLowerCase()) ||
        slug.toLowerCase().includes(pattern.toLowerCase()),
    );

    if (hasInvalidPattern) return false;

    // Check if name is valid after decoding
    const decodedName = decodeHtml(name);
    if (!decodedName || decodedName.trim() === "" || decodedName.length < 2) {
      return false;
    }

    return true;
  };

  // Helper function to clean and filter categories
  const cleanCategories = (data: unknown): CategoryNavItem[] => {
    if (!Array.isArray(data)) return [];

    // First pass: filter out invalid categories and decode HTML entities
    const cleaned: CategoryNavItem[] = data
      .map((cat: unknown): CategoryNavItem | null => {
        if (!isValidCategory(cat)) return null;

        const decodedName = decodeHtml(cat.name || "");
        const decodedSlug = decodeHtml(cat.slug || "");

        if (!decodedName || decodedName.trim() === "" || decodedName.length < 2) {
          return null;
        }

        const next: CategoryNavItem = {
          ...(cat as CategoryNavItem),
          name: decodedName,
          slug: decodedSlug || (cat as CategoryNavItem).slug,
        };
        return next;
      })
      .filter((c): c is CategoryNavItem => c !== null);

    // Second pass: Remove duplicates based on slug or normalized name
    const uniqueCategories: CategoryNavItem[] = [];
    const seenSlugs = new Set();
    const seenNames = new Set();

    cleaned.forEach((cat) => {
      const slug = (cat.slug || "").toLowerCase().trim();
      const name = (cat.name || "").toLowerCase().trim();

      // Check for duplicates: if slug exists, check slug; otherwise check name
      let isDuplicate = false;

      if (slug && slug.length > 0) {
        // If slug exists, check if we've seen this slug before
        if (seenSlugs.has(slug)) {
          isDuplicate = true;
        } else {
          seenSlugs.add(slug);
        }
      }

      // Also check name for duplicates
      if (name && name.length > 0) {
        if (seenNames.has(name)) {
          isDuplicate = true;
        } else {
          seenNames.add(name);
        }
      }

      // Only add if not a duplicate
      if (!isDuplicate && (slug || name)) {
        uniqueCategories.push(cat);
      }
    });

    return uniqueCategories;
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const language = locale === "ar" ? "ar" : "en";
        const token = Cookies.get("token") ?? null;
        const { getCategories } = await fetchCategories(
          { language, pageNumber: 1, itemsPerPage: 200 },
          token,
        );
        const rows: CategoryNavItem[] = (getCategories ?? []).map((c: GqlCategory) => {
          const thumb = (c.thumbnailUrl ?? "").trim();
          return {
            id: c.uuid,
            uuid: c.uuid,
            slug: c.slug,
            name: c.name ?? c.slug,
            image: thumb ? { thumbnail: thumb, src: thumb } : undefined,
          };
        });
        const cleanedCategories = cleanCategories(rows);
        setCategories(cleanedCategories);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };

    void loadCategories();
  }, [locale]);

  useLayoutEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    if (prevLocaleCurrencyRef.current === null) {
      prevLocaleCurrencyRef.current = key;
      return;
    }
    if (prevLocaleCurrencyRef.current === key) return;
    prevLocaleCurrencyRef.current = key;
    clearSession();
    setProducts([]);
    setProductsPage(1);
    setProductsHasMore(false);
  }, [locale, currency, clearSession]);

  useEffect(() => {
    if (productsLoading || products.length === 0) return;
    persist({ products, page: productsPage, hasMore: productsHasMore });
  }, [products, productsPage, productsHasMore, productsLoading, persist]);

  useEffect(() => {
    if (!productsLoading && !productsLoadingMore) {
      restoreScrollAfterPaint();
    }
  }, [productsLoading, productsLoadingMore, restoreScrollAfterPaint]);

  useEffect(() => {
    const loadProducts = async () => {
      if (productsPage > 1 && consumePageFetchSkip()) {
        return;
      }
      const isFirstPage = productsPage === 1;
      if (isFirstPage) {
        if (consumeInitialFetchSkip()) {
          restoreScrollAfterPaint();
          return;
        }
        setProductsLoading(true);
      } else {
        setProductsLoadingMore(true);
      }
      try {
        const language = locale === "ar" ? "ar" : "en";
        const currencyCode = String(currency || "QAR").toLowerCase();
        const token = Cookies.get("token") ?? null;
        const { getProducts } = await fetchProducts(
          {
            language,
            currency: currencyCode,
            pageNumber: productsPage,
            itemsPerPage: productsPerPage,
          },
          token,
        );
        const list = (getProducts ?? []).map(gqlProductToCarouselProduct);
        setProducts((prev) => (isFirstPage ? list : [...prev, ...list]));
        setProductsHasMore(
          hasMoreProductListPages(list.length, productsPerPage, isFirstPage),
        );
      } catch (error) {
        console.error("Error fetching products for categories page:", error);
        if (isFirstPage) setProducts([]);
        setProductsHasMore(false);
      } finally {
        if (isFirstPage) {
          setProductsLoading(false);
        } else {
          setProductsLoadingMore(false);
        }
      }
    };

    void loadProducts();
  }, [
    locale,
    currency,
    productsPage,
    consumeInitialFetchSkip,
    consumePageFetchSkip,
    restoreScrollAfterPaint,
    productsPerPage,
  ]);

  async function handleAddToCart(product: CarouselProduct) {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCartContext(ref, 1);
  }
  const itemList = {
    itemListId: CATEGORIES_HUB_LIST_ID,
    itemListName: t("allProducts") || "All Products",
  };
  useGtmItemList(products, itemList, !productsLoading);

  if (loading) {
    return (
      <div className={`w-full flex min-h-screen flex-col gap-4 mt-10 ${PAGE_SECTION_X_PADDING_CLASS}`}>
        <div className={PAGE_CONTENT_INNER_CLASS}>
        <div className="p-6 gap-4 grid md:grid-cols-10 grid-cols-3 m-auto min-h-auto ">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse shadow-xl md:w-[120px] md:h-[120px] w-[80px] h-[80px] bg-gray-300 rounded-full"
            ></div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen pb-10 sm:pb-12 lg:pb-14 mt-10 ${PAGE_SECTION_X_PADDING_CLASS}`}>
      <div className={PAGE_CONTENT_INNER_CLASS}>
      <div className="grid grid-cols-3 md:grid-cols-10 gap-6 mt-6">
        {categories.map((category, i) => {
          // Ensure name is cleaned before display
          const displayName = category?.name ? decodeHtml(category.name) : "Category";

          // Skip rendering if name is still invalid after cleaning (only check for "$amp" with dollar sign)
          if (
            !displayName ||
            displayName.trim() === "" ||
            displayName.includes("$amp") ||
            displayName.length < 2
          ) {
            return null;
          }

          return (
            <Link
              href={`/categories/${category?.slug || ""}`}
              passHref
              key={category.id || `category-${i}`}
              className="flex cursor-pointer flex-col items-center text-center gap-2"
            >
              <Image
                src={
                  category.image?.thumbnail ||
                  category.image?.src ||
                  "/assets/images/Laptops.jpg"
                }
                alt={displayName}
                width={120}
                height={120}
                className="md:w-[120px] md:h-[120px] w-[80px] h-[80px] rounded-full shadow-xl object-cover"
                sizes="(min-width: 768px) 120px, 80px"
                unoptimized
                loading="lazy"
              />

              <p className="md:text-sm text-xs font-semibold">{displayName}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">
          {t("allProducts") || "All Products"}
        </h2>
        {productsLoading ? (
          <div className={productGridClassName}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`${PRODUCT_GRID_TILE_SHELL_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS} rounded bg-gray-100 animate-pulse`}
              />
            ))}
          </div>
        ) : (
          <>
            <ProductGrid>
              {products.map((product, index) => (
                <ProductCarouselCard
                  key={`${String(product.id ?? "product")}-${index}`}
                  product={product}
                  onAddToCart={handleAddToCart}
                  itemList={itemList}
                  itemIndex={index}
                />
              ))}
            </ProductGrid>

            {productsHasMore ? (
              <div className="mb-2 mt-8 flex justify-center sm:mb-3 sm:mt-10">
                <button
                  type="button"
                  onClick={() => setProductsPage((p) => p + 1)}
                  disabled={productsLoadingMore}
                  className="min-h-[48px] min-w-[180px] rounded-full border border-[#CB262E] bg-[#CB262E] px-8 py-3 font-sans text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-white hover:text-[#CB262E] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[220px]"
                >
                  {productsLoadingMore ? t("loadingMore") : t("loadMore")}
                </button>
              </div>
            ) : (
              <p className="mb-2 mt-8 text-center font-sans text-sm text-black/45 sm:mb-3 sm:mt-10">
                {t("noMoreProducts")}
              </p>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}

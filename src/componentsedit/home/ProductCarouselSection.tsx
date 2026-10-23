"use client";

import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRODUCT_IMAGE_FALLBACK,
  productImageUrlOrFallback,
} from "@/lib/productImageFallback";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import Cookies from "js-cookie";
import { CAMION_SESSION_UPDATED_EVENT } from "@/services/auth/guestRegister";
import { fetchFeaturedProducts } from "@/services/graphql";
import { fetchThisMonthProducts } from "@/lib/home/thisMonthProducts";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { useWishlistProductIds } from "@/componentsedit/context/WishlistProductIdsContext";
import { resolveProductUuidForWishlist } from "@/services/wishlist/addProductToWishlist";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import { HOME_CONTENT_INNER_CLASS, HOME_SECTION_X_PADDING_CLASS } from "@/componentsedit/home/homeSectionLayout";
import {
  canUseHomeCarouselSsrSeed,
  localeCurrencyCacheKey,
} from "@/lib/home/homeCarouselClientSync";
import { buildShopCollectionHref } from "@/lib/shop/shopCollection";
import {
  buildProductDetailHref,
  resolveListingVariantUuid,
} from "@/lib/productDetailHref";
import {
  EcommerceMotionButton,
  EcommerceMotionLink,
} from "@/componentsedit/buttons/EcommerceMotionButton";
import {
  CAROUSEL_CARD_HEIGHT_CLASS,
  CAROUSEL_CARD_IMAGE_FLEX_CLASS,
  CAROUSEL_CARD_IMAGE_SIZES,
  CAROUSEL_CARD_MEDIA_STACK_CLASS,
  CAROUSEL_CARD_BODY_GAP_CLASS,
  CAROUSEL_CARD_SHELL_CLASS,
  CAROUSEL_CARD_WIDTH_CLASS,
  CAROUSEL_TRACK_LOADING_CLASS,
} from "@/lib/styles/carouselCardLayout";
import ProductCarouselTrack from "@/componentsedit/home/ProductCarouselTrack";
import ProductCarouselPriceRow from "@/componentsedit/home/ProductCarouselPriceRow";
import ProductCampaignBarSlot from "@/componentsedit/products/ProductCampaignBarSlot";
import ProductCardFavouritesUrgencyRow from "@/componentsedit/products/ProductCardFavouritesUrgencyRow";
import { resolveProductUrgencyCount } from "@/lib/product/resolveProductUrgencyCount";
import {
  trackGtmSelectItem,
  useGtmItemList,
  type GtmItemListContext,
} from "@/componentsedit/analytics/gtmDiscovery";

export type CarouselProductCampaign = {
  uuid?: string;
  name?: string | null;
  brief?: string | null;
  slug?: string | null;
  discountPercentage?: number | string | null;
  startsAt?: string | null;
  finishesAt?: string | null;
};

export type CarouselProduct = {
  id?: string | number;
  /** Catalog product UUID for wishlist API (distinct from variant `id` when variants exist). */
  productUuid?: string;
  /** Variant UUID used for list/card image & price (first variant from GraphQL list). */
  variantUuid?: string;
  name?: string;
  slug?: string;
  on_sale?: boolean;
  average_rating?: number;
  rating?: number;
  rating_count?: number;
  reviews_count?: number;
  /** Total likes count (from GraphQL `likesCount`). */
  likes_count?: number | string | null;
  /** Fake urgency stock count for card badge (display only). */
  urgency_count?: number | string | null;
  variations?: unknown[];
  images?: Array<{ thumbnail?: string; src?: string }>;
  prices?: {
    regular_price?: string | number;
    sale_price?: string | number;
    price?: string | number;
    currency_code?: string;
  };
  campaign?: CarouselProductCampaign | null;
  [key: string]: unknown;
};

export type ProductRatingSummary = { average: number; count: number };

const STAR_COLOR = "#F7C95F";
const STAR_EMPTY = "rgba(0,0,0,0.15)";

export function StarIcon({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="flex-shrink-0"
      aria-hidden
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? STAR_COLOR : STAR_EMPTY}
        stroke={filled ? "transparent" : "rgba(0,0,0,0.2)"}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarDisplay({
  average = 0,
  count = 0,
  size = 14,
}: {
  average?: number;
  count?: number;
  size?: number;
}) {
  const avg = Number(average) || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(<StarIcon key={i} filled={avg >= i} size={size} />);
  }
  return (
    <div className="flex items-center gap-0.5">
      {stars}
      {count > 0 && (
        <span
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 10.04,
            lineHeight: "14px",
            color: "rgba(0,0,0,0.6)",
            marginInlineStart: 2,
          }}
        >
          ({count})
        </span>
      )}
    </div>
  );
}

const SECTION_GAP = 39.73;

const CLIENT_CAROUSEL_RETRY_ATTEMPTS = 3;
const CLIENT_CAROUSEL_RETRY_DELAY_MS = 450;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const decodeHtml = (html: unknown) => {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/\$amp/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
};

function WishlistHeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      style={{ color: "#CB262E" }}
      aria-hidden
    >
      <path
        d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavouritesRow({
  likesCount,
  urgencyCount,
  className = "",
}: {
  likesCount: unknown;
  urgencyCount?: number | string | null;
  className?: string;
}) {
  return (
    <ProductCardFavouritesUrgencyRow
      likesCount={likesCount}
      urgencyCount={urgencyCount}
      className={className}
    />
  );
}

export function ProductCarouselCard({
  product,
  rating,
  onAddToCart,
  showWishlistHeart = true,
  itemList,
  itemIndex,
}: {
  product: CarouselProduct;
  rating?: ProductRatingSummary;
  onAddToCart?: (product: CarouselProduct) => void | Promise<void>;
  /** When false, hides the wishlist heart (e.g. on the wishlist page). */
  showWishlistHeart?: boolean;
  itemList?: GtmItemListContext;
  itemIndex?: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { toggleWishlist, isWishlisted } = useWishlistProductIds();
  const wishlistProductId = resolveProductUuidForWishlist(product);
  const wishlistFilled = Boolean(wishlistProductId && isWishlisted(wishlistProductId));

  const resolvedImg = productImageUrlOrFallback(
    product?.images?.[0]?.thumbnail || product?.images?.[0]?.src || "",
  );
  const [imgSrc, setImgSrc] = useState(resolvedImg);
  useEffect(() => {
    setImgSrc(resolvedImg);
  }, [resolvedImg, product?.id, product?.slug]);

  const name = decodeHtml(product?.name || "Product");
  const prices = product?.prices || {};
  const regular = prices?.regular_price;
  const sale = prices?.sale_price;
  const displayPrice = prices?.price ?? sale ?? regular;
  const onSale =
    Boolean(product?.on_sale) ||
    (Number(sale) > 0 && Number(regular) > 0 && Number(sale) < Number(regular));
  const discountPercent =
    onSale && Number(regular) > 0
      ? Math.round((1 - Number(sale || displayPrice) / Number(regular)) * 100)
      : 0;
  const href = buildProductDetailHref(
    product?.slug,
    resolveListingVariantUuid(product),
    product?.productUuid,
  );
  const avg = rating?.average ?? product?.average_rating ?? product?.rating ?? 0;
  const reviewCount =
    rating?.count ?? product?.rating_count ?? product?.reviews_count ?? 0;
  const hasVariations = product?.variations && product.variations.length > 0;
  const likesCount = product?.likes_count;
  const campaign = product?.campaign;
  const urgencyCount = resolveProductUrgencyCount(product);

  return (
    <div
      data-carousel-card
      className={CAROUSEL_CARD_SHELL_CLASS}
    >
      <div className={CAROUSEL_CARD_MEDIA_STACK_CLASS}>
        <Link
          href={href}
          onClick={() => trackGtmSelectItem(product, itemList, itemIndex)}
          className={`group/card relative block w-full min-h-0 ${CAROUSEL_CARD_IMAGE_FLEX_CLASS}`}
        >
          <div className="relative h-full w-full overflow-hidden rounded-t-[8px] bg-white">
            <Image
              src={imgSrc}
              alt={name}
              width={250}
              height={250}
              className="size-full max-w-none object-contain object-bottom"
              sizes={CAROUSEL_CARD_IMAGE_SIZES}
              unoptimized
              loading="lazy"
              onError={() => setImgSrc(PRODUCT_IMAGE_FALLBACK)}
            />
          </div>
          {showWishlistHeart ? (
            <EcommerceMotionButton
              type="button"
              variant="wishlist"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return toggleWishlist(product);
              }}
              className="absolute end-[8.14px] top-[8.6px] z-10 h-[24.37px] w-[24.37px] shrink-0 rounded-full p-0 text-[#CB262E]"
              surfaceClassName="rounded-full bg-black/10 hover:bg-[#CB262E]/15"
              aria-label={wishlistFilled ? t("removeFromWishlist") : t("addToWishlist")}
            >
              <WishlistHeartIcon filled={wishlistFilled} />
            </EcommerceMotionButton>
          ) : null}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-[8px] opacity-0 transition-opacity duration-200 group-hover/card:opacity-100"
            style={{
              height: 29.39,
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 11.47,
              lineHeight: "17px",
            }}
          >
            {hasVariations ? (
              <EcommerceMotionLink
                href={href}
                onClick={(e) => {
                  e.stopPropagation();
                  trackGtmSelectItem(product, itemList, itemIndex);
                }}
                className="h-full w-full"
                surfaceClassName="rounded-b-[8px] bg-[#F5F5F5] group-hover/card:bg-[#CB262E]"
                style={{ minHeight: 29.39 }}
              >
                <span className="flex h-full w-full items-center justify-center text-gray-700 group-hover/card:text-white">
                  {t("selectOptions")}
                </span>
              </EcommerceMotionLink>
            ) : (
              <EcommerceMotionButton
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return onAddToCart?.(product);
                }}
                className="h-full w-full text-white"
                surfaceClassName="rounded-b-[8px] bg-[#CB262E]"
                style={{ minHeight: 29.39 }}
              >
                {t("addToCart")}
              </EcommerceMotionButton>
            )}
          </div>
        </Link>
        <ProductCampaignBarSlot campaign={campaign} />
      </div>
      <div
        className={`flex flex-1 flex-col bg-white p-2 pb-2 sm:p-[9.38px] ${CAROUSEL_CARD_BODY_GAP_CLASS}`}
      >
        <Link
          href={href}
          onClick={() => trackGtmSelectItem(product, itemList, itemIndex)}
          className="mb-0 block min-h-[42px] min-w-0 sm:min-h-[45px] lg:min-h-[51px]"
        >
          <span
            className="font-semibold text-black capitalize line-clamp-3 break-words text-[11px] leading-[14px] sm:text-[12px] sm:leading-[15px] lg:text-[13px] lg:leading-[17px]"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {name}
          </span>
        </Link>
        <FavouritesRow
          likesCount={likesCount}
          urgencyCount={urgencyCount}
          className="h-[14px]"
        />
        <div className="flex h-[14px] items-center gap-[2.35px] leading-[14px]">
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 10.04,
              lineHeight: "14px",
              color: "#000",
            }}
          >
            {Number(avg) > 0 ? Number(avg).toFixed(1) : "0"}
          </span>
          <StarDisplay average={Number(avg)} count={reviewCount} size={14} />
          {reviewCount === 0 && Number(avg) === 0 && (
            <span
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 10.04,
                lineHeight: "14px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              {t("reviews") || "Reviews"}
            </span>
          )}
        </div>
        <div className="min-h-[20px]">
          <ProductCarouselPriceRow
          onSale={onSale}
          discountPercent={discountPercent}
          displayPrice={displayPrice}
          regularPrice={regular}
          locale={locale}
          currencyCode={prices?.currency_code || currency || "QAR"}
        />
        </div>
      </div>
    </div>
  );
}

export type ProductCarouselListSource = "featured" | "recent";

export default function ProductCarouselSection({
  titleKey = "topProducts",
  productPage = 1,
  listSource = "featured",
  initialProducts,
}: {
  titleKey?: string;
  productPage?: number;
  /** `featured` = GetFeaturedProducts; `recent` = recently viewed with popular fallback (home SSR). */
  listSource?: ProductCarouselListSource;
  /** When set (e.g. GraphQL `getFeaturedProducts`), skips REST product list fetch. */
  initialProducts?: CarouselProduct[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<CarouselProduct[]>(
    () => initialProducts ?? [],
  );
  const [loading, setLoading] = useState(() => initialProducts === undefined);
  const ssrSeedRef = useRef<CarouselProduct[]>(initialProducts ?? []);
  const localeCurrencySeenRef = useRef<string | null>(null);

  useEffect(() => {
    ssrSeedRef.current = initialProducts ?? [];
  }, [initialProducts]);

  const fetchProducts = useCallback(async () => {
    const language = locale === "ar" ? "ar" : "en";
    const cur = String(currency || "QAR").toLowerCase();
    const token = Cookies.get("token") ?? null;
    const retryOnEmptyList = listSource !== "recent";
    const maxAttempts = retryOnEmptyList ? CLIENT_CAROUSEL_RETRY_ATTEMPTS : 1;
    let last: CarouselProduct[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (listSource === "recent") {
          const monthProducts = await fetchThisMonthProducts(
            { language, currency: cur, pageNumber: 1, itemsPerPage: 10 },
            token,
          );
          last = monthProducts.map(gqlProductToCarouselProduct);
        } else {
          const { getFeaturedProducts } = await fetchFeaturedProducts(
            {
              language,
              currency: cur,
              pageNumber: productPage,
              itemsPerPage: 10,
            },
            token,
          );
          last = (getFeaturedProducts ?? []).map(gqlProductToCarouselProduct);
        }
        if (last.length > 0 || !retryOnEmptyList) break;
      } catch {
        /* retry for featured; for recent fall through */
      }
      if (attempt < maxAttempts) {
        await sleep(CLIENT_CAROUSEL_RETRY_DELAY_MS);
      }
    }

    if (last.length > 0) {
      setProducts(last);
    } else {
      setProducts((prev) =>
        prev.length > 0 ? prev : ssrSeedRef.current.length > 0 ? ssrSeedRef.current : [],
      );
    }
    setLoading(false);
  }, [locale, currency, productPage, listSource]);

  useEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    const prev = localeCurrencySeenRef.current;
    const forceClientFetch = listSource === "recent";
    if (prev === null) {
      localeCurrencySeenRef.current = key;
      if (
        canUseHomeCarouselSsrSeed({
          initialProductCount: initialProducts?.length ?? 0,
          currency,
          forceClientFetch,
        })
      ) {
        setLoading(false);
        return;
      }
      setLoading(true);
      void fetchProducts();
      return;
    }
    if (prev !== key) {
      localeCurrencySeenRef.current = key;
      setLoading(true);
      void fetchProducts();
    }
  }, [locale, currency, fetchProducts, initialProducts, listSource]);

  useEffect(() => {
    if (listSource !== "recent" || typeof window === "undefined") return;
    const onSession = () => {
      void fetchProducts();
    };
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
    return () => window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  }, [listSource, fetchProducts]);

  const handleAddToCart = async (product: CarouselProduct) => {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCart(ref, 1);
  };

  const viewAllHref =
    listSource === "featured"
      ? buildShopCollectionHref("featured")
      : listSource === "recent"
        ? buildShopCollectionHref("thisMonth")
        : "/shop";
  const itemList = {
    itemListId: `home-${listSource}-${titleKey}`,
    itemListName: t(titleKey),
  };
  useGtmItemList(products, itemList, !loading);

  if (loading) {
    return (
      <section
        className={`w-full flex justify-center pt-8 pb-2 ${HOME_SECTION_X_PADDING_CLASS}`}
      >
        <div className={HOME_CONTENT_INNER_CLASS}>
          <div
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ marginBottom: SECTION_GAP }}
          >
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full sm:w-[161px] bg-gray-200 rounded animate-pulse" />
          </div>
          <div className={CAROUSEL_TRACK_LOADING_CLASS}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`${CAROUSEL_CARD_WIDTH_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS} bg-gray-100 rounded animate-pulse`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section
      className={`w-full flex justify-center pt-8 pb-2 ${HOME_SECTION_X_PADDING_CLASS}`}
    >
      <div
        className={`${HOME_CONTENT_INNER_CLASS} flex flex-col`}
        style={{ gap: SECTION_GAP }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-10">
          <div className="flex flex-row items-center gap-3 sm:gap-4 min-h-10">
            <span
              className="flex-shrink-0 rounded-[4px] w-4 h-9 sm:w-5 sm:h-10"
              style={{ background: "#CB262E" }}
            />
            <span
              className="text-lg sm:text-xl leading-tight"
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                color: "#000000",
              }}
            >
              {t(titleKey)}
            </span>
          </div>
          <Link
            href={viewAllHref}
            className="flex items-center justify-center flex-shrink-0 rounded-[4px] text-[#FAFAFA] hover:opacity-90 transition-opacity w-full sm:w-auto min-h-10 px-6 sm:px-8 lg:px-12 whitespace-nowrap"
            style={{
              minWidth: "min(100%, 161px)",
              background: "#CB262E",
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: "24px",
            }}
          >
            {t("viewAllProducts")}
          </Link>
        </div>

        <ProductCarouselTrack>
          {products.map((p, index) => (
            <ProductCarouselCard
              key={p?.id || p?.slug || p?.name}
              product={p}
              rating={undefined}
              onAddToCart={handleAddToCart}
              itemList={itemList}
              itemIndex={index}
            />
          ))}
        </ProductCarouselTrack>
      </div>
    </section>
  );
}

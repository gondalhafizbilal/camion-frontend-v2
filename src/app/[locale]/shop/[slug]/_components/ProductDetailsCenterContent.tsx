"use client";

import Cookies from "js-cookie";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Roadmap from "@/componentsedit/Roadmap";
import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import ProductVariantNamingSection from "./ProductVariantNamingSection";
import DeliveryReturnCard from "./DeliveryReturnCard";
import PaymentMethods from "./PaymentMethods";
import ProductShippingSection from "./ProductShippingSection";
import ProductCommitmentsSection from "./ProductCommitmentsSection";
import ProductPhotoGallery from "./ProductPhotoGallery";
import ProductDetailsSection from "./ProductDetailsSection";
import ProductReviewsSection from "./ProductReviewsSection";
import {
  gqlProductToProductDetailsCenter,
  gqlReviewsToProductReviewRows,
  ratingSummaryFromGqlReviews,
  type ProductReviewListRow,
} from "@/services/graphql/mappers/gqlProductToProductDetails";
import ProductBundlesSection from "./ProductBundlesSection";
import SimilarProductsSection from "./SimilarProductsSection";
import YouMayAlsoLikeSection from "./YouMayAlsoLikeSection";
import { EcommerceMotionButton } from "@/componentsedit/buttons/EcommerceMotionButton";
import ReportProductModal from "./ReportProductModal";
import type {
  CarouselProduct,
  ProductRatingSummary,
} from "@/componentsedit/home/ProductCarouselSection";
import { useWishlistProductIds } from "@/componentsedit/context/WishlistProductIdsContext";
import { resolveProductUuidForWishlist } from "@/services/wishlist/addProductToWishlist";
//import { buildProductDetailCards } from "../_lib/buildProductDetailCards";
import { fetchProduct } from "@/services/graphql";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import {
  ensureGuestSessionIfNeeded,
  waitForClientAuthToken,
} from "@/services/auth/guestRegister";
import { buildProductDetailBreadcrumbs } from "@/lib/productBreadcrumbs";
import {
  canUseCatalogSsrSeed,
  localeCurrencyCacheKey,
} from "@/lib/home/homeCarouselClientSync";
import { useFacebookViewContent } from "@/componentsedit/analytics/useFacebookViewContent";
import { useTikTokViewContent } from "@/componentsedit/analytics/useTikTokViewContent";
import { useGtmViewItem } from "@/componentsedit/analytics/gtmDiscovery";
import { PAGE_CONTENT_INNER_CLASS } from "@/lib/layout/pageContentLayout";

const PDP_CLIENT_FETCH_ATTEMPTS = 3;
const PDP_CLIENT_FETCH_RETRY_MS = 450;

type ProductDetailsCenterContentProps = {
  slug?: string;
  productName?: string;
  categoryName?: string;
  categorySlug?: string;
  product?: ProductDetailsCenterProduct | null;
  initialRating?: ProductRatingSummary | null;
  initialReviewRows?: ProductReviewListRow[] | null;
};

const ProductDetailsCenterContent = ({
  slug,
  productName,
  categoryName,
  categorySlug,
  product,
  initialRating = null,
  initialReviewRows = null,
}: ProductDetailsCenterContentProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { currency } = useCurrency();
  const { toggleWishlist, isWishlisted } = useWishlistProductIds();
  const [activeGallerySrc, setActiveGallerySrc] = useState<string | null>(null);
  const [activeVariantUuid, setActiveVariantUuid] = useState<string | null>(null);

  const [displayProduct, setDisplayProduct] =
    useState<ProductDetailsCenterProduct | null>(() => product ?? null);
  const [displayRating, setDisplayRating] = useState<ProductRatingSummary | null>(
    () => initialRating ?? null,
  );
  const [displayReviewRows, setDisplayReviewRows] = useState<ProductReviewListRow[]>(
    () => initialReviewRows ?? [],
  );
  const [isResolvingProduct, setIsResolvingProduct] = useState(
    () => !product && Boolean((slug || "").trim()),
  );
  const displayProductRef = useRef(product ?? null);
  displayProductRef.current = displayProduct;
  const localeCurrencySeenRef = useRef<string | null>(null);
  const lastSyncedSlugRef = useRef((slug || "").trim());

  const galleryImagesKey = useMemo(() => {
    const imgs = displayProduct?.images ?? [];
    return imgs
      .map((im) => String(im?.src ?? im?.thumbnail ?? "").trim())
      .filter(Boolean)
      .join("|");
  }, [displayProduct?.images]);

  const galleryImagesKeyRef = useRef<string | null>(null);

  /** Listing → PDP: apply `?variant=` image/price before option UI resolves (incl. simple products). */
  useEffect(() => {
    const variantUuid = String(searchParams?.get("variant") ?? "").trim();
    if (!variantUuid || !displayProduct) return;

    const variations = Array.isArray(displayProduct.variations)
      ? (displayProduct.variations as Array<{
          id?: string | number;
          image?: { src?: string; thumbnail?: string };
        }>)
      : [];
    const match = variations.find((v) => String(v?.id ?? "").trim() === variantUuid);
    if (!match) return;

    setActiveVariantUuid(variantUuid);
    const imgSrc = String(match?.image?.src ?? match?.image?.thumbnail ?? "").trim();
    if (imgSrc) setActiveGallerySrc(imgSrc);
  }, [searchParams, displayProduct]);

  /** Clear variant override when gallery URLs change (e.g. currency refetch), not on first paint. */
  useEffect(() => {
    const prev = galleryImagesKeyRef.current;
    galleryImagesKeyRef.current = galleryImagesKey;
    if (prev != null && prev !== galleryImagesKey) {
      setActiveGallerySrc(null);
    }
  }, [galleryImagesKey]);

  useEffect(() => {
    const slugKey = (slug || "").trim();
    const slugChanged = lastSyncedSlugRef.current !== slugKey;
    lastSyncedSlugRef.current = slugKey;

    if (slugChanged) {
      localeCurrencySeenRef.current = null;
    }

    if (product && (slugChanged || canUseCatalogSsrSeed(true, currency))) {
      setDisplayProduct(product);
      setDisplayRating(initialRating ?? null);
      setDisplayReviewRows(initialReviewRows ?? []);
      setIsResolvingProduct(false);
      return;
    }

    if (!product && slugKey) {
      setIsResolvingProduct(true);
    }
  }, [product, initialRating, initialReviewRows, slug, currency]);

  /** Register PDP visit on the visitor token (SSR catalog token is not per-browser). */
  useEffect(() => {
    const s = (slug || "").trim();
    if (!s) return;
    let cancelled = false;
    (async () => {
      void ensureGuestSessionIfNeeded();
      const token = await waitForClientAuthToken({
        maxWaitMs: 4_000,
        pollIntervalMs: 80,
      });
      if (cancelled || !token) return;
      const language = locale === "ar" ? "ar" : "en";
      const cur = String(currency || "QAR").toLowerCase();
      try {
        await fetchProduct({ slug: s, language, currency: cur }, token);
      } catch {
        /* recently-viewed registration is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, locale, currency]);

  const fetchProductForCurrency = useCallback(async () => {
    const s = (slug || "").trim();
    if (!s) return;

    const showLoading = !displayProductRef.current;
    if (showLoading) setIsResolvingProduct(true);

    try {
      void ensureGuestSessionIfNeeded();
      await waitForClientAuthToken({ maxWaitMs: 4_000, pollIntervalMs: 80 });

      const language = locale === "ar" ? "ar" : "en";
      const cur = String(currency || "QAR").toLowerCase();

      for (let attempt = 1; attempt <= PDP_CLIENT_FETCH_ATTEMPTS; attempt++) {
        const token = Cookies.get("token") ?? null;
        const { getProduct } = await fetchProduct(
          { slug: s, language, currency: cur },
          token,
        );
        if (getProduct) {
          setDisplayProduct(gqlProductToProductDetailsCenter(getProduct));
          setDisplayRating(ratingSummaryFromGqlReviews(getProduct.reviews));
          setDisplayReviewRows(gqlReviewsToProductReviewRows(getProduct.reviews));
          return;
        }
        if (attempt < PDP_CLIENT_FETCH_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, PDP_CLIENT_FETCH_RETRY_MS));
        }
      }
    } catch (e) {
      console.error("[product PDP] client fetch failed:", e);
    } finally {
      if (showLoading) setIsResolvingProduct(false);
    }
  }, [slug, locale, currency]);

  useEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    const prev = localeCurrencySeenRef.current;
    if (prev === null) {
      localeCurrencySeenRef.current = key;
      if (canUseCatalogSsrSeed(Boolean(product), currency)) {
        setIsResolvingProduct(false);
        return;
      }
      void fetchProductForCurrency();
      return;
    }
    if (prev !== key) {
      localeCurrencySeenRef.current = key;
      void fetchProductForCurrency();
    }
  }, [locale, currency, product, fetchProductForCurrency]);

  const variantUuidForPixel = useMemo(() => {
    const fromUrl = String(searchParams?.get("variant") ?? "").trim();
    return String(activeVariantUuid ?? fromUrl).trim() || null;
  }, [searchParams, activeVariantUuid]);

  useFacebookViewContent({
    enabled: Boolean(displayProduct) && !isResolvingProduct,
    product: displayProduct,
    slug,
    variantUuid: variantUuidForPixel,
    currency: String(currency || "QAR"),
  });

  useTikTokViewContent({
    enabled: Boolean(displayProduct) && !isResolvingProduct,
    product: displayProduct,
    slug,
    variantUuid: variantUuidForPixel,
    currency: String(currency || "QAR"),
  });
  useGtmViewItem({
    enabled: Boolean(displayProduct) && !isResolvingProduct,
    product: displayProduct,
    slug,
    variantUuid: variantUuidForPixel,
    currency: String(currency || "QAR"),
  });

  const wishlistCarouselProduct = useMemo((): CarouselProduct => {
    const p = displayProduct;
    const productUuid = typeof p?.productUuid === "string" ? p.productUuid : undefined;
    const pslug = typeof p?.slug === "string" ? p.slug : undefined;
    const fallbackVariantId = Array.isArray(p?.variations)
      ? String((p.variations as Array<{ id?: unknown }>)[0]?.id ?? "").trim()
      : "";
    const variantUuid =
      String(activeVariantUuid ?? "").trim() || fallbackVariantId || undefined;
    return {
      // `id` is treated as the variant UUID in wishlist/cart helpers.
      id: variantUuid || p?.id,
      productUuid,
      variantUuid,
      name: p?.name,
      slug: pslug,
      images: p?.images,
      prices: p?.prices as CarouselProduct["prices"],
      variations: p?.variations as CarouselProduct["variations"],
    };
  }, [displayProduct, activeVariantUuid]);

  const wishlistProductUuid = resolveProductUuidForWishlist(wishlistCarouselProduct);
  const wishlistActive = Boolean(
    wishlistProductUuid && isWishlisted(wishlistProductUuid),
  );
  const [showReportModal, setShowReportModal] = useState(false);

  // const detailCards = useMemo(
  //   () => (displayProduct ? buildProductDetailCards(displayProduct, t) : []),
  //   [displayProduct, t],
  // );

  const breadcrumbItems = useMemo(() => {
    const cat = displayProduct?.categories?.[0];
    return buildProductDetailBreadcrumbs({
      t,
      productName: displayProduct?.name ?? productName,
      productSlug: slug,
      category: {
        name: categoryName ?? cat?.name,
        slug: categorySlug ?? cat?.slug,
      },
    });
  }, [
    t,
    displayProduct?.name,
    displayProduct?.categories,
    productName,
    slug,
    categoryName,
    categorySlug,
  ]);

  if (isResolvingProduct) {
    return (
      <div className="w-full min-w-0 overflow-x-hidden px-4 pt-5 pb-8 sm:pt-6 md:px-8 md:pb-10 lg:px-10">
        <div className={PAGE_CONTENT_INNER_CLASS}>
          <div className="min-w-0 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0">
            <Roadmap items={breadcrumbItems} />
          </div>
          <p className="mt-6 font-sans text-black md:mt-8">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!displayProduct) {
    return (
      <div className="w-full min-w-0 overflow-x-hidden px-4 pt-5 pb-8 sm:pt-6 md:px-8 md:pb-10 lg:px-10">
        <div className={PAGE_CONTENT_INNER_CLASS}>
          <div className="min-w-0 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0">
            <Roadmap items={breadcrumbItems} />
          </div>
          <p className="mt-6 font-sans text-black md:mt-8">{t("productNotFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-x-hidden px-4 pt-5 pb-8 sm:pt-6 md:px-8 md:pb-10 lg:px-10">
      <div className={PAGE_CONTENT_INNER_CLASS}>
        <div className="min-w-0 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0">
          <Roadmap items={breadcrumbItems} />
        </div>
        {/* Mobile: stack. Tablet (md): 2-col gallery + info. Desktop (lg): 3-col grid fills wide viewports */}
        <div className="mt-6 flex min-w-0 flex-col items-stretch gap-6 md:mt-8 md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:items-start md:gap-6 lg:grid-cols-[minmax(0,clamp(380px,32vw,540px))_minmax(0,1fr)_240px] lg:gap-8 xl:gap-10">
          <ProductPhotoGallery
            images={displayProduct?.images || []}
            productName={displayProduct?.name}
            activeSrc={activeGallerySrc ?? undefined}
            campaign={displayProduct?.campaign ?? null}
          />
          <div className="flex min-w-0 w-full flex-col gap-6 md:gap-8 lg:contents">
            <div className="min-w-0 w-full">
              <ProductVariantNamingSection
                product={displayProduct}
                initialRating={displayRating ?? undefined}
                onVariantImageChange={setActiveGallerySrc}
                onVariantUuidChange={setActiveVariantUuid}
              />
            </div>
            <div className="flex w-full min-w-0 flex-col items-stretch gap-5 sm:gap-6 lg:flex-shrink-0">
              <DeliveryReturnCard />
              <EcommerceMotionButton
                type="button"
                disabled={!wishlistProductUuid}
                onClick={() => toggleWishlist(wishlistCarouselProduct)}
                className={
                  wishlistActive
                    ? "flex min-h-[48px] w-full flex-row items-center justify-center gap-2.5 rounded px-6 py-2 font-sans text-base font-semibold leading-6 text-[#CB262E] md:min-h-[50px] md:py-0 disabled:cursor-not-allowed disabled:opacity-50"
                    : "flex min-h-[48px] w-full flex-row items-center justify-center gap-2.5 rounded px-6 py-2 font-sans text-base font-semibold leading-6 text-[#FAFAFA] md:min-h-[50px] md:py-0 disabled:cursor-not-allowed disabled:opacity-50"
                }
                surfaceClassName={
                  wishlistActive
                    ? "rounded border-2 border-[#CB262E] bg-white"
                    : "rounded bg-[#CB262E]"
                }
              >
                <svg
                  width={32}
                  height={32}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={wishlistActive ? "#CB262E" : "#FAFAFA"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  aria-hidden
                >
                  <path
                    d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"
                    fill={wishlistActive ? "#CB262E" : "none"}
                  />
                </svg>
                <span className="shrink-0">
                  {wishlistActive ? t("removeFromWishlist") : t("addToWishlist")}
                </span>
              </EcommerceMotionButton>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="ml-2 inline-flex items-center gap-2 rounded border border-[#CB262E] bg-white px-3 py-2 text-sm font-medium text-[#CB262E] hover:bg-[#FBF4F4]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#CB262E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 2v6" />
                  <path d="M12 14v8" />
                  <path d="M5 7h14" />
                  <path d="M5 17h14" />
                </svg>
                <span>{t("reportProductButton")}</span>
              </button>
              <ReportProductModal
                open={showReportModal}
                productUuid={displayProduct.productUuid ?? displayProduct.id}
                onClose={() => setShowReportModal(false)}
              />
              <PaymentMethods />
              <ProductShippingSection
                productId={displayProduct.productUuid ?? displayProduct.id}
                variantId={activeVariantUuid}
                category={displayProduct.categories?.[0]?.name}
              />
              <ProductCommitmentsSection />
            </div>
          </div>
        </div>
        <ProductDetailsSection
          description={
            displayProduct?.description || displayProduct?.short_description || ""
          }
          attachments={displayProduct?.attachments || []}
          //  cards={detailCards}
        />
        <ProductReviewsSection
          initialReviewRows={displayReviewRows}
          productId={displayProduct.productUuid ?? displayProduct.id}
          variantId={activeVariantUuid}
          category={displayProduct.categories?.[0]?.name}
        />
        <ProductBundlesSection
          productUuid={displayProduct.productUuid ?? displayProduct.id}
          productVariantUuid={activeVariantUuid}
        />
        <SimilarProductsSection productSlug={slug} />
        <YouMayAlsoLikeSection productSlug={slug} />
      </div>
    </div>
  );
};

export default ProductDetailsCenterContent;

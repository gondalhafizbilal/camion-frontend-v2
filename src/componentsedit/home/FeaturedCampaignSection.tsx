"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import Cookies from "js-cookie";
import {
  fetchProductsInFeaturedCampaign,
  PRODUCT_SEARCH_SORT,
} from "@/services/graphql";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import {
  ProductCarouselCard,
  type CarouselProduct,
  type CarouselProductCampaign,
} from "@/componentsedit/home/ProductCarouselSection";
import { carouselProductToCartRef } from "@/services/cart/cartItemsApi";
import CampaignSectionHeader from "@/componentsedit/campaign/CampaignSectionHeader";
import { HOME_CONTENT_INNER_CLASS, HOME_SECTION_X_PADDING_CLASS } from "@/componentsedit/home/homeSectionLayout";
import {
  buildCampaignCollectionHref,
  resolveCampaignFromProducts,
} from "@/lib/campaign/campaignCollection";
import {
  canUseHomeCarouselSsrSeed,
  localeCurrencyCacheKey,
} from "@/lib/home/homeCarouselClientSync";
import {
  CAROUSEL_CARD_HEIGHT_CLASS,
  CAROUSEL_CARD_WIDTH_CLASS,
  CAROUSEL_TRACK_LOADING_CLASS,
} from "@/lib/styles/carouselCardLayout";
import ProductCarouselTrack from "@/componentsedit/home/ProductCarouselTrack";
import { CAMPAIGN_HEADER_GRADIENT } from "@/lib/styles/campaignGradient";
import { forwardArrowGlyph } from "@/lib/i18n/forwardArrow";
import { useGtmItemList } from "@/componentsedit/analytics/gtmDiscovery";

const SECTION_GAP = 24;
const CLIENT_CAROUSEL_RETRY_ATTEMPTS = 3;
const CLIENT_CAROUSEL_RETRY_DELAY_MS = 450;
const FONT = "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveSectionCampaign(
  products: CarouselProduct[],
  fallbackTitle: string,
): CarouselProductCampaign {
  const resolved = resolveCampaignFromProducts(products);
  return {
    uuid: resolved?.uuid,
    name: resolved?.name?.trim() || fallbackTitle,
    brief: resolved?.brief ?? null,
    slug: resolved?.slug ?? null,
    discountPercentage: resolved?.discountPercentage ?? null,
    startsAt: resolved?.startsAt ?? null,
    finishesAt: resolved?.finishesAt ?? null,
  };
}

function CampaignSectionShell({
  campaign,
  fallbackTitle,
  brief,
  discoverMoreHref,
  discoverMoreLabel,
  locale,
  children,
}: {
  campaign: CarouselProductCampaign;
  fallbackTitle: string;
  brief: string;
  discoverMoreHref: string | null;
  discoverMoreLabel: string;
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#FAFAFA]">
      <CampaignSectionHeader campaign={campaign} fallbackTitle={fallbackTitle} />
      {brief || discoverMoreHref ? (
        <div className="flex flex-col gap-3 border-b border-black/[0.06] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
          {brief ? (
            <p
              className="m-0 min-w-0 text-sm leading-snug text-gray-600 sm:text-[15px]"
              style={{ fontFamily: FONT }}
            >
              {brief}
            </p>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          {discoverMoreHref ? (
            <Link
              href={discoverMoreHref}
              className="inline-flex shrink-0 items-center justify-center self-start rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:self-center"
              style={{ fontFamily: FONT, background: CAMPAIGN_HEADER_GRADIENT }}
            >
              {discoverMoreLabel}
              <span className="ms-1.5" aria-hidden>
                {forwardArrowGlyph(locale)}
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className="bg-white px-4 py-5 sm:px-5 sm:py-5">{children}</div>
    </div>
  );
}

export default function FeaturedCampaignSection({
  initialProducts,
}: {
  /** Server GraphQL `getProductsInFeaturedCampaign` mapped to carousel shape. */
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
  const ssrEmptyResolvedRef = useRef(
    initialProducts !== undefined && (initialProducts?.length ?? 0) === 0,
  );
  const fallbackTitle = t("featuredCampaign") || "Featured Campaign";

  useEffect(() => {
    ssrSeedRef.current = initialProducts ?? [];
    ssrEmptyResolvedRef.current =
      initialProducts !== undefined && (initialProducts?.length ?? 0) === 0;
  }, [initialProducts]);

  const fetchProducts = useCallback(async () => {
    const language = locale === "ar" ? "ar" : "en";
    const cur = String(currency || "QAR").toLowerCase();
    const token = Cookies.get("token") ?? null;
    let last: CarouselProduct[] = [];

    for (let attempt = 1; attempt <= CLIENT_CAROUSEL_RETRY_ATTEMPTS; attempt++) {
      try {
        const { getProductsInFeaturedCampaign } = await fetchProductsInFeaturedCampaign(
          {
            language,
            currency: cur,
            sort: PRODUCT_SEARCH_SORT.BEST_MATCH,
            pageNumber: 1,
            itemsPerPage: 10,
          },
          token,
        );
        last = (getProductsInFeaturedCampaign ?? []).map(gqlProductToCarouselProduct);
        if (last.length > 0) break;
      } catch {
        /* retry */
      }
      if (attempt < CLIENT_CAROUSEL_RETRY_ATTEMPTS) {
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
  }, [locale, currency]);

  useEffect(() => {
    const key = localeCurrencyCacheKey(locale, currency);
    const prev = localeCurrencySeenRef.current;
    if (prev === null) {
      localeCurrencySeenRef.current = key;
      if (
        canUseHomeCarouselSsrSeed({
          initialProductCount: initialProducts?.length ?? 0,
          currency,
          ssrEmptyResolved: ssrEmptyResolvedRef.current,
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
  }, [locale, currency, fetchProducts, initialProducts]);

  const campaign = useMemo(
    () => resolveSectionCampaign(products, fallbackTitle),
    [products, fallbackTitle],
  );
  const sectionBrief = campaign.brief?.trim() || "";
  const discoverMoreHref = buildCampaignCollectionHref(campaign.slug);

  const handleAddToCart = async (product: CarouselProduct) => {
    const ref = carouselProductToCartRef(product);
    if (ref) await addToCart(ref, 1);
  };
  const itemList = {
    itemListId: `home-campaign:${campaign.slug || campaign.uuid || "featured"}`,
    itemListName: campaign.name || fallbackTitle,
  };
  useGtmItemList(products, itemList, !loading);

  const carousel = (
    <ProductCarouselTrack>
      {products.map((p, index) => (
        <div key={p?.id || p?.slug || p?.name} className="shrink-0">
          <ProductCarouselCard
            product={p}
            onAddToCart={handleAddToCart}
            itemList={itemList}
            itemIndex={index}
          />
        </div>
      ))}
    </ProductCarouselTrack>
  );

  if (loading) {
    return (
      <section
        className={`flex w-full justify-center pt-8 pb-2 ${HOME_SECTION_X_PADDING_CLASS}`}
      >
        <div className={HOME_CONTENT_INNER_CLASS}>
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#FAFAFA]">
            <div
              className="h-11 animate-pulse sm:h-12"
              style={{ background: CAMPAIGN_HEADER_GRADIENT }}
            />
            <div className="bg-white px-4 py-5 sm:px-5">
              <div
                className={`${CAROUSEL_TRACK_LOADING_CLASS} overflow-hidden`}
                style={{ gap: SECTION_GAP }}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${CAROUSEL_CARD_WIDTH_CLASS} ${CAROUSEL_CARD_HEIGHT_CLASS} rounded bg-gray-200 animate-pulse`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section
      className={`flex w-full justify-center pt-8 pb-2 ${HOME_SECTION_X_PADDING_CLASS}`}
      aria-label={campaign.name ?? fallbackTitle}
    >
      <div className={HOME_CONTENT_INNER_CLASS}>
        <CampaignSectionShell
          campaign={campaign}
          fallbackTitle={fallbackTitle}
          brief={sectionBrief}
          discoverMoreHref={discoverMoreHref}
          discoverMoreLabel={t("discoverMore")}
          locale={locale}
        >
          {carousel}
        </CampaignSectionShell>
      </div>
    </section>
  );
}

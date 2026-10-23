"use client";

import Cookies from "js-cookie";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import {
  useCurrency,
  getCurrencyCountryCode,
} from "@/componentsedit/context/CurrencyContext";
import { useCart } from "@/componentsedit/context/CartContext";
import ProductCarouselTrack from "@/componentsedit/home/ProductCarouselTrack";
import {
  ProductCarouselCard,
  type CarouselProduct,
} from "@/componentsedit/home/ProductCarouselSection";
import {
  addBundleToCart,
  fetchBundlesForProduct,
  type GqlProductBundle,
} from "@/services/graphql";
import { gqlMoneyToNumber } from "@/services/graphql/money";

type BundleItem = NonNullable<GqlProductBundle["items"]>[number];

function getBundleItemKey(item: BundleItem, index: number) {
  const productUuid = String(item?.product?.uuid ?? "").trim();
  const variantUuid = String(item?.variant?.uuid ?? "").trim();
  return [productUuid || `product-${index}`, variantUuid || `variant-${index}`].join(":");
}

function getBundleItemLabel(item: BundleItem, index: number, localeCode = "en") {
  const product = item?.product;
  const variant = item?.variant;
  const productTitle =
    localeCode === "ar"
      ? String(product?.titleAr ?? product?.titleEn ?? "").trim()
      : String(product?.titleEn ?? product?.titleAr ?? "").trim();
  const variantTitle =
    localeCode === "ar"
      ? String(variant?.titleAr ?? variant?.titleEn ?? "").trim()
      : String(variant?.titleEn ?? variant?.titleAr ?? "").trim();
  const productSlug = String(product?.slug ?? "").trim();
  const variantSku = String(variant?.sku ?? "").trim();
  const fallback = `Product ${index + 1}`;
  if (variantTitle) return variantTitle;
  if (productTitle) return productTitle;
  if (variantSku) return variantSku;
  if (productSlug) return productSlug;
  return fallback;
}

function buildBundleProductCard(
  item: BundleItem,
  index: number,
  localeCode: string,
): CarouselProduct {
  const product = item?.product;
  const variant = item?.variant;
  const price = variant?.price;
  const salePrice = variant?.discountedPrice;
  const imageSource = product?.featuredImageUrl || product?.featuredThumbnailUrl || "";
  const regularAmount = gqlMoneyToNumber(price) ?? 0;
  const saleAmount = gqlMoneyToNumber(salePrice) ?? regularAmount;

  return {
    id: item?.product?.uuid || item?.variant?.uuid || `${index}`,
    productUuid: product?.uuid ?? undefined,
    variantUuid: variant?.uuid ?? undefined,
    name: getBundleItemLabel(item, index, localeCode),
    slug: product?.slug ?? undefined,
    images: imageSource ? [{ thumbnail: imageSource, src: imageSource }] : [],
    prices: {
      regular_price: regularAmount,
      sale_price: saleAmount,
      price: saleAmount,
      currency_code: salePrice?.currencyCode || price?.currencyCode || "QAR",
    },
    on_sale: Boolean(saleAmount > 0 && regularAmount > saleAmount),
    rating: 0,
    reviews_count: 0,
  };
}

function buildDefaultSelection(bundle: GqlProductBundle) {
  const items = bundle.items ?? [];
  return items.reduce<Record<string, boolean>>((acc, item, index) => {
    acc[getBundleItemKey(item, index)] = true;
    return acc;
  }, {});
}

function formatMoneyShort(
  rawValue: number | string | null | undefined,
  currencyCode?: string | null,
  localeCode = "en",
) {
  const value = Number(rawValue ?? 0);
  if (!Number.isFinite(value)) return "";
  const currency = (currencyCode || "QAR").toUpperCase();
  try {
    return new Intl.NumberFormat(localeCode, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

export default function ProductBundlesSection({
  productUuid,
  productVariantUuid,
}: {
  productUuid?: string | number | null;
  productVariantUuid?: string | number | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { fetchCart } = useCart();
  const [bundles, setBundles] = useState<GqlProductBundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBundleUuid, setAddingBundleUuid] = useState<string | null>(null);
  const [selectedByBundle, setSelectedByBundle] = useState<
    Record<string, Record<string, boolean>>
  >({});

  useEffect(() => {
    const uuid = String(productUuid ?? "").trim();
    if (!uuid) {
      setBundles([]);
      setSelectedByBundle({});
      return;
    }

    let active = true;
    const localeCode = locale === "ar" ? "ar" : "en";
    const currencyCode = String(currency || "QAR").toLowerCase();

    (async () => {
      setLoading(true);
      try {
        const token = Cookies.get("token") ?? undefined;
        const result = await fetchBundlesForProduct(
          {
            productUUID: uuid,
            currency: currencyCode,
            language: localeCode,
          },
          token,
        );

        if (!active) return;
        const nextBundles = result.getBundlesForProduct ?? [];
        setBundles(nextBundles.filter((bundle) => bundle?.isActive !== false));
        setSelectedByBundle((prev) => {
          const next: Record<string, Record<string, boolean>> = { ...prev };
          for (const bundle of nextBundles) {
            next[bundle.uuid] = buildDefaultSelection(bundle);
          }
          return next;
        });
      } catch {
        if (active) {
          setBundles([]);
          setSelectedByBundle({});
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [productUuid, locale, currency]);

  const sectionTitle = useMemo(() => {
    return bundles[0]?.title || t("similarProducts") || "Complete the Look";
  }, [bundles, t]);

  const toggleItemSelection = (bundleUuid: string, itemKey: string) => {
    setSelectedByBundle((prev) => {
      const current = prev[bundleUuid] ?? {};
      return {
        ...prev,
        [bundleUuid]: {
          ...current,
          [itemKey]: !current[itemKey],
        },
      };
    });
  };

  const handleAddBundleToCart = async (bundle: GqlProductBundle) => {
    if (!bundle.uuid) return;

    const items = bundle.items ?? [];
    const selectedMap = selectedByBundle[bundle.uuid] ?? {};
    const selectedItems = items.filter((item, index) =>
      Boolean(selectedMap[getBundleItemKey(item, index)]),
    );
    const minimumSelectionCount =
      bundle.minimumSelectionCount == null ? 0 : Number(bundle.minimumSelectionCount);
    const selectedCount = selectedItems.length;

    if (
      !selectedCount ||
      (minimumSelectionCount > 0 && selectedCount < minimumSelectionCount)
    ) {
      return;
    }

    const openProductUuid = String(productUuid ?? "").trim();
    const openVariantUuid = String(productVariantUuid ?? "").trim() || undefined;

    const selectedPayloadItems = selectedItems
      .map((item) => ({
        productUuid: String(item?.product?.uuid ?? "").trim(),
        variantUuid: item?.variant?.uuid ? String(item.variant.uuid).trim() : undefined,
      }))
      .filter((item) => item.productUuid);

    // Ensure the open PDP product is always included in the payload.
    const payloadItems = [] as { productUuid: string; variantUuid?: string }[];
    if (openProductUuid) {
      payloadItems.push({ productUuid: openProductUuid, variantUuid: openVariantUuid });
    }

    for (const it of selectedPayloadItems) {
      // Skip if same as open product+variant to avoid duplicates
      if (
        it.productUuid === openProductUuid &&
        (it.variantUuid || undefined) === openVariantUuid
      )
        continue;
      payloadItems.push(it);
    }

    if (!payloadItems.length) {
      return;
    }

    const token = Cookies.get("token") ?? undefined;
    const countryCode = (
      getCurrencyCountryCode(String(currency || "QAR")) || "QA"
    ).toUpperCase();
    setAddingBundleUuid(bundle.uuid);

    try {
      await addBundleToCart(
        {
          bundleUuid: bundle.uuid,
          currency: String(currency || "QAR").toLowerCase(),
          countryCode,
          items: payloadItems,
          quantity: 1,
        },
        token,
      );

      await fetchCart(true);
      toast.success(`${t("cartProductAddedSuccess") || "Bundle added to cart"}`);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to add bundle to cart";
      toast.error(message);
    } finally {
      setAddingBundleUuid(null);
    }
  };

  if (loading && !bundles.length) {
    return null;
  }

  if (!bundles.length) {
    return null;
  }

  return (
    <section className="mt-12 w-full min-w-0 md:mt-16 lg:mt-20">
      <div className="mb-6 flex min-h-[46px] flex-row flex-wrap items-center justify-between gap-4 sm:mb-10">
        <div className="flex flex-row items-center gap-2">
          <div
            className="shrink-0 rounded"
            style={{ width: 20, height: 40, background: "#CB262E", borderRadius: 4 }}
          />
          <span className="font-sans text-lg font-semibold leading-tight text-black sm:text-xl sm:leading-5">
            {sectionTitle}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {bundles.map((bundle) => {
          const items = bundle.items ?? [];
          const selectedMap = selectedByBundle[bundle.uuid] ?? {};
          const selectedCount = items.filter(
            (item, index) => selectedMap[getBundleItemKey(item, index)],
          ).length;
          const discountLabel =
            bundle.discountPercentage != null && Number(bundle.discountPercentage) > 0
              ? `${bundle.discountPercentage}% OFF`
              : bundle.discountType === "flat_price"
                ? t("bundleSectionBundleDeal")
                : t("bundleSectionSpecialOffer");

          return (
            <div
              key={bundle.uuid}
              className="overflow-hidden rounded-[20px] border border-[#E7E7E7] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.03)]"
            >
              <div className="flex flex-col gap-4 p-4 md:flex-row md:p-5">
                {bundle.imageUrl ? (
                  <div className="w-full overflow-hidden rounded-lg bg-[#F5F5F5] md:max-w-[220px]">
                    <img
                      src={bundle.imageUrl}
                      alt={bundle.title || t("bundleSectionOfferFallback")}
                      className="h-40 w-full object-cover md:h-full md:min-h-[180px]"
                    />
                  </div>
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {bundle.brief ? (
                        <p className="font-sans text-sm text-black/70">{bundle.brief}</p>
                      ) : null}
                    </div>

                    <span className="inline-flex w-fit items-center rounded-full bg-[#CB262E]/10 px-2.5 py-1 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#CB262E]">
                      {discountLabel}
                    </span>
                  </div>

                  {bundle.minimumSelectionCount != null ? (
                    <div className="font-sans text-xs font-medium text-black/60">
                      {t("bundleSectionSelectAtLeast")} {bundle.minimumSelectionCount}{" "}
                      {t("bundleSectionItems")}
                    </div>
                  ) : null}

                  {bundle.flatPriceValue != null || bundle.discountAmountValue != null ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {bundle.flatPriceValue != null ? (
                        <span className="font-sans text-base font-semibold text-black">
                          {formatMoneyShort(
                            bundle.flatPriceValue,
                            bundle.amountCurrencyCode,
                            locale,
                          )}
                        </span>
                      ) : null}
                      {bundle.discountAmountValue != null ? (
                        <span className="font-sans text-xs text-black/60">
                          {formatMoneyShort(
                            bundle.discountAmountValue,
                            bundle.amountCurrencyCode,
                            locale,
                          )}{" "}
                          {t("bundleSectionOff")}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-1">
                    <ProductCarouselTrack variant="page" showNav>
                      {items.map((item, index) => {
                        const itemKey = getBundleItemKey(item, index);
                        const checked = Boolean(selectedMap[itemKey]);
                        const cardProduct = buildBundleProductCard(
                          item,
                          index,
                          locale === "ar" ? "ar" : "en",
                        );

                        return (
                          <div key={itemKey} className="relative shrink-0">
                            <button
                              type="button"
                              aria-label={
                                checked ? "Deselect bundle item" : "Select bundle item"
                              }
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                toggleItemSelection(bundle.uuid, itemKey);
                              }}
                              className={`absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white shadow-sm transition ${
                                checked
                                  ? "bg-[#CB262E] text-white"
                                  : "bg-white/90 text-[#CB262E]"
                              }`}
                            >
                              {checked ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="none"
                                  aria-hidden
                                >
                                  <path
                                    d="M6 12.5L10 16.5L18 8.5"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="none"
                                  aria-hidden
                                >
                                  <path
                                    d="M12 5V19M5 12H19"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              )}
                            </button>
                            <ProductCarouselCard
                              product={cardProduct}
                              showWishlistHeart={false}
                              onAddToCart={() =>
                                toggleItemSelection(bundle.uuid, itemKey)
                              }
                            />
                          </div>
                        );
                      })}
                    </ProductCarouselTrack>
                  </div>

                  <div className="mt-1 flex flex-col gap-3 border-t border-[#F0F0F0] pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-sans text-xs font-medium uppercase tracking-[0.08em] text-black/50">
                      {t("bundleSectionSelectedCount", {
                        count: selectedCount,
                        total: items.length,
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      {bundle.minimumSelectionCount != null &&
                      selectedCount < Number(bundle.minimumSelectionCount) ? (
                        <span className="font-sans text-xs font-medium text-[#CB262E]">
                          {t("bundleSectionRequired")}
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleAddBundleToCart(bundle)}
                        disabled={
                          addingBundleUuid === bundle.uuid ||
                          selectedCount === 0 ||
                          (bundle.minimumSelectionCount != null &&
                            selectedCount < Number(bundle.minimumSelectionCount))
                        }
                        className="inline-flex items-center justify-center rounded-full bg-[#CB262E] px-4 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-[#b1242b] disabled:cursor-not-allowed disabled:bg-[#D9D9D9] disabled:text-white/80"
                      >
                        {addingBundleUuid === bundle.uuid
                          ? t("bundleSectionAdding")
                          : t("bundleSectionAddToCart", {
                              count: selectedCount,
                              itemLabel:
                                selectedCount === 1
                                  ? t("bundleSectionItem")
                                  : t("bundleSectionItems"),
                            })}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

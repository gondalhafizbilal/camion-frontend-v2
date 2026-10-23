"use client";

import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/componentsedit/context/CartContext";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { patchCartItem } from "@/services/cart/cartItemsApi";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { toast } from "@/componentsedit/toast";
import { dispatchCartCountInvalidated } from "@/hooks/useCustomerCartCount";
import { useCartDrawerEnabled } from "@/hooks/useCartDrawerEnabled";
import { EcommerceMotionButton, EcommerceMotionLink } from "@/componentsedit/buttons/EcommerceMotionButton";
import {
  StarIcon,
  type ProductRatingSummary,
} from "@/componentsedit/home/ProductCarouselSection";
import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import { buildProductDetailCards } from "../_lib/buildProductDetailCards";
import { ProductDetailCampaignCallout, isProductCampaignPurchaseFrameActive, ProductDetailCampaignPurchaseFrame } from "@/componentsedit/products/ProductDetailCampaignBlock";
import CartQuantityStepper from "@/componentsedit/cart/CartQuantityStepper";
import { clampCartQuantity, MAX_CART_QUANTITY } from "@/lib/cart/maxQuantity";
import ProductSizeChartDialog from "@/componentsedit/products/ProductSizeChartDialog";
import ProductUrgencyLabel from "@/componentsedit/products/ProductUrgencyLabel";
import { resolveProductUrgencyCount } from "@/lib/product/resolveProductUrgencyCount";
import { useRouter } from "@/i18n/navigation";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import { goToLogin } from "@/lib/auth/authReturnToClient";
import { useMinimumOrderDock } from "@/componentsedit/cart/minimumOrderDockContext";
import { useMinimumOrder } from "@/componentsedit/context/MinimumOrderContext";
import { canProceedToCheckout } from "@/lib/cart/minimumOrder";
import { startBuyNowCheckout } from "@/lib/checkout/startBuyNowCheckout";
import { pushAuthCheckoutGtmEvent } from "@/componentsedit/analytics/authCheckoutEvents";
import {
  DISCOUNT_PERCENT_DIR,
  formatDiscountPercentLabel,
} from "@/lib/formatDiscountPercent";
import { formatMoneyAmount } from "@/lib/currency/localizedCurrencyCode";
import { pushGtmProductEvent } from "@/componentsedit/analytics/gtmCommerceEvents";

function SizeChartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={`shrink-0 ${className}`.trim()}
      aria-hidden
    >
      <path d="M4 8h16v5H4z" />
      <path d="M7 8v2" />
      <path d="M10 8v3" />
      <path d="M13 8v2" />
      <path d="M16 8v3" />
    </svg>
  );
}

type ProductAttribute = {
  name?: string;
  taxonomy?: string;
  terms?: Array<{ slug?: string; name?: string; color?: string }>;
  [key: string]: unknown;
};

type VariationAttrRow = { name?: string; value?: string };
type ProductVariationRow = {
  id?: string | number;
  attributes?: VariationAttrRow[];
  is_in_stock?: boolean;
  is_purchasable?: boolean;
  add_to_cart?: { maximum?: number };
  prices?: {
    price?: string | number;
    regular_price?: string | number;
    sale_price?: string | number;
    currency_code?: string;
  };
  image?: { src?: string; thumbnail?: string };
  [key: string]: unknown;
};

type VariationIndexEntry = {
  id?: string | number;
  attrs: Record<string, string>;
  raw: ProductVariationRow;
};

const normalizeOptionValue = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

const isVariationInStock = (variation: ProductVariationRow | null): boolean => {
  if (!variation) return false;
  if (variation.is_in_stock === false) return false;
  if (variation.is_purchasable === false) return false;
  const qty = variation.add_to_cart?.maximum;
  if (typeof qty === "number") return qty > 0;
  return true;
};

function selectedOptionsFromVariationEntry(
  entry: VariationIndexEntry,
  filteredAttributes: ProductAttribute[],
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const attr of filteredAttributes) {
    const name = attr.name;
    if (!name) continue;
    const hitKey = Object.keys(entry.attrs).find(
      (k) => k.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    const v = hitKey ? entry.attrs[hitKey] : undefined;
    if (v) next[name] = normalizeOptionValue(v);
  }
  return next;
}

function isCompleteOptionSelection(
  options: Record<string, string>,
  filteredAttributes: ProductAttribute[],
): boolean {
  return filteredAttributes.every((a) => a.name && options[a.name]);
}

/** First catalog variant with a complete option match (for PDP default selection). */
function pickDefaultSelectedOptions(
  filteredAttributes: ProductAttribute[],
  variationIndex: VariationIndexEntry[],
): Record<string, string> {
  if (!filteredAttributes.length || !variationIndex.length) return {};

  for (const entry of variationIndex) {
    const next = selectedOptionsFromVariationEntry(entry, filteredAttributes);
    if (isCompleteOptionSelection(next, filteredAttributes)) return next;
  }
  return {};
}

const buildBackendVariationPayload = ({
  filteredAttributes,
  selectedOptions,
}: {
  filteredAttributes: ProductAttribute[];
  selectedOptions: Record<string, string>;
}): { attribute: string; value: string }[] => {
  const payload: { attribute: string; value: string }[] = [];
  (filteredAttributes || []).forEach((attr) => {
    const name = attr.name;
    if (!name) return;
    const selectedValue = selectedOptions[name];
    if (!selectedValue) return;
    const taxonomy = String(attr.taxonomy || "")
      .trim()
      .toLowerCase();
    const attributeKey = taxonomy
      ? `attribute_${taxonomy}`
      : String(attr.name || "").trim();
    payload.push({
      attribute: attributeKey,
      value: String(selectedValue || "")
        .trim()
        .toLowerCase(),
    });
  });
  return payload;
};

const ProductVariantNamingSection = ({
  product,
  initialRating = null,
  onVariantImageChange,
  onVariantUuidChange,
}: {
  product?: ProductDetailsCenterProduct | null;
  initialRating?: ProductRatingSummary | null;
  onVariantImageChange?: (src: string | null) => void;
  /** Selected catalog variant UUID (used by wishlist + other actions). */
  onVariantUuidChange?: (variantUuid: string | null) => void;
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { addToCart, fetchCart, showPostAddCartFeedback } = useCart();
  const router = useRouter();
  const { emphasizeCheckoutBlocked } = useMinimumOrderDock();
  const { minimumAmount, ready: minimumOrderReady } = useMinimumOrder();
  const isCartDrawerEnabled = useCartDrawerEnabled();
  const searchParams = useSearchParams();
  const { currency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [buyingNow, setBuyingNow] = useState(false);
  const [rating, setRating] = useState<ProductRatingSummary>(
    initialRating ?? { average: 0, count: 0 },
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [variationDetails, setVariationDetails] = useState<ProductVariationRow | null>(
    null,
  );
  const [fetchingVariation, setFetchingVariation] = useState(false);
  const [showGoToCart, setShowGoToCart] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const editPrefillKeyRef = useRef<string | null>(null);
  const lastProductIdRef = useRef<string | number | undefined>(undefined);

  const filteredAttributes = useMemo((): ProductAttribute[] => {
    if (!Array.isArray(product?.attributes)) return [];
    const seen = new Set<string>();
    const result: ProductAttribute[] = [];
    (product.attributes as ProductAttribute[]).forEach((attr) => {
      const name = attr?.name;
      if (!name || seen.has(name)) return;
      seen.add(name);
      result.push({ ...attr, terms: Array.isArray(attr?.terms) ? attr.terms : [] });
    });
    return result;
  }, [product?.attributes]);

  const infoCards = useMemo(
    () => (product ? buildProductDetailCards(product, t).slice(0, 4) : []),
    [product, t],
  );

  const variationIndex = useMemo((): VariationIndexEntry[] => {
    const list = Array.isArray(product?.variations)
      ? (product.variations as ProductVariationRow[])
      : [];
    return list
      .filter((v) => v?.id)
      .map((v) => {
        const attrs: Record<string, string> = {};
        (v?.attributes || []).forEach((a) => {
          const key = a?.name;
          const value = normalizeOptionValue(a?.value);
          if (key && value) attrs[key] = value;
        });
        return { id: v?.id, attrs, raw: v };
      });
  }, [product?.variations]);

  const selectedVariation = useMemo(() => {
    if (product?.type !== "variable" || !filteredAttributes.length) return null;
    const allSelected = filteredAttributes.every(
      (attr) => attr.name != null && !!selectedOptions[attr.name],
    );
    if (!allSelected) return null;
    const found = variationIndex.find(({ attrs }) =>
      filteredAttributes.every((attr) => {
        const n = attr.name;
        if (!n) return false;
        return (
          String(attrs[n] || "").toLowerCase() ===
          String(selectedOptions[n] || "").toLowerCase()
        );
      }),
    );
    return found?.raw ?? null;
  }, [product?.type, selectedOptions, variationIndex, filteredAttributes]);

  // If coming from Cart -> Edit, prefill quantity and selected variant (best-effort, no extra fetch).
  useEffect(() => {
    const editCartItemUuid = String(searchParams?.get("editCartItemUuid") ?? "").trim();
    if (!editCartItemUuid) return;

    const desiredVariantUuid = String(searchParams?.get("editVariantUuid") ?? "").trim();
    if (!desiredVariantUuid) return;
    const prefillKey = `${editCartItemUuid}:${desiredVariantUuid}`;
    if (editPrefillKeyRef.current === prefillKey) return;
    if (product?.type !== "variable") return;

    const match = variationIndex.find(
      (v) => String(v.id ?? "").trim() === desiredVariantUuid,
    );
    if (!match) return;

    editPrefillKeyRef.current = prefillKey;
    const qRaw = String(searchParams?.get("editQty") ?? "").trim();
    const nextQ = clampCartQuantity(qRaw);
    setQuantity(nextQ);
    setSelectedOptions((prev) => {
      const next: Record<string, string> = { ...prev };
      // Map variation attrs to the product's attribute names (case-insensitive),
      // so selectedVariation resolution matches the normal PDP flow.
      for (const attr of filteredAttributes) {
        const name = String(attr?.name ?? "").trim();
        if (!name) continue;
        const hitKey = Object.keys(match.attrs).find(
          (k) => String(k).trim().toLowerCase() === name.toLowerCase(),
        );
        const v = hitKey ? match.attrs[hitKey] : undefined;
        if (v) next[name] = normalizeOptionValue(v);
      }
      return next;
    });
  }, [product?.type, searchParams, variationIndex, filteredAttributes]);

  const availableOptionValues = useMemo(() => {
    // For each attribute, compute which term slugs are valid given other selections.
    const out: Record<string, Set<string>> = {};
    for (const attr of filteredAttributes) {
      const name = attr.name;
      if (!name) continue;
      out[name] = new Set<string>();
      const others = filteredAttributes
        .map((a) => a.name)
        .filter((n): n is string => Boolean(n && n !== name));
      for (const entry of variationIndex) {
        const ok = others.every((o) => {
          const sel = selectedOptions[o];
          if (!sel) return true; // other option not selected yet
          return normalizeOptionValue(entry.attrs[o]) === normalizeOptionValue(sel);
        });
        if (!ok) continue;
        const candidate = entry.attrs[name];
        if (candidate) out[name].add(normalizeOptionValue(candidate));
      }
    }
    return out;
  }, [filteredAttributes, variationIndex, selectedOptions]);

  useEffect(() => {
    // If a selection becomes invalid after changing another option, clear it.
    if (product?.type !== "variable") return;
    const allSelected = filteredAttributes.every(
      (a) => a.name && selectedOptions[a.name],
    );
    if (!allSelected) return;

    let changed = false;
    const next: Record<string, string> = { ...selectedOptions };
    for (const attr of filteredAttributes) {
      const name = attr.name;
      if (!name) continue;
      const sel = next[name];
      if (!sel) continue;
      const allowed = availableOptionValues[name];
      if (allowed && allowed.size > 0 && !allowed.has(normalizeOptionValue(sel))) {
        delete next[name];
        changed = true;
      }
    }
    if (changed) setSelectedOptions(next);
  }, [
    availableOptionValues,
    filteredAttributes,
    product?.type,
    selectedOptions,
  ]);

  useEffect(() => {
    if (!selectedVariation?.id) {
      setVariationDetails(null);
      onVariantImageChange?.(null);
      onVariantUuidChange?.(null);
      return;
    }
    setVariationDetails(selectedVariation);
    setFetchingVariation(false);
    const imgSrc = String(selectedVariation?.image?.src || "").trim();
    onVariantImageChange?.(imgSrc || null);
    onVariantUuidChange?.(String(selectedVariation.id).trim() || null);
  }, [selectedVariation, onVariantImageChange, onVariantUuidChange]);

  useEffect(() => {
    if (initialRating != null) {
      setRating(initialRating);
    }
  }, [initialRating]);

  /** Pre-select first valid variant before paint; keep selection on currency refetch. */
  useLayoutEffect(() => {
    const editCartItemUuid = String(searchParams?.get("editCartItemUuid") ?? "").trim();
    if (editCartItemUuid) return;
    if (product?.type !== "variable") {
      setSelectedOptions({});
      lastProductIdRef.current = product?.id;
      return;
    }

    const productChanged = lastProductIdRef.current !== product?.id;
    lastProductIdRef.current = product?.id;

    const variantUuid = String(searchParams?.get("variant") ?? "").trim();
    if (variantUuid) {
      const fromListing = variationIndex.find(
        (v) => String(v.id ?? "").trim() === variantUuid,
      );
      if (fromListing) {
        const fromUrl = selectedOptionsFromVariationEntry(
          fromListing,
          filteredAttributes,
        );
        if (isCompleteOptionSelection(fromUrl, filteredAttributes)) {
          setSelectedOptions(fromUrl);
          return;
        }
      }
    }

    setSelectedOptions((prev) => {
      if (!productChanged && isCompleteOptionSelection(prev, filteredAttributes)) {
        return prev;
      }
      return pickDefaultSelectedOptions(filteredAttributes, variationIndex);
    });
  }, [
    product?.id,
    product?.type,
    variationIndex,
    filteredAttributes,
    searchParams,
  ]);

  useEffect(() => {
    setShowGoToCart(false);
  }, [product?.id, selectedVariation?.id]);

  const handleOptionSelect = useCallback((attrName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [attrName]: normalizeOptionValue(value),
    }));
    setShowGoToCart(false);
  }, []);

  const pricesShape = product?.prices as
    | {
        price?: string | number;
        regular_price?: string | number;
        sale_price?: string | number;
        currency_code?: string;
      }
    | undefined;
  const activePrices = variationDetails?.prices ?? pricesShape;
  const currencyCode =
    activePrices?.currency_code ?? pricesShape?.currency_code ?? "QAR";
  const regular = activePrices?.regular_price;
  const sale = activePrices?.sale_price;
  const displayAmount = activePrices?.price ?? sale ?? regular;
  const onSale =
    Number(sale) > 0 &&
    Number(regular) > 0 &&
    Number(sale) < Number(regular);
  const discountPercent =
    onSale && Number(regular) > 0
      ? Math.round((1 - Number(sale ?? displayAmount) / Number(regular)) * 100)
      : 0;
  const priceNum = Number(displayAmount);
  const priceValid = Number.isFinite(priceNum) && priceNum >= 0;
  const inStock =
    product?.type === "variable"
      ? Boolean(
          selectedVariation && variationDetails && isVariationInStock(variationDetails),
        )
      : Boolean(product?.is_in_stock);
  const urgencyCount = product ? resolveProductUrgencyCount(product) : 0;
  const allOptionsSelected =
    product?.type !== "variable" ||
    filteredAttributes.every((a) => !!(a.name && selectedOptions[a.name]));
  const canAddToCart =
    product &&
    (product.type !== "variable"
      ? product?.is_in_stock
      : allOptionsSelected &&
        selectedVariation &&
        variationDetails &&
        !fetchingVariation &&
        isVariationInStock(variationDetails));

  const isEditCartMode = Boolean(
    String(searchParams?.get("editCartItemUuid") ?? "").trim(),
  );

  const resolvePurchaseIds = useCallback(() => {
    if (!product) return null;
    const catalogProductUuid = String(product.productUuid ?? product.id ?? "").trim();
    if (!catalogProductUuid) return null;
    const variations = Array.isArray(product.variations)
      ? (product.variations as ProductVariationRow[])
      : [];
    const firstVariantId = variations[0]?.id;
    const variantUuid =
      product.type === "variable" && selectedVariation?.id
        ? String(selectedVariation.id).trim()
        : String(firstVariantId ?? product.id ?? "").trim();
    if (!variantUuid) return null;
    return { catalogProductUuid, variantUuid };
  }, [product, selectedVariation]);

  const buildAddToCartProductRef = useCallback(() => {
    const ids = resolvePurchaseIds();
    if (!ids || !product) return null;
    const categoryForPixel = Array.isArray(product.categories)
      ? String(product.categories.find((c) => c?.name)?.name ?? "").trim()
      : "";
    return {
      id: ids.variantUuid,
      productUuid: ids.catalogProductUuid,
      variantUuid: ids.variantUuid,
      name: product.name,
      contentCategory: categoryForPixel || undefined,
      prices: activePrices
        ? {
            regular_price: regular,
            sale_price: sale,
            price: displayAmount,
            currency_code: currencyCode,
          }
        : undefined,
    };
  }, [
    resolvePurchaseIds,
    product,
    activePrices,
    regular,
    sale,
    displayAmount,
    currencyCode,
  ]);

  const handleAddToCart = async () => {
    if (!canAddToCart || !product) return;
    const variationPayload = buildBackendVariationPayload({
      filteredAttributes,
      selectedOptions,
    });
    const ids = resolvePurchaseIds();
    if (!ids) return;
    const editCartItemUuid = String(
      searchParams?.get("editCartItemUuid") ?? "",
    ).trim();

    if (editCartItemUuid) {
      const token = Cookies.get("token");
      if (!token) {
        toast.error(t("cartSignInToUpdate"), {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }
      try {
        const result = await patchCartItem(token, editCartItemUuid, {
          productUuid: ids.catalogProductUuid,
          variantUuid: ids.variantUuid,
          quantity: clampCartQuantity(quantity),
          currency: String(currency || "QAR").toLowerCase(),
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        await fetchCart(true);
        dispatchCartCountInvalidated();
        toast.success(t("cartUpdatedSuccess"));
        setShowGoToCart(true);
        if (isCartDrawerEnabled) {
          showPostAddCartFeedback({ showAddedBanner: true });
        }
      } catch {
        toast.error(t("cartUpdateQuantityError"));
      }
      return;
    }

    const productRef = buildAddToCartProductRef();
    if (!productRef) return;

    const added = await addToCart(productRef, clampCartQuantity(quantity), variationPayload);
    if (added.ok) setShowGoToCart(true);
  };

  const handleBuyNow = async () => {
    if (buyingNow || !canAddToCart || !product || isEditCartMode) return;

    // Buy Now min-order uses this line only (unit price × selected qty), not full cart.
    const buyQty = clampCartQuantity(quantity);
    const lineSubtotal =
      (Number.isFinite(Number(displayAmount)) ? Number(displayAmount) : 0) *
      buyQty;
    if (!canProceedToCheckout(lineSubtotal, minimumOrderReady, minimumAmount)) {
      pushGtmProductEvent("minimum_order_not_reached", product, {
        quantity: buyQty,
        itemValue: Number(displayAmount),
        cartValue: lineSubtotal,
        currency: currencyCode,
        threshold: minimumAmount,
        source: "buy_now",
        variantId: selectedVariation?.id,
      });
      emphasizeCheckoutBlocked({ subtotal: lineSubtotal });
      return;
    }

    const productRef = buildAddToCartProductRef();
    if (!productRef) {
      toast.error(t("somethingWentWrong"), {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    const variationPayload = buildBackendVariationPayload({
      filteredAttributes,
      selectedOptions,
    });

    setBuyingNow(true);
    try {
      const added = await addToCart(productRef, buyQty, variationPayload, {
        suppressFeedback: true,
      });
      if (!added.ok) return;

      if (!startBuyNowCheckout(added.cartItemUuid ?? "")) {
        toast.error(t("somethingWentWrong"), {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }
      pushGtmProductEvent("buy_now_click", product, {
        quantity: buyQty,
        itemValue: Number(displayAmount),
        cartValue: lineSubtotal,
        currency: currencyCode,
        source: "pdp",
        variantId: selectedVariation?.id,
      });

      if (isGuestSession()) {
        pushAuthCheckoutGtmEvent("login_required", {
          source: "pdp_buy_now",
          cart_value: lineSubtotal,
          currency: currencyCode,
        });
        toast.error(t("guestCheckoutRequiresLogin"), {
          position: "top-center",
          autoClose: 3500,
        });
        goToLogin(router, "/checkout");
        return;
      }

      router.push("/checkout");
    } finally {
      setBuyingNow(false);
    }
  };

  const name = product?.name || "";
  const campaign = product?.campaign ?? null;
  const showCampaignPurchaseFrame = isProductCampaignPurchaseFrameActive(campaign);
  const categoryDisplay = Array.isArray(product?.categories)
    ? String(product.categories.find((category) => category?.name)?.name ?? "").trim()
    : "";
  const avg = Number(rating?.average) || 0;
  const count = Number(rating?.count) || 0;
  const displayPrice = priceValid
    ? formatMoneyAmount(displayAmount, locale, currencyCode)
    : "";
  const sizeChartUrl = String(product?.sizechartUrl ?? "").trim();

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col">
      <h1 className="mb-3 font-sans text-xl font-semibold leading-tight text-black sm:mb-4 sm:text-2xl sm:leading-none md:text-[1.625rem] md:leading-snug lg:mb-4 lg:text-2xl lg:leading-6">
        {name}
      </h1>

      <div className="mb-4 flex flex-row flex-wrap items-start gap-4">
        <div className="flex flex-row items-center" style={{ gap: 8 }}>
          <div className="flex flex-row items-center" style={{ gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <StarIcon key={i} filled={avg >= i} size={20} />
            ))}
          </div>
          <span
            className="font-sans text-[#000000]"
            style={{ fontSize: 14, lineHeight: "21px", opacity: 0.5 }}
          >
            ({count} {t("reviews")})
          </span>
        </div>
        <div className="flex flex-row items-center" style={{ gap: 16 }}>
          <span
            style={{
              width: 16,
              height: 0,
              opacity: 0.5,
              border: "1px solid #000000",
              transform: "rotate(90deg)",
            }}
          />
          {!inStock ? (
            <span
              className="font-sans text-[#000000]"
              style={{ fontSize: 14, lineHeight: "21px", opacity: 0.6 }}
            >
              {t("outOfStock")}
            </span>
          ) : urgencyCount > 0 ? (
            <ProductUrgencyLabel count={urgencyCount} size="pdp" />
          ) : (
            <span
              className="font-sans text-[#000000]"
              style={{ fontSize: 14, lineHeight: "21px", opacity: 0.6 }}
            >
              {t("inStock")}
            </span>
          )}
        </div>
      </div>

      <ProductDetailCampaignCallout campaign={showCampaignPurchaseFrame ? null : campaign} />

      <div className="mb-6 flex flex-col gap-1">
        {onSale && Number(regular) > 0 ? (
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span className="font-sans text-lg font-medium leading-tight text-[#CB262E] line-through sm:text-xl">
              {formatMoneyAmount(regular, locale, currencyCode)}
            </span>
            {discountPercent > 0 ? (
              <span
                dir={DISCOUNT_PERCENT_DIR}
                className="inline-flex items-center justify-center rounded px-2 py-0.5 font-sans text-xs font-medium leading-snug text-[#FAFAFA] sm:text-sm"
                style={{ background: "#CB262E" }}
              >
                {formatDiscountPercentLabel(discountPercent)}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="font-sans text-xl font-semibold text-black sm:text-2xl lg:text-2xl">
          {displayPrice || t("priceOnRequest")}
        </p>
      </div>

      {categoryDisplay && (
        <p className="mb-6 max-w-full font-sans text-sm leading-[21px] text-black sm:text-base">
          {categoryDisplay}
        </p>
      )}

      <div className="mb-6 w-full border-t border-black/50" />

      {(() => {
        const optionBlockClass = showCampaignPurchaseFrame
          ? "mb-4 w-full min-w-0 last:mb-0"
          : "mb-6 w-full min-w-0";
        const purchaseOptions = (
          <>
            {product?.type === "variable" &&
              filteredAttributes.map((attr) => {
                const key = attr.name;
                if (!key) return null;
                const terms = Array.isArray(attr.terms) ? attr.terms : [];
                const allowed = availableOptionValues[key];
                const filteredTerms =
                  allowed && allowed.size > 0
                    ? terms.filter((term, idx) => {
                        const slug = normalizeOptionValue(
                          term.slug || term.name || `opt-${idx}`,
                        );
                        return allowed.has(slug);
                      })
                    : terms;
                const selectId = `pdp-option-${key.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <div key={key} className={optionBlockClass}>
                    <label
                      htmlFor={selectId}
                      className="mb-2 block font-sans text-base font-medium leading-5 text-black"
                    >
                      {key}
                    </label>
                    <select
                      id={selectId}
                      className="w-full min-h-[48px] cursor-pointer appearance-none rounded-md border border-black/20 bg-white bg-[length:1rem] bg-no-repeat px-3 py-2.5 pe-10 font-sans text-sm text-black outline-none focus:border-[#CB262E]/60 focus:ring-1 focus:ring-[#CB262E]/25 [background-position:right_0.75rem_center] rtl:[background-position:left_0.75rem_center]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      }}
                      value={selectedOptions[key] || ""}
                      onChange={(e) => handleOptionSelect(key, e.target.value)}
                    >
                      <option value="">
                        {t("selectAttributePlaceholder", { attribute: key })}
                      </option>
                      {filteredTerms.map((term, idx) => {
                        const slug = normalizeOptionValue(
                          term.slug || term.name || `opt-${idx}`,
                        );
                        const label = String(term.name || term.slug || slug);
                        return (
                          <option key={`${key}-${slug}-${idx}`} value={slug}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}

            <div className={showCampaignPurchaseFrame ? "w-full" : "mb-6 w-full"}>
              {showCampaignPurchaseFrame ? (
                <label className="mb-2 block font-sans text-base font-bold leading-5 text-black">
                  {t("qty")}
                </label>
              ) : null}
              <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-3">
                <CartQuantityStepper
                  value={quantity}
                  onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                  onIncrease={() =>
                    setQuantity((q) => Math.min(MAX_CART_QUANTITY, q + 1))
                  }
                  max={MAX_CART_QUANTITY}
                />
                {sizeChartUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      pushGtmProductEvent("view_size_chart", product, {
                        quantity,
                        itemValue: Number(displayAmount),
                        currency: currencyCode,
                        source: "pdp_size_chart",
                        variantId: selectedVariation?.id,
                      });
                      setSizeChartOpen(true);
                    }}
                    className="flex h-11 min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-black/50 bg-white px-4 font-sans text-sm font-medium leading-none text-black transition-colors hover:bg-black/[0.03] sm:flex-initial sm:min-w-[148px]"
                  >
                    <SizeChartIcon />
                    <span className="truncate">Size Chart</span>
                  </button>
                ) : null}
              </div>
            </div>
          </>
        );

        if (showCampaignPurchaseFrame && campaign) {
          return (
            <ProductDetailCampaignPurchaseFrame campaign={campaign}>
              {purchaseOptions}
            </ProductDetailCampaignPurchaseFrame>
          );
        }

        return purchaseOptions;
      })()}

      <div className="relative z-10 flex w-full min-w-0 flex-col gap-3">
        <EcommerceMotionButton
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart || buyingNow}
          className="w-full min-h-[48px] rounded-md py-3 font-sans text-base font-semibold leading-6 text-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:min-h-0 md:py-0"
          surfaceClassName="rounded-md bg-[#CB262E]"
        >
          {isEditCartMode ? t("updateCart") || "Update cart" : t("addToCart")}
        </EcommerceMotionButton>

        {!isEditCartMode ? (
          <EcommerceMotionButton
            type="button"
            onClick={() => {
              void handleBuyNow();
            }}
            disabled={!canAddToCart || buyingNow}
            loading={buyingNow}
            className="w-full min-h-[48px] touch-manipulation rounded-md py-3 font-sans text-base font-semibold leading-6 text-[#CB262E] disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:min-h-0 md:py-0"
            surfaceClassName="rounded-md border-2 border-[#CB262E] bg-white"
          >
            {t("buyNow")}
          </EcommerceMotionButton>
        ) : null}
      </div>

      {sizeChartUrl ? (
        <ProductSizeChartDialog
          open={sizeChartOpen}
          url={sizeChartUrl}
          onClose={() => setSizeChartOpen(false)}
        />
      ) : null}

      {showGoToCart ? (
        <EcommerceMotionLink
          href="/cart"
          className="mt-3 flex w-full min-h-[48px] items-center justify-center rounded-md py-3 font-sans text-base font-semibold leading-6 text-black md:h-11 md:min-h-0 md:py-0"
          surfaceClassName="rounded-md border border-black/20 bg-white hover:bg-black/[0.02]"
        >
          {t("viewCart")}
        </EcommerceMotionLink>
      ) : null}

      {infoCards.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
          {infoCards.map((card, idx) => (
            <div
              key={idx}
              className="flex flex-col items-start p-3 border border-[#CB262E] rounded-md bg-white"
              style={{ minHeight: 85 }}
            >
              <span
                className="font-sans font-semibold text-[#000000]"
                style={{ fontSize: 12, lineHeight: "24px" }}
              >
                {card.title}
              </span>
              <span
                className="font-sans text-[#000000]"
                style={{ fontSize: 10, lineHeight: "140%" }}
              >
                {card.text}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ProductVariantNamingSection;

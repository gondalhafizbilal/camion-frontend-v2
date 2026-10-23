"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCartProceedCheckout } from "@/hooks/useCartProceedCheckout";
import { Link } from "@/i18n/navigation";
import Roadmap from "@/componentsedit/Roadmap";
import SimilarProductsSection from "@/app/[locale]/shop/[slug]/_components/SimilarProductsSection";
import {
  getCheckoutLineCampaign,
  getCheckoutLineDisplayOptions,
  getCheckoutLineTotal,
  getCheckoutLineUnitPrices,
  summarizeCheckoutCart,
  type CartSummaryShape,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";
import CartLineProductMedia from "@/componentsedit/cart/CartLineProductMedia";
import CartLineCampaignUrgency from "@/componentsedit/cart/CartLineCampaignUrgency";
import {
  formatAmountWithCurrency,
} from "@/lib/currency/localizedCurrencyCode";
import {
  PAGE_CONTENT_INNER_CLASS,
  PAGE_DESKTOP_SECTION_X_PADDING_CLASS,
} from "@/lib/layout/pageContentLayout";
import FreeShippingBannerFromCart from "@/componentsedit/cart/FreeShippingBannerFromCart";
import {
  collectCheckoutLineUuids,
  getCheckoutLineUuid,
  isPartialCartCheckoutSelection,
} from "@/lib/checkout/checkoutCartItemUuids";
import { writeCheckoutCartItemUuids } from "@/lib/checkout/checkoutReviewSession";
import { toast } from "@/componentsedit/toast";
import { clampCartQuantity, MAX_CART_QUANTITY } from "@/lib/cart/maxQuantity";
import {
  ApplePayIcon,
  GooglePayIcon,
  MastercardIcon,
  VisaIcon,
} from "@/componentsedit/PaymentMethodIcons";
import CodInterestPaymentControl from "@/componentsedit/payment/CodInterestPaymentControl";

const sectionLabelStyle = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: 16,
  lineHeight: "24px",
  color: "#000000",
};

const pageShellClass = [
  "flex w-full min-w-0 justify-center overflow-x-hidden px-4 pt-5 pb-8 sm:pt-6 md:px-8 md:pb-10",
  PAGE_DESKTOP_SECTION_X_PADDING_CLASS,
].join(" ");

const pageInnerClass = `${PAGE_CONTENT_INNER_CLASS} flex w-full min-w-0`;

function BreadcrumbBar({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0">
      <Roadmap items={items} />
    </div>
  );
}

function PaymentIconsRow() {
  return (
    <div className="flex flex-row flex-wrap items-start justify-center gap-2">
      <VisaIcon />
      <MastercardIcon />
      <GooglePayIcon />
      <ApplePayIcon />
      <CodInterestPaymentControl source="cart" />
    </div>
  );
}

function CartTrashIcon({ className }: { className?: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 7h16M10 11v6m4-6v6M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m3 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z"
        stroke="#CB262E"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyCardIcon() {
  return (
    <div className="relative flex h-[50px] w-[50px] shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#CB262E]" aria-hidden />
      <svg
        width={32}
        height={32}
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10 text-white"
        aria-hidden
      >
        <path
          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M16 10a4 4 0 01-8 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export type CartCenterContentProps = {
  cart?: CheckoutCartLine[];
  cartSummary?: CartSummaryShape;
  loading?: boolean;
  /** Cart line UUID from `GET /v1/cart-items` (`item.id`), not catalog product id. */
  onQuantityChange?: (cartLineId: string | number | undefined, qty: number) => void;
  onRemove?: (cartLineId: string | number) => void;
  /** Removes all lines (optional; shown when cart has items). */
  onClearCart?: () => void;
  currencyCode?: string;
  isLoggedIn?: boolean;
};

export default function CartCenterContent({
  cart = [],
  cartSummary = {},
  loading,
  onQuantityChange,
  onRemove,
  onClearCart,
  currencyCode = "QAR",
  isLoggedIn = true,
}: CartCenterContentProps) {
  const t = useTranslations();
  const locale = useLocale();

  function safeLabel(key: string, fallback: string): string {
    try {
      const v = t(key);
      return v && v !== key ? v : fallback;
    } catch {
      return fallback;
    }
  }

  const breadcrumbItems = [
    { label: t("home"), href: "/" },
    { label: t("cart"), href: "/cart" },
  ].filter((i) => i.label);

  const allLineUuids = useMemo(() => collectCheckoutLineUuids(cart), [cart]);
  const [checkedUuids, setCheckedUuids] = useState<string[]>(() => allLineUuids);

  useEffect(() => {
    setCheckedUuids((prev) => {
      const prevSet = new Set(prev);
      const allSet = new Set(allLineUuids);
      const kept = prev.filter((id) => allSet.has(id));
      const added = allLineUuids.filter((id) => !prevSet.has(id));
      // New lines default to checked; removed lines drop out.
      if (kept.length === prev.length && added.length === 0) return prev;
      return [...kept, ...added];
    });
  }, [allLineUuids]);

  const checkedSet = useMemo(() => new Set(checkedUuids), [checkedUuids]);
  const allChecked =
    allLineUuids.length > 0 && checkedUuids.length === allLineUuids.length;
  const someChecked = checkedUuids.length > 0;
  const selectedLines = useMemo(
    () => cart.filter((line) => checkedSet.has(getCheckoutLineUuid(line))),
    [cart, checkedSet],
  );
  const selectedSummary = useMemo(
    () => summarizeCheckoutCart(selectedLines),
    [selectedLines],
  );

  const subtotal = selectedSummary.cart_total ?? 0;
  const discount = selectedSummary.discount ?? 0;
  const shippingTotal =
    selectedSummary.shipping_total ?? cartSummary.shipping_total ?? 0;
  const grandTotal =
    selectedSummary.grand_total ?? subtotal - discount + shippingTotal;
  const {
    minimumOrderAchieved,
    handleProceedCheckoutClick,
    handleBlockedCheckout,
  } = useCartProceedCheckout(subtotal);

  const toggleLineChecked = useCallback((uuid: string) => {
    if (!uuid) return;
    setCheckedUuids((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setCheckedUuids((prev) =>
      prev.length === allLineUuids.length ? [] : [...allLineUuids],
    );
  }, [allLineUuids]);

  const persistCheckoutSelection = useCallback(() => {
    if (
      isPartialCartCheckoutSelection(allLineUuids, checkedUuids)
    ) {
      writeCheckoutCartItemUuids(checkedUuids);
    } else {
      writeCheckoutCartItemUuids(null);
    }
  }, [allLineUuids, checkedUuids]);

  const onProceedCheckoutClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (!someChecked) {
        e.preventDefault();
        toast.error(
          safeLabel("selectCartItemsToCheckout", "Select at least one item to checkout"),
          { position: "top-center", autoClose: 3000 },
        );
        return;
      }
      persistCheckoutSelection();
      handleProceedCheckoutClick(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- safeLabel uses t
    [someChecked, persistCheckoutSelection, handleProceedCheckoutClick, t],
  );

  const emptyCardClass =
    "mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-[10px] border border-black/15 bg-white px-5 py-5 sm:gap-4 sm:px-6 sm:py-6";

  // Only full-page skeleton on initial load — keep cart mounted during qty/remove refreshes.
  if (loading && !cart?.length) {
    return (
      <div className={pageShellClass}>
        <div className={`${pageInnerClass} flex-col gap-8 md:gap-10 lg:gap-[60px]`}>
        <BreadcrumbBar items={breadcrumbItems} />
          <div className="h-[400px] w-full animate-pulse rounded-lg bg-gray-100 md:h-[500px] lg:h-[632px]" />
        </div>
      </div>
    );
  }

  if (!cart?.length) {
    if (!isLoggedIn) {
      return (
        <div className={pageShellClass}>
          <div className={`${pageInnerClass} flex-col items-center gap-10 md:gap-12 lg:gap-[60px]`}>
          <BreadcrumbBar items={breadcrumbItems} />
            <div className={emptyCardClass}>
              <EmptyCardIcon />
              <div className="flex w-full max-w-sm flex-col items-center gap-2 text-center">
                <p className="w-full font-sans text-base font-medium text-black">
                  {t("loginForBetterExperience")}
                </p>
                <p className="w-full font-sans text-xs capitalize leading-[18px] text-black sm:text-sm">
                  {t("guestCartDescription")}
                </p>
              </div>
              <Link
                href="/shop"
                className="flex min-h-[48px] w-full items-center justify-center rounded-[5px] bg-[#CB262E] font-sans text-base font-semibold leading-6 text-white transition-opacity hover:opacity-90"
              >
                {t("continueShopping")}
              </Link>
              <Link
                href="/auth/login?returnTo=%2Fcart"
                className="flex min-h-[48px] w-full items-center justify-center rounded-[5px] border border-[#CB262E] font-sans text-base font-semibold leading-6 text-[#CB262E] transition-colors hover:bg-[#CB262E]/5"
              >
                {t("loginSignUp")}
              </Link>
              <PaymentIconsRow />
            </div>
            <SimilarProductsSection />
          </div>
        </div>
      );
    }

    return (
      <div className={pageShellClass}>
        <div className={`${pageInnerClass} flex-col items-center gap-10 md:gap-12 lg:gap-[60px]`}>
        <BreadcrumbBar items={breadcrumbItems} />
          <div className={emptyCardClass}>
            <EmptyCardIcon />
            <div className="flex w-full max-w-sm flex-col items-center gap-2 text-center">
              <p className="w-full font-sans text-base font-medium text-black">
                {t("yourCartIsEmpty")}
              </p>
              <p className="w-full font-sans text-xs capitalize leading-[18px] text-black sm:text-sm">
                {t("emptyCartDescription")}
              </p>
            </div>
            <Link
              href="/shop"
              className="flex min-h-[48px] w-full items-center justify-center rounded-[5px] bg-[#CB262E] font-sans text-base font-semibold leading-6 text-white transition-opacity hover:opacity-90"
            >
              {t("continueShopping")}
            </Link>
            <PaymentIconsRow />
          </div>
          <SimilarProductsSection />
        </div>
      </div>
    );
  }

  return (
    <div className={pageShellClass}>
      <div className={`${pageInnerClass} flex-col items-start gap-10 md:gap-12 lg:gap-[60px]`}>
      <BreadcrumbBar items={breadcrumbItems} />
        <div className="flex w-full min-w-0 flex-col gap-6 md:gap-8 lg:gap-6">
          <div className="flex w-full min-w-0 flex-col gap-4 md:gap-6 lg:gap-10">
            <div
              className="hidden h-[72px] w-full grid-cols-[40px_minmax(0,1fr)_110px_150px_110px_48px] items-center gap-x-4 rounded bg-white px-6 shadow-[0px_1px_13px_rgba(0,0,0,0.05)] lg:grid lg:px-8 xl:px-10"
              style={{ borderRadius: 4 }}
            >
              <label className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked && !allChecked;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 accent-[#CB262E]"
                  aria-label={safeLabel("selectAllCartItems", "Select all items")}
                />
              </label>
              <span style={sectionLabelStyle}>{t("product")}</span>
              <span className="text-center" style={sectionLabelStyle}>
                {t("price")}
              </span>
              <span className="text-center" style={sectionLabelStyle}>
                {t("quantity")}
              </span>
              <span className="pe-1 text-end" style={sectionLabelStyle}>
                {t("subtotal")}
              </span>
              <div className="min-w-0" aria-hidden />
            </div>

            <label className="mx-auto flex w-full max-w-[343px] items-center gap-2 rounded bg-white px-3 py-3 shadow-[0px_1px_13px_rgba(0,0,0,0.05)] sm:mx-0 sm:max-w-none sm:px-4 lg:hidden">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = someChecked && !allChecked;
                }}
                onChange={toggleSelectAll}
                className="h-4 w-4 shrink-0 accent-[#CB262E]"
                aria-label={
                  allChecked
                    ? safeLabel("unselectAllCartItems", "Unselect all items")
                    : safeLabel("selectAllCartItems", "Select all items")
                }
              />
              <span className="min-w-0 font-sans text-sm font-medium leading-5 text-black">
                {allChecked
                  ? safeLabel("unselectAllCartItems", "Unselect all items")
                  : safeLabel("selectAllCartItems", "Select all items")}
              </span>
            </label>

            {cart.map((item) => {
              const { unit: unitPrice, regular: regularUnitPrice, onSale } =
                getCheckoutLineUnitPrices(item);
              const qty = item.quantity || 1;
              const lineTotal = getCheckoutLineTotal(item);
              const name = item.title || item.name || t("product");
              const campaign = getCheckoutLineCampaign(item);
              const category = item.category_name || item.categories?.[0]?.name || "";
              const displayOptions = getCheckoutLineDisplayOptions(item, {
                size: t("size"),
                colours: t("colours"),
              });
              const productSlug = item.slug || item.product_slug;
              const productId = item.productId ?? item.product_id;
              const cartLineId = item.id ?? item.key;
              const cartLineUuid = getCheckoutLineUuid(item);
              const lineChecked = Boolean(cartLineUuid && checkedSet.has(cartLineUuid));
              const currentVariantUuid = String(item.variantUuid ?? "").trim();
              const currentQty = Math.max(1, Math.floor(Number(qty) || 1));
              const productDetailHref = productSlug ? `/shop/${productSlug}` : null;
              const editHref = productSlug
                ? `/shop/${productSlug}?editCartItemUuid=${encodeURIComponent(
                    cartLineUuid,
                  )}${
                    currentVariantUuid
                      ? `&editVariantUuid=${encodeURIComponent(currentVariantUuid)}`
                      : ""
                  }&editQty=${encodeURIComponent(String(currentQty))}`
                : "/shop";
              const rowKey = String(cartLineId ?? productId ?? name);
              const canMutateLine = cartLineId != null && cartLineId !== "";

              const lineCheckbox = (
                <label className="flex shrink-0 items-center justify-center self-start pt-1">
                  <input
                    type="checkbox"
                    checked={lineChecked}
                    disabled={!cartLineUuid}
                    onChange={() => toggleLineChecked(cartLineUuid)}
                    className="h-4 w-4 accent-[#CB262E]"
                    aria-label={safeLabel("selectCartItem", "Select item")}
                  />
                </label>
              );

              const qtyMinus = () => onQuantityChange?.(cartLineId, Math.max(1, qty - 1));
              const qtyPlus = () => {
                if (qty >= MAX_CART_QUANTITY) return;
                onQuantityChange?.(cartLineId, clampCartQuantity(qty + 1));
              };
              const atMaxQty = qty >= MAX_CART_QUANTITY;
              const handleRemoveLine = () => {
                if (canMutateLine) onRemove?.(cartLineId as string | number);
              };

              const priceLabel = onSale ? (
                <div dir="ltr" className="flex flex-col items-center gap-0.5">
                  <span className="font-sans text-sm leading-5 text-black/50 line-through">
                    {formatAmountWithCurrency(regularUnitPrice, currencyCode, locale)}
                  </span>
                  <span className="font-sans text-base text-[#CB262E]" style={{ lineHeight: "24px" }}>
                    {formatAmountWithCurrency(unitPrice, currencyCode, locale)}
                  </span>
                </div>
              ) : (
                <span dir="ltr" className="font-sans text-base text-black" style={{ lineHeight: "24px" }}>
                  {formatAmountWithCurrency(unitPrice, currencyCode, locale)}
                </span>
              );

              const qtyControlsDesktop = (
                <div dir="ltr" className="flex flex-row items-center gap-2 lg:gap-[7.28px]">
                  <button
                    type="button"
                    onClick={qtyMinus}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white transition-colors hover:bg-gray-100 lg:h-[30.33px] lg:w-[30.33px]"
                    aria-label="-"
                  >
                    <span className="block h-px w-[14.56px] bg-black lg:w-[14.56px]" />
                  </button>
                  <div
                    className="flex h-11 min-w-[40px] items-center justify-center rounded bg-[#CB262E] font-sans text-sm font-normal text-white lg:h-[30.33px] lg:min-w-[35.79px]"
                    style={{ fontSize: 14.56, lineHeight: "15px" }}
                  >
                    {qty}
                  </div>
                  <button
                    type="button"
                    onClick={qtyPlus}
                    disabled={atMaxQty}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 lg:h-[30.33px] lg:w-[30.33px]"
                    aria-label="+"
                  >
                    <svg
                      width={14.56}
                      height={14.56}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-black"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );

              return (
                <Fragment key={rowKey}>
                  {/* Mobile + tablet — flexible row so long item names/options do not clip. */}
                  <div
                    className="mx-auto flex w-full max-w-[343px] flex-col gap-2 rounded-[5px] bg-[#F6F6F6] px-3 py-3 shadow-[0px_1px_13px_rgba(0,0,0,0.05)] sm:mx-0 sm:max-w-none sm:px-4 lg:hidden"
                    style={{ borderRadius: 5 }}
                  >
                    <div className="flex min-w-0 flex-row items-start gap-3">
                      {lineCheckbox}
                      <CartLineProductMedia
                        item={item}
                        alt={name}
                        href={productDetailHref}
                        imageWidth={92}
                        imageHeight={92}
                        className="w-[92px]"
                        imageClassName="aspect-square h-[92px] w-[92px] object-cover"
                        showCampaign={false}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 flex-1 truncate font-sans text-[8px] font-normal capitalize leading-3 text-black/60">
                            {category || "\u00a0"}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveLine}
                            disabled={!canMutateLine}
                            className="shrink-0 p-1 text-[#CB262E] transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-30"
                            aria-label={t("removeItem")}
                          >
                            <CartTrashIcon />
                          </button>
                        </div>
                        <p className="line-clamp-2 font-sans text-xs font-normal capitalize leading-[18px] text-black">
                          {name}
                        </p>
                        <div className="flex flex-row items-start gap-1.5 py-0.5">
                          <div className="flex max-h-6 min-w-0 flex-1 flex-row flex-wrap items-center gap-x-1.5 overflow-hidden font-sans text-[8px] font-normal capitalize leading-3 text-black">
                            {displayOptions.map((option) => (
                              <span key={`${option.label}-${option.value}`}>
                                {option.label}: {option.value}
                              </span>
                            ))}
                          </div>
                          <Link
                            href={editHref}
                            className="shrink-0 cursor-default font-sans text-[8px] font-normal capitalize leading-3 text-black underline"
                          >
                            {t("edit")}
                          </Link>
                        </div>
                        <CartLineCampaignUrgency
                          campaign={campaign}
                          textClassName="text-[10px] leading-4"
                        />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-row items-center justify-between gap-2">
                      <div dir="ltr" className="flex shrink-0 flex-row items-center gap-1">
                        <button
                          type="button"
                          onClick={qtyMinus}
                          className="flex h-7 w-7 items-center justify-center rounded-sm bg-white touch-manipulation"
                          aria-label="-"
                        >
                          <span className="flex h-[21.86px] w-[21.86px] items-center justify-center rounded-sm bg-white">
                            <span className="block h-px w-[10px] bg-black" />
                          </span>
                        </button>
                        <div className="flex h-[21.86px] min-w-[25.79px] items-center justify-center rounded-sm bg-[#CB262E] px-0.5 font-sans text-[10.5px] font-normal leading-[10px] text-white">
                          {qty}
                        </div>
                        <button
                          type="button"
                          onClick={qtyPlus}
                          disabled={atMaxQty}
                          className="flex h-7 w-7 items-center justify-center rounded-sm bg-white touch-manipulation disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="+"
                        >
                          <span className="flex h-[21.86px] w-[21.86px] items-center justify-center rounded-sm bg-white">
                            <svg
                              width={10.5}
                              height={10.5}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-black"
                            >
                              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                          </span>
                        </button>
                      </div>
                      <span dir="ltr" className="min-w-0 flex-1 whitespace-nowrap text-end font-sans text-sm font-normal capitalize leading-5 text-black sm:text-base sm:leading-6">
                        {formatAmountWithCurrency(lineTotal, currencyCode, locale)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop (lg+) — checkbox | product | price | qty | subtotal | trash */}
                  <div
                    className="hidden min-h-[120px] w-full grid-cols-[40px_minmax(0,1fr)_110px_150px_110px_48px] items-start gap-x-4 rounded-lg px-6 py-4 lg:grid lg:px-6 xl:px-8"
                    style={{
                      background: "#F6F6F6",
                      boxShadow: "0px 1px 13px rgba(0, 0, 0, 0.05)",
                      borderRadius: 5,
                    }}
                  >
                    <div className="flex self-center justify-center">{lineCheckbox}</div>
                    <div className="flex min-w-0 flex-row items-start gap-4 self-start">
                      <CartLineProductMedia
                        item={item}
                        alt={name}
                        href={productDetailHref}
                        imageWidth={80}
                        imageHeight={80}
                        className="w-20"
                        imageClassName="aspect-square h-20 w-20 object-cover"
                        showCampaign={false}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        {category ? (
                          <span className="font-sans text-xs capitalize leading-3 text-black/60">
                            {category}
                          </span>
                        ) : null}
                        <span className="line-clamp-2 font-sans text-base capitalize leading-[18px] text-black">
                          {name}
                        </span>
                        <div className="flex flex-row flex-wrap items-center gap-1.5">
                          {displayOptions.map((option) => (
                            <span
                              key={`${option.label}-${option.value}`}
                              className="font-sans text-xs capitalize leading-3 text-black"
                            >
                              {option.label}: {option.value}
                            </span>
                          ))}
                          <Link
                            href={editHref}
                            className="ms-auto cursor-default font-sans text-xs capitalize leading-3 text-black underline"
                          >
                            {t("edit")}
                          </Link>
                        </div>
                        <CartLineCampaignUrgency campaign={campaign} />
                      </div>
                    </div>
                    <div className="self-center text-center">{priceLabel}</div>
                    <div className="flex self-center justify-center">{qtyControlsDesktop}</div>
                    <div
                      className="self-center pe-1 text-end font-sans text-base font-medium text-black"
                      style={{ lineHeight: "24px" }}
                    >
                      {formatAmountWithCurrency(lineTotal, currencyCode, locale)}
                    </div>
                    <div className="flex self-center justify-center">
                      <button
                        type="button"
                        onClick={handleRemoveLine}
                        disabled={!canMutateLine}
                        className="p-1.5 text-[#CB262E] transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-30"
                        aria-label={t("removeItem")}
                      >
                        <CartTrashIcon />
                      </button>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-between sm:gap-4">
            <Link
              href="/shop"
              className="flex min-h-[48px] w-full cursor-default items-center justify-center rounded border border-black/50 font-sans text-base font-medium leading-6 text-black transition-colors hover:bg-black/5 sm:me-auto sm:w-auto sm:min-w-[200px] lg:h-14 lg:w-[222px]"
            >
              {t("returnToShop")}
            </Link>
            {onClearCart ? (
              <button
                type="button"
                onClick={() => onClearCart()}
                className="flex min-h-[48px] w-full items-center justify-center rounded border border-[#CB262E] font-sans text-base font-medium leading-6 text-[#CB262E] transition-colors hover:bg-[#CB262E]/5 sm:ms-auto sm:w-auto sm:min-w-[180px] lg:h-14 lg:w-[195px]"
              >
                {t("clearEntireCart")}
              </button>
            ) : (
              <Link
                href="/shop"
                className="flex min-h-[48px] w-full items-center justify-center rounded border border-black/50 font-sans text-base font-medium leading-6 text-black transition-colors hover:bg-black/5 sm:ms-auto sm:w-auto sm:min-w-[180px] lg:h-14 lg:w-[195px]"
              >
                {t("updateCart")}
              </Link>
            )}
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-8 lg:flex-row lg:items-start lg:justify-between xl:gap-16">
          <div
            className="box-border flex w-full max-w-full shrink-0 flex-col rounded border border-black p-5 sm:p-6 lg:max-w-[470px] lg:p-8 lg:pb-6 lg:pt-8"
            style={{ minHeight: 333, borderRadius: 4 }}
          >
            <h3
              className="mb-5 font-sans text-lg font-medium text-black sm:mb-6 sm:text-xl"
              style={{ lineHeight: "28px" }}
            >
              {t("orderSummary")}
            </h3>
            <FreeShippingBannerFromCart
              variant="embedded"
              className="mb-4"
              cartSubtotal={subtotal}
            />
            <div className="mb-4 flex h-6 flex-row items-center justify-between">
              <span
                className="font-sans text-base text-black"
                style={{ lineHeight: "24px" }}
              >
                {t("subtotal")}
              </span>
              <span
                className="font-sans text-base capitalize text-black"
                style={{ lineHeight: "24px" }}
              >
                {formatAmountWithCurrency(subtotal, currencyCode, locale)}
              </span>
            </div>
            <div className="mb-4 flex h-6 flex-row items-center justify-between">
              <span
                className="font-sans text-base text-black"
                style={{ lineHeight: "24px" }}
              >
                {t("shippingFee")}
              </span>
              <span
                className="font-sans text-base text-black"
                style={{ lineHeight: "24px" }}
              >
                {cartSummary.shipping_total == null
                  ? safeLabel("calculatedAtCheckout", "Calculated at checkout")
                  : shippingTotal === 0
                    ? t("free") || "Free"
                    : formatAmountWithCurrency(shippingTotal, currencyCode, locale)}
              </span>
            </div>
            <div className="mb-4 flex h-6 flex-row items-center justify-between">
              <span
                className="font-sans text-base text-black"
                style={{ lineHeight: "24px" }}
              >
                {t("discount")}
              </span>
              <span
                dir="ltr"
                className="font-sans text-base text-black"
                style={{ lineHeight: "24px" }}
              >
                {discount > 0 ? formatAmountWithCurrency(-discount, currencyCode, locale) : "-"}
              </span>
            </div>
            <div className="my-4 w-full border-t border-black/40" />
            <div className="mb-6 flex h-6 flex-row items-center justify-between">
              <span
                className="font-sans text-base text-black"
                style={{ lineHeight: "24px" }}
              >
                {t("grandTotal")}
              </span>
              <span
                className="font-sans text-xl capitalize text-black"
                style={{ lineHeight: "24px" }}
              >
                {formatAmountWithCurrency(grandTotal, currencyCode, locale)}
              </span>
            </div>
            {minimumOrderAchieved && someChecked ? (
              <Link
                href="/checkout"
                onClick={onProceedCheckoutClick}
                className="mt-auto flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded bg-[#CB262E] font-sans text-base font-medium leading-6 text-[#FAFAFA] transition-opacity hover:opacity-90 lg:h-14"
              >
                {t("continueCheckout")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!someChecked) {
                    toast.error(
                      safeLabel(
                        "selectCartItemsToCheckout",
                        "Select at least one item to checkout",
                      ),
                      { position: "top-center", autoClose: 3000 },
                    );
                    return;
                  }
                  handleBlockedCheckout();
                }}
                className="mt-auto flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded bg-[#CB262E] font-sans text-base font-medium leading-6 text-[#FAFAFA] transition-opacity hover:opacity-90 active:opacity-95 lg:h-14"
              >
                {t("continueCheckout")}
              </button>
            )}
          </div>
        </div>
        <SimilarProductsSection />
      </div>

    </div>
  );
}

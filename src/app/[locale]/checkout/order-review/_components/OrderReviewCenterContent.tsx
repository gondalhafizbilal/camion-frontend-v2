"use client";

import type { ReactNode } from "react";
import Image from "@/componentsedit/StaticImage";
import { useLocale, useTranslations } from "next-intl";
import Roadmap from "@/componentsedit/Roadmap";
import { PaymentMethodIconByType } from "@/componentsedit/PaymentMethodIcons";
import ShippingMethodFourPxRow from "../../_components/ShippingMethodFourPxRow";
import CheckoutOrderSummaryProductsScroll from "../../_components/CheckoutOrderSummaryProductsScroll";
import {
  getCheckoutLineDisplayOptions,
  type CartSummaryShape,
  type CheckoutCartLine,
  type OrderReviewData,
} from "@/types/checkoutDisplay";
import {
  CHECKOUT_FLOW_PAGE_SHELL_CLASS,
  PAGE_CONTENT_INNER_CLASS,
} from "@/lib/layout/pageContentLayout";
import FreeShippingBannerFromCart from "@/componentsedit/cart/FreeShippingBannerFromCart";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";

const sectionTitleStyle = "font-sans font-medium text-[#000000] text-xl leading-5";
const rowBoxStyle =
  "box-border flex flex-row items-center w-full bg-white border border-black/15 rounded-[5px] font-sans font-medium text-[#000000] py-2 px-6";
const labelStyle =
  "font-sans font-normal text-[#000000] text-sm leading-[18px] capitalize";

function ProcessingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:180ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:360ms]" />
      </span>
    </span>
  );
}

export type OrderReviewCenterContentProps = {
  cart?: CheckoutCartLine[];
  cartSummary?: CartSummaryShape;
  shippingCost?: number;
  subtotal?: number;
  discount?: number;
  grandTotal?: number;
  currencyCode?: string;
  appliedCouponCode?: string | null;
  couponInput?: string;
  setCouponInput?: (value: string) => void;
  onApplyCoupon?: () => void;
  applyingCoupon?: boolean;
  onPlaceOrder?: () => void | Promise<void>;
  primaryActionLabel?: string;
  placingOrder?: boolean;
  reviewData?: OrderReviewData;
  paymentDialogOpen?: boolean;
  onClosePaymentDialog?: () => void;
  onSubmitPaymentDialog?: () => void;
  paymentDialogSubmitting?: boolean;
  paymentFormReady?: boolean;
  /** When paying with SkipCash, we render the SDK-mount container here. */
  skipCashCardForm?: ReactNode;
};

export default function OrderReviewCenterContent({
  cart = [],
  cartSummary: _cartSummary = {},
  shippingCost = 0,
  subtotal = 0,
  discount = 0,
  grandTotal = 0,
  currencyCode = "QAR",
  appliedCouponCode = null,
  couponInput = "",
  setCouponInput,
  onApplyCoupon,
  applyingCoupon,
  onPlaceOrder,
  primaryActionLabel,
  placingOrder = false,
  reviewData = {},
  paymentDialogOpen = false,
  onClosePaymentDialog,
  onSubmitPaymentDialog,
  paymentDialogSubmitting = false,
  paymentFormReady = false,
  skipCashCardForm,
}: OrderReviewCenterContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const couponCodeDisplay =
    (appliedCouponCode ?? "").trim() ||
    (discount > 0 ? String(couponInput ?? "").trim() : "");
  const {
    fullName = "",
    email = "",
    phone = "",
    shippingAddressLine = "",
    shippingCarrierName = "",
    shippingMethodTransit = "",
    estimatedDeliveryEta = "",
    shippingCarrierCost = 0,
    paymentMethodType = "mastercard",
  } = reviewData;

  const breadcrumbItems = [
    { label: t("home"), href: "/" },
    { label: t("cart"), href: "/cart" },
    { label: t("checkout"), href: "/checkout" },
    { label: t("orderReview") },
  ].filter((i) => i.label);

  return (
    <div className={`${CHECKOUT_FLOW_PAGE_SHELL_CLASS} pt-6 pb-12 bg-white`}>
      <div className={PAGE_CONTENT_INNER_CLASS}>
        <div className="flex flex-col gap-6 mb-8">
          <Roadmap items={breadcrumbItems} />
        </div>

        <div className="flex flex-col xl:flex-row xl:items-start gap-10 xl:gap-[70px]">
          <div className="flex flex-col gap-6 w-full xl:max-w-[550px]">
            <h1
              className="font-sans font-medium text-[#000000]"
              style={{ fontSize: 20, lineHeight: "30px" }}
            >
              {t("orderReview")}
            </h1>

            <section className="flex flex-col gap-3">
              <h2 className={sectionTitleStyle}>{t("personalInformation")}</h2>
              <div className="flex flex-col gap-2">
                <div className={rowBoxStyle} style={{ height: 50 }}>
                  <span style={{ fontSize: 14, lineHeight: "24px" }}>
                    {fullName || "—"}
                  </span>
                </div>
                <div className={rowBoxStyle} style={{ height: 50 }}>
                  <span style={{ fontSize: 14, lineHeight: "24px" }}>{email || "—"}</span>
                </div>
                <div className={rowBoxStyle} style={{ height: 50 }}>
                  <span
                    dir="ltr"
                    className="text-start"
                    style={{ fontSize: 14, lineHeight: "24px" }}
                  >
                    {phone || "—"}
                  </span>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className={sectionTitleStyle}>{t("shippingTo")}</h2>
              <div
                className="box-border flex flex-col gap-1 w-full border border-black/15 rounded-[5px] py-[18px] px-6"
                style={{ minHeight: 100 }}
              >
                <span className={labelStyle}>{t("shippingAddress")}</span>
                <span className="font-sans font-medium text-[#000000] capitalize text-sm leading-[18px]">
                  {shippingAddressLine || "—"}
                </span>
              </div>
              <ShippingMethodFourPxRow
                variant="orderReview"
                fee={Number(shippingCarrierCost ?? 0)}
                currencyCode={currencyCode}
                transitText={
                  shippingMethodTransit ||
                  String(shippingCarrierName ?? "").trim() ||
                  undefined
                }
                eta={estimatedDeliveryEta}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className={sectionTitleStyle}>{t("paymentMethod")}</h2>
              <div className="box-border flex flex-row items-center gap-3 w-full h-[50px] bg-white border border-black/15 rounded-[5px] py-3 px-6">
                <PaymentMethodIconByType type={paymentMethodType} />
                <span
                  className="font-sans font-normal text-black/60 flex-1"
                  style={{ fontSize: 14, lineHeight: "18px" }}
                >
                  {t("cardPayment")}
                </span>
              </div>

              {skipCashCardForm && !paymentDialogOpen ? (
                <div className="w-full">{skipCashCardForm}</div>
              ) : null}
            </section>
          </div>

          <div className="flex flex-col w-full xl:max-w-[550px] flex-shrink-0">
            <h2
              className="font-sans font-medium text-[#000000] mb-6"
              style={{ fontSize: 20, lineHeight: "20px" }}
            >
              {t("orderSummary")}
            </h2>
            <CheckoutOrderSummaryProductsScroll itemCount={cart.length}>
              {cart.map((item, idx) => {
                const img = item.image || item.thumbnail || "/assets/images/no-image.png";
                const name = item.title || item.name || "Product";
                const category = item.category_name || item.categories?.[0]?.name || "";
                const displayOptions = getCheckoutLineDisplayOptions(item, {
                  size: t("size"),
                  colours: t("colours"),
                });
                const price = Number(item.price) || 0;
                const qty = item.quantity || 1;
                const bgCard = idx % 2 === 0 ? "#ECEFF1" : "#F1F1F1";
                return (
                  <div
                    key={item.id ?? item.key ?? idx}
                    className="flex flex-row items-center gap-3 p-2 rounded-[5px] flex-shrink-0"
                    style={{ minHeight: 120, background: bgCard }}
                  >
                    <div
                      className="relative flex-shrink-0 rounded-[5px] overflow-hidden bg-[#E3E7EA]"
                      style={{ width: 80, height: 104 }}
                    >
                      <Image
                        src={img}
                        alt={name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      {category && (
                        <span
                          className="font-sans font-normal text-[#000000] capitalize"
                          style={{ fontSize: 8, lineHeight: "12px" }}
                        >
                          {category}
                        </span>
                      )}
                      <span
                        className="font-sans font-semibold text-[#000000] capitalize"
                        style={{ fontSize: 12, lineHeight: "18px" }}
                      >
                        {name}
                      </span>
                      {displayOptions.length > 0 ? (
                        <div className="flex flex-row flex-wrap gap-1.5">
                          {displayOptions.map((option) => (
                            <span
                              key={`${option.label}-${option.value}`}
                              className="font-sans font-normal text-[#000000] capitalize"
                              style={{ fontSize: 8, lineHeight: "12px" }}
                            >
                              {option.label}: {option.value}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex flex-row items-center gap-3 mt-1">
                        <span
                          className="font-sans font-semibold text-[#000000] capitalize"
                          style={{ fontSize: 14, lineHeight: "24px" }}
                        >
                          {formatAmountWithCurrency(price, currencyCode, locale)}
                        </span>
                        <span
                          className="font-sans font-normal text-black/60 text-end capitalize"
                          style={{ fontSize: 12, lineHeight: "18px" }}
                        >
                          X {qty}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CheckoutOrderSummaryProductsScroll>

            <div className="flex flex-row items-end gap-4 mb-6 flex-wrap">
              <input
                type="text"
                placeholder={t("enterCouponCode")}
                value={couponInput}
                onChange={(e) => setCouponInput?.(e.target.value)}
                className="font-sans border border-[#D9D9D9] rounded outline-none px-6 placeholder:opacity-50"
                style={{
                  width: "100%",
                  maxWidth: 391,
                  height: 50,
                  fontSize: 14,
                  lineHeight: "24px",
                }}
              />
              <button
                type="button"
                onClick={() => onApplyCoupon?.()}
                disabled={applyingCoupon}
                className="flex items-center justify-center font-sans font-medium text-[#FAFAFA] bg-[#CB262E] rounded hover:opacity-90 transition-opacity disabled:opacity-70"
                style={{
                  width: 143,
                  height: 50,
                  padding: "16px 48px",
                  fontSize: 16,
                  lineHeight: "24px",
                }}
              >
                {t("apply")}
              </button>
            </div>

            <div className="box-border flex flex-col border-t border-b border-black/15 py-5 px-6 gap-6 mb-6">
              <h3
                className="font-sans font-normal text-[#000000] capitalize"
                style={{ fontSize: 16, lineHeight: "24px" }}
              >
                {t("orderSummary")}
              </h3>
              <FreeShippingBannerFromCart
                variant="embedded"
                cartSubtotal={subtotal}
                shippingKnown
                shippingTotal={shippingCost}
              />
              <div className="flex flex-col gap-3">
                <div className="flex flex-row items-center justify-between">
                  <span
                    className="font-sans font-normal text-[#000000] capitalize"
                    style={{ fontSize: 16, lineHeight: "18px" }}
                  >
                    {t("subtotal")}
                  </span>
                  <span
                    className="font-sans font-normal text-[#000000] text-end capitalize"
                    style={{ fontSize: 16, lineHeight: "24px" }}
                  >
                    {formatAmountWithCurrency(subtotal, currencyCode, locale)}
                  </span>
                </div>
                <div className="flex flex-row items-center justify-between">
                  <span
                    className="font-sans font-normal text-[#000000] capitalize"
                    style={{ fontSize: 16, lineHeight: "18px" }}
                  >
                    {t("discount")}
                    {couponCodeDisplay ? ` (${couponCodeDisplay})` : ""}
                  </span>
                  <span
                    dir="ltr"
                    className="font-sans font-normal text-[#000000] text-end capitalize"
                    style={{ fontSize: 16, lineHeight: "24px" }}
                  >
                    {discount > 0
                      ? formatAmountWithCurrency(-discount, currencyCode, locale)
                      : "-"}
                  </span>
                </div>
                <div className="flex flex-row items-center justify-between">
                  <span
                    className="font-sans font-normal text-[#000000] capitalize"
                    style={{ fontSize: 16, lineHeight: "18px" }}
                  >
                    {t("shippingFee")}
                  </span>
                  <span
                    className="font-sans font-normal text-[#000000] text-end capitalize"
                    style={{ fontSize: 16, lineHeight: "24px" }}
                  >
                    {formatAmountWithCurrency(shippingCost, currencyCode, locale)}
                  </span>
                </div>
                <div className="flex flex-row items-start justify-between">
                  <span
                    className="font-sans font-medium text-[#000000] capitalize"
                    style={{ fontSize: 16, lineHeight: "24px" }}
                  >
                    {t("grandTotal")}
                  </span>
                  <span
                    className="font-sans font-normal text-[#000000] text-end capitalize"
                    style={{ fontSize: 20, lineHeight: "24px" }}
                  >
                    {formatAmountWithCurrency(grandTotal, currencyCode, locale)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void onPlaceOrder?.()}
              disabled={placingOrder}
              className="w-full flex flex-row justify-center items-center font-sans font-medium text-[#FAFAFA] bg-[#CB262E] rounded hover:opacity-90 transition-opacity disabled:opacity-70 disabled:pointer-events-none"
              style={{
                height: 56,
                padding: "16px 48px",
                fontSize: 16,
                lineHeight: "24px",
              }}
            >
              {placingOrder ? (
                <ProcessingButtonLabel
                  label={t("paymentProcessing") || "Payment is being processed"}
                />
              ) : (
                primaryActionLabel || t("placeOrder")
              )}
            </button>
          </div>
        </div>
      </div>

      {paymentDialogOpen && skipCashCardForm ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClosePaymentDialog}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-6">
            <div className="w-full bg-white shadow-[0_-12px_32px_rgba(0,0,0,0.14)] rounded-t-[20px] md:rounded-[18px] md:max-w-[520px] md:shadow-[0_18px_40px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CB262E] text-white font-sans font-bold text-sm">
                    C
                  </div>
                  <div className="font-sans font-semibold text-black text-base">
                    {t("securePayment") || "Secure payment"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClosePaymentDialog}
                  className="text-2xl leading-none text-black/70"
                >
                  ×
                </button>
              </div>

              <div className="p-5 md:max-h-[70vh] md:overflow-y-auto">
                {!paymentFormReady ? (
                  <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-[#000000]/60">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#CB262E]/20 border-t-[#CB262E]" />
                    <span className="font-sans text-sm">
                      {t("loadingSkipCashPayment")}
                    </span>
                  </div>
                ) : (
                  skipCashCardForm
                )}
              </div>

              <div className="border-t border-black/10 p-5">
                <button
                  type="button"
                  onClick={() => void onSubmitPaymentDialog?.()}
                  disabled={paymentDialogSubmitting || !paymentFormReady}
                  className="w-full h-12 rounded-[5px] bg-[#CB262E] text-white font-sans font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {paymentDialogSubmitting ? (
                    <ProcessingButtonLabel
                      label={t("paymentProcessing") || "Payment is being processed"}
                    />
                  ) : (
                    t("placeOrder")
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

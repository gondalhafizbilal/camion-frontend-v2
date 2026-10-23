"use client";

import Image from "@/componentsedit/StaticImage";
import { useLocale, useTranslations } from "next-intl";
import Roadmap from "@/componentsedit/Roadmap";
import {
  getCheckoutLineDisplayOptions,
  type CardDetailsDraft,
  type CartSummaryShape,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";
import CheckoutOrderSummaryProductsScroll from "../../_components/CheckoutOrderSummaryProductsScroll";
import CheckoutPaymentMethodList from "../../_components/CheckoutPaymentMethodList";
import {
  CHECKOUT_FLOW_PAGE_SHELL_CLASS,
  PAGE_CONTENT_INNER_CLASS,
} from "@/lib/layout/pageContentLayout";
import FreeShippingBannerFromCart from "@/componentsedit/cart/FreeShippingBannerFromCart";
import {
  formatAmountWithCurrency,
} from "@/lib/currency/localizedCurrencyCode";

const inputBoxStyle =
  "box-border flex flex-row items-center w-full bg-white border border-black/15 rounded-[5px] font-sans outline-none focus:border-[#CB262E] transition-colors py-2 px-6";
const labelStyle = "font-sans font-normal text-[#000000] text-base leading-6";
const sectionTitleStyle = "font-sans font-medium text-[#000000] text-xl leading-5";

export type PaymentCenterContentProps = {
  cart?: CheckoutCartLine[];
  cartSummary?: CartSummaryShape;
  shippingCost?: number;
  shippingKnown?: boolean;
  subtotal?: number;
  discount?: number;
  grandTotal?: number;
  currencyCode?: string;
  onConfirmPayment?: () => void;
  confirmButtonLabel?: string;
  selectedPaymentMethod?: string;
  setSelectedPaymentMethod?: (id: string) => void;
  /** When true, shows card number / CVV fields (hidden by default). */
  showCardDetailsSection?: boolean;
  cardDetails?: CardDetailsDraft;
  setCardDetails?: (next: CardDetailsDraft) => void;
  rememberCard?: boolean;
  setRememberCard?: (value: boolean) => void;
};

export default function PaymentCenterContent({
  cart = [],
  cartSummary: _cartSummary = {},
  shippingCost = 0,
  shippingKnown = false,
  subtotal = 0,
  discount = 0,
  grandTotal = 0,
  currencyCode = "QAR",
  onConfirmPayment,
  confirmButtonLabel,
  selectedPaymentMethod = "",
  setSelectedPaymentMethod,
  showCardDetailsSection = false,
  cardDetails = {},
  setCardDetails,
  rememberCard = false,
  setRememberCard,
}: PaymentCenterContentProps) {
  const t = useTranslations();
  const locale = useLocale();

  const breadcrumbItems = [
    { label: t("home"), href: "/" },
    { label: t("cart"), href: "/cart" },
    { label: t("checkout"), href: "/checkout" },
    { label: t("payment") },
  ].filter((i) => i.label);

  return (
    <div className={`${CHECKOUT_FLOW_PAGE_SHELL_CLASS} pt-6 pb-12 bg-white`}>
      <div className={PAGE_CONTENT_INNER_CLASS}>
        <div className="flex flex-col gap-6 mb-8">
          <Roadmap items={breadcrumbItems} />
        </div>

        <div className="flex flex-col xl:flex-row xl:items-start gap-10 xl:gap-[70px]">
          <div className="flex flex-col gap-10 w-full xl:max-w-[550px]">
          <CheckoutPaymentMethodList
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={setSelectedPaymentMethod}
          />

          {showCardDetailsSection ? (
            <section className="flex flex-col gap-3">
              <h2 className={sectionTitleStyle}>{t("addCardDetails")}</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <label className={labelStyle}>{t("cardNumber")}*</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardDetails.number ?? ""}
                    onChange={(e) =>
                      setCardDetails?.({ ...cardDetails, number: e.target.value })
                    }
                    className={inputBoxStyle}
                    style={{ height: 50 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelStyle}>{t("cardName")}*</label>
                  <input
                    type="text"
                    placeholder=""
                    value={cardDetails.name ?? ""}
                    onChange={(e) =>
                      setCardDetails?.({ ...cardDetails, name: e.target.value })
                    }
                    className={inputBoxStyle}
                    style={{ height: 50 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelStyle}>{t("expiryDate")}*</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry ?? ""}
                    onChange={(e) =>
                      setCardDetails?.({ ...cardDetails, expiry: e.target.value })
                    }
                    className={inputBoxStyle}
                    style={{ height: 50 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelStyle}>{t("cvv")}*</label>
                  <input
                    type="text"
                    placeholder="***"
                    value={cardDetails.cvv ?? ""}
                    onChange={(e) =>
                      setCardDetails?.({ ...cardDetails, cvv: e.target.value })
                    }
                    className={inputBoxStyle}
                    style={{ height: 50 }}
                  />
                </div>
              </div>
              <div className="flex flex-row items-start gap-4 mt-4">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberCard}
                  onClick={() => setRememberCard?.(!rememberCard)}
                  className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
                  style={{
                    background: rememberCard ? "#CB262E" : "transparent",
                    border: rememberCard ? "none" : "1px solid rgba(0,0,0,0.2)",
                  }}
                >
                  {rememberCard && (
                    <svg
                      width={14}
                      height={10}
                      viewBox="0 0 14 10"
                      fill="none"
                      className="text-white"
                    >
                      <path
                        d="M1 5l4 4 8-8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className="font-sans font-medium text-[#000000]"
                  style={{ fontSize: 16, lineHeight: "24px", flex: 1 }}
                >
                  {t("rememberCard")}
                </span>
              </div>
            </section>
          ) : null}
          </div>

          <div className="flex flex-col w-full xl:max-w-[550px] flex-shrink-0">
          <h2
            className="font-sans font-medium text-[#000000] mb-6"
            style={{ fontSize: 20, lineHeight: "20px" }}
          >
            {t("orderSummary")}
          </h2>
          <CheckoutOrderSummaryProductsScroll itemCount={cart.length}>
            {cart.map((item) => {
              const img = item.image || item.thumbnail || "/assets/images/no-image.png";
              const name = item.name || "Product";
              const category = item.category_name || item.categories?.[0]?.name || "";
              const displayOptions = getCheckoutLineDisplayOptions(item, {
                size: t("size"),
                colours: t("colours"),
              });
              const price = Number(item.price) || 0;
              const qty = item.quantity || 1;
              return (
                <div
                  key={item.id ?? item.key}
                  className="flex flex-row items-center gap-3 p-2 rounded-[5px] bg-[#ECEFF1]"
                  style={{ minHeight: 120 }}
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
              shippingKnown={shippingKnown}
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
                </span>
                <span
                  dir="ltr"
                  className="font-sans font-normal text-[#000000] text-end capitalize"
                  style={{ fontSize: 16, lineHeight: "24px" }}
                >
                  {discount > 0 ? formatAmountWithCurrency(-discount, currencyCode, locale) : "-"}
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
                  {shippingKnown
                    ? formatAmountWithCurrency(shippingCost, currencyCode, locale)
                    : t("calculatedAtCheckout")}
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
            onClick={onConfirmPayment}
            className="w-full flex flex-row justify-center items-center font-sans font-medium text-[#FAFAFA] bg-[#CB262E] rounded hover:opacity-90 transition-opacity"
            style={{ height: 56, padding: "16px 48px", fontSize: 16, lineHeight: "24px" }}
          >
            {confirmButtonLabel ?? t("confirmPayment")}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

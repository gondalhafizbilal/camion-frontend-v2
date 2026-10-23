"use client";

import { useEffect, useState, type SetStateAction } from "react";
import { useLocale, useTranslations } from "next-intl";
import Roadmap from "@/componentsedit/Roadmap";
import {
  type AddressDraft,
  type CartSummaryShape,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";
import type { SavedShippingAddress } from "@/lib/checkout/savedAddressesFromUser";
import { splitFullNameToLegacy } from "@/lib/checkout/savedAddressesFromUser";
import CheckoutSavedAddressList from "./CheckoutSavedAddressList";
import CountryCodeCombobox from "@/componentsedit/auth/CountryCodeCombobox";
import CheckoutAddressFormModal from "./CheckoutAddressFormModal";
import CheckoutPaymentMethodList from "./CheckoutPaymentMethodList";
import SkipCashSavedCardsSelector from "./SkipCashSavedCardsSelector";
import { PaymentMethodIconByType } from "@/componentsedit/PaymentMethodIcons";
import {
  CHECKOUT_FLOW_PAGE_SHELL_CLASS,
  PAGE_CONTENT_INNER_CLASS,
} from "@/lib/layout/pageContentLayout";
import FreeShippingBannerFromCart from "@/componentsedit/cart/FreeShippingBannerFromCart";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";

const inputBoxStyle =
  "box-border flex flex-row items-center w-full bg-white border border-black/15 rounded-[5px] font-sans outline-none focus:border-[#CB262E] transition-colors";
const inputPadding = "py-2 px-6";
const labelStyle = "font-sans font-normal text-[#000000] text-base leading-6";
const sectionTitleStyle = "font-sans font-medium text-[#000000] text-xl leading-5";

export type CheckoutCenterContentProps = {
  cart?: CheckoutCartLine[];
  addressData?: AddressDraft;
  setAddressData?: (next: SetStateAction<AddressDraft>) => void;
  phoneCountryCode?: string;
  setPhoneCountryCode?: (next: string) => void;
  cartSummary?: CartSummaryShape;
  shippingCost?: number;
  /** When false, shipping fee is not shown as a fixed amount (preview pending). */
  shippingKnown?: boolean;
  subtotal?: number;
  discount?: number;
  grandTotal?: number;
  currencyCode?: string;
  onApplyCoupon?: () => void;
  appliedCoupon?: unknown;
  couponInput?: string;
  setCouponInput?: (value: string) => void;
  applyingCoupon?: boolean;
  onPlaceOrder?: () => void;
  /** When true, Continue is disabled (e.g. no verified saved address). */
  continueToPaymentDisabled?: boolean;
  /** Continue CTA label; defaults to continue to order review. */
  continueButtonLabel?: string;
  selectedPaymentMethod?: string;
  setSelectedPaymentMethod?: (id: string) => void;
  /** Increment to scroll to shipping address and flash a highlight (e.g. validation failed). */
  shippingAddressHighlightKey?: number;
  saveForNextTime?: boolean;
  setSaveForNextTime?: (value: boolean) => void;
  /** SkipCash: if present, the checkout will use this tokenId (instead of collecting a new card). */
  skipcashSavedCardTokenId?: string | null;
  setSkipcashSavedCardTokenId?: (tokenId: string | null) => void;
  savedAddresses?: SavedShippingAddress[];
  selectedSavedAddressId?: string | null;
  onSelectSavedAddress?: (id: string) => void;
  onSaveAddressFromForm?: () => void | Promise<void>;
  savingAddress?: boolean;
  onSetDefaultSavedAddress?: (id: string) => void | Promise<void>;
  settingDefaultId?: string | null;
  /** My Account–style modal for add / edit shipping address */
  addressFormModalOpen?: boolean;
  onCloseAddressFormModal?: () => void;
  onOpenAddAddressModal?: () => void;
  onOpenEditAddressModal?: (id: string) => void;
  addressFormEditingUuid?: string | null;
};

export default function CheckoutCenterContent({
  cart: _cart = [],
  addressData = {},
  setAddressData,
  phoneCountryCode = "+974",
  setPhoneCountryCode,
  cartSummary: _cartSummary = {},
  shippingCost = 0,
  shippingKnown = false,
  subtotal = 0,
  discount = 0,
  grandTotal = 0,
  currencyCode = "QAR",
  onApplyCoupon,
  appliedCoupon: _appliedCoupon,
  couponInput = "",
  setCouponInput,
  applyingCoupon,
  onPlaceOrder,
  continueToPaymentDisabled = false,
  continueButtonLabel,
  selectedPaymentMethod = "mastercard",
  setSelectedPaymentMethod,
  shippingAddressHighlightKey = 0,
  saveForNextTime = false,
  setSaveForNextTime,
  skipcashSavedCardTokenId = null,
  setSkipcashSavedCardTokenId,
  savedAddresses = [],
  selectedSavedAddressId = null,
  onSelectSavedAddress,
  onSaveAddressFromForm,
  savingAddress = false,
  onSetDefaultSavedAddress,
  settingDefaultId = null,
  addressFormModalOpen = false,
  onCloseAddressFormModal,
  onOpenAddAddressModal,
  onOpenEditAddressModal,
  addressFormEditingUuid = null,
}: CheckoutCenterContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const showCoupon = Boolean(onApplyCoupon && setCouponInput);
  const [shippingSectionFlash, setShippingSectionFlash] = useState(false);

  useEffect(() => {
    if (shippingAddressHighlightKey <= 0) return;
    const el = document.getElementById("checkout-shipping-address-section");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setShippingSectionFlash(true);
    const id = window.setTimeout(() => setShippingSectionFlash(false), 4000);
    return () => window.clearTimeout(id);
  }, [shippingAddressHighlightKey]);

  const breadcrumbItems = [
    { label: t("home"), href: "/" },
    { label: t("cart"), href: "/cart" },
    { label: t("checkout") },
  ].filter((i) => i.label);

  const personalFullNameDisplay =
    addressData.contactFullName?.trim() ||
    [addressData.first_name, addressData.last_name]
      .filter((p) => (p ?? "").trim() !== "")
      .join(" ")
      .trim();
  return (
    <div className={`${CHECKOUT_FLOW_PAGE_SHELL_CLASS} pt-6 pb-12 bg-white relative`}>
      <div className={PAGE_CONTENT_INNER_CLASS}>
        <div className="flex flex-col gap-6 mb-8">
          <Roadmap items={breadcrumbItems} />
          <h1
            className="font-sans font-medium text-[#000000]"
            style={{ fontSize: 20, lineHeight: "30px" }}
          >
            {t("checkout")}
          </h1>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-start gap-10 xl:gap-[70px]">
          <div className="flex flex-col gap-10 w-full xl:max-w-[550px]">
            <section className="flex flex-col gap-3">
              <h2 className={sectionTitleStyle}>{t("personalInformation")}</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <label className={labelStyle}>{t("fullName")}*</label>
                  <input
                    type="text"
                    value={personalFullNameDisplay}
                    onChange={(e) => {
                      const v = e.target.value;
                      const leg = splitFullNameToLegacy(v);
                      setAddressData?.({
                        ...addressData,
                        contactFullName: v,
                        first_name: leg.first_name,
                        last_name: leg.last_name,
                      });
                    }}
                    className={`${inputBoxStyle} ${inputPadding}`}
                    style={{ height: 50 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelStyle}>{t("emailAddress")}</label>
                  <input
                    type="email"
                    value={addressData.email ?? ""}
                    onChange={(e) =>
                      setAddressData?.({ ...addressData, email: e.target.value })
                    }
                    className={`${inputBoxStyle} ${inputPadding}`}
                    style={{ height: 50 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelStyle}>{t("phoneNumber")}</label>
                  <div
                    dir="ltr"
                    className={`${inputBoxStyle} ${inputPadding} gap-2`}
                    style={{ height: 50 }}
                  >
                    <CountryCodeCombobox
                      value={phoneCountryCode}
                      onChange={(v: string) => setPhoneCountryCode?.(String(v || "+974"))}
                      ariaLabel={t("countryCode") || "Country code"}
                    />
                    <input
                      type="tel"
                      dir="ltr"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={addressData.phone ?? ""}
                      onChange={(e) =>
                        setAddressData?.({ ...addressData, phone: e.target.value })
                      }
                      className="flex-1 min-w-0 font-sans font-medium text-sm leading-6 text-[#000000] bg-transparent border-none outline-none text-start"
                      placeholder="12345678910"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section
              id="checkout-shipping-address-section"
              aria-labelledby="checkout-shipping-address-heading"
              className={`flex flex-col gap-3 rounded-[10px] scroll-mt-24 transition-[box-shadow,background-color] duration-500 ${
                shippingSectionFlash
                  ? "ring-2 ring-[#CB262E] ring-offset-2 ring-offset-white bg-[#FFF5F5] shadow-md"
                  : ""
              }`}
            >
              <h2 id="checkout-shipping-address-heading" className={sectionTitleStyle}>
                {t("shippingAddress")}
              </h2>
              <div className="flex flex-col gap-3 w-full max-w-[550px]">
                {savedAddresses.length > 0 ? (
                  <CheckoutSavedAddressList
                    options={savedAddresses}
                    selectedId={selectedSavedAddressId}
                    onSelect={(id) => onSelectSavedAddress?.(id)}
                    onSetDefault={onSetDefaultSavedAddress}
                    onEdit={onOpenEditAddressModal}
                    editLabel={t("edit")}
                    defaultBadgeLabel={t("defaultAddressBadge")}
                    deliverToLabel={t("chooseDeliveryAddress")}
                    setAsDefaultLabel={t("setAsDefault")}
                    settingDefaultId={settingDefaultId}
                  />
                ) : (
                  <p className="font-sans text-sm leading-6 text-black/60 sm:text-base">
                    {t("noSavedAddressesHint")}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => onOpenAddAddressModal?.()}
                  className={`${inputBoxStyle} ${inputPadding} justify-center font-sans font-medium text-base leading-6 text-[#000000] hover:bg-gray-50 w-full min-h-[50px]`}
                >
                  {t("addNewAddress")}
                </button>
              </div>
            </section>

            {/* Save-for-next-time checkbox is displayed after saved cards and new-card selector */}
          </div>

          <div className="flex flex-col w-full xl:max-w-[550px] flex-shrink-0">
            <CheckoutPaymentMethodList
              selectedPaymentMethod={selectedPaymentMethod}
              onSelectPaymentMethod={setSelectedPaymentMethod}
              className="mb-6"
            />

            <SkipCashSavedCardsSelector
              selectedPaymentMethod={selectedPaymentMethod}
              selectedSavedCardTokenId={skipcashSavedCardTokenId}
              onSelectSavedCardTokenId={setSkipcashSavedCardTokenId}
            />

            <div className="flex flex-col gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setSkipcashSavedCardTokenId?.(null);
                  setSelectedPaymentMethod?.("mastercard");
                }}
                className={`box-border flex flex-row items-center w-full gap-[11px] py-2 px-6 rounded-[5px] border bg-white transition-colors ${
                  skipcashSavedCardTokenId === null && selectedPaymentMethod !== "debit"
                    ? "border-[#CB262E]"
                    : "border-black/15"
                }`}
                style={{ height: 50 }}
              >
                <PaymentMethodIconByType type="mastercard" />
                <span
                  className="font-sans font-medium text-[#000000] flex-1 text-start"
                  style={{ fontSize: 16, lineHeight: "24px" }}
                >
                  {t("payWithNewCard")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSkipcashSavedCardTokenId?.(null);
                  setSelectedPaymentMethod?.("debit");
                }}
                className={`box-border flex flex-row items-center w-full gap-[11px] py-2 px-6 rounded-[5px] border bg-white transition-colors ${
                  selectedPaymentMethod === "debit"
                    ? "border-[#CB262E]"
                    : "border-black/15"
                }`}
                style={{ height: 50 }}
              >
                <PaymentMethodIconByType type="debit" />
                <span
                  className="font-sans font-medium text-[#000000] flex-1 text-start"
                  style={{ fontSize: 16, lineHeight: "24px" }}
                >
                  {t("paymentMethodDebit")}
                </span>
              </button>

              <div className="flex flex-row items-start gap-4">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={saveForNextTime}
                  onClick={() => setSaveForNextTime?.(!saveForNextTime)}
                  className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors"
                  style={{
                    background: saveForNextTime ? "#CB262E" : "transparent",
                    border: saveForNextTime ? "none" : "1px solid rgba(0,0,0,0.2)",
                  }}
                >
                  {saveForNextTime && (
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
                  className="font-sans font-normal text-base leading-6 text-[#000000]"
                  style={{ flex: 1 }}
                >
                  {t("saveInfoForNextTime")}
                </span>
              </div>
            </div>

            {showCoupon && (
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
            )}

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
              onClick={onPlaceOrder}
              aria-disabled={continueToPaymentDisabled}
              className={`w-full flex flex-row justify-center items-center font-sans font-medium text-[#FAFAFA] bg-[#CB262E] rounded transition-opacity ${
                continueToPaymentDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              style={{
                height: 56,
                padding: "16px 48px",
                fontSize: 16,
                lineHeight: "24px",
              }}
            >
              {continueButtonLabel ?? t("continueToOrderReview")}
            </button>
          </div>
        </div>

        <CheckoutAddressFormModal
          open={addressFormModalOpen}
          onClose={() => onCloseAddressFormModal?.()}
          title={addressFormEditingUuid ? t("edit") : t("addAddress")}
          addressData={addressData}
          setAddressData={(next) => setAddressData?.(next)}
          phoneCountryCode={phoneCountryCode}
          setPhoneCountryCode={(next) => setPhoneCountryCode?.(next)}
          savingAddress={savingAddress}
          onSave={() => void onSaveAddressFromForm?.()}
        />
      </div>
    </div>
  );
}

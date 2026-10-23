"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { resolveCheckoutShippingFee } from "@/lib/checkout/checkoutShipping";
import {
  fetchOrderPreview,
  type OrderPreviewResponse,
} from "@/services/orders/fetchOrderPreview";
import { useRouter, usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import RootLayout from "@/componentsedit/layout/RootLayout";
import CheckoutCenterContent from "./_components/CheckoutCenterContent";
import Cookies from "js-cookie";
import { toast } from "@/componentsedit/toast";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useLocale, useTranslations } from "next-intl";
import { useRedirectGuestFromCheckout } from "@/lib/auth/useGuestCheckoutGuard";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import { useUser } from "@/componentsedit/context/UserContext";
import { useCart } from "@/componentsedit/context/CartContext";
import { fetchCustomerAddresses } from "@/services/graphql";
import type { AddressDraft, CartSummaryShape } from "@/types/checkoutDisplay";
import {
  applyDefaultToSavedAddressList,
  mergeUserContactIntoDraft,
  pickDefaultSavedAddressId,
  savedAddressesFromCustomerAddresses,
  splitFullNameToLegacy,
  type SavedShippingAddress,
} from "@/lib/checkout/savedAddressesFromUser";
import { disconnectedCartSummary } from "@/lib/checkout/disconnectedCartSeed";
import { resolveCheckoutCartSelection } from "@/lib/checkout/checkoutCartItemUuids";
import {
  readCheckoutCartItemUuids,
  readCheckoutReviewSession,
  writeCheckoutCartItemUuids,
  writeCheckoutReviewSession,
} from "@/lib/checkout/checkoutReviewSession";
import { CHECKOUT_PAYMENT_METHODS } from "./_components/CheckoutPaymentMethodList";
import { splitInternationalPhone } from "@/lib/phone/splitInternationalPhone";
import {
  addressDraftToCreateCustomerAddressPayload,
  createCustomerAddress,
  setCustomerAddressAsDefault,
  updateCustomerAddress,
} from "@/services/auth/customerAddresses";
import { DEFAULT_COUNTRY_NAME } from "@/componentsedit/address/CountryStateCityFields";
import { useFacebookInitiateCheckout } from "@/componentsedit/analytics/useFacebookInitiateCheckout";
import { useTikTokInitiateCheckout } from "@/componentsedit/analytics/useTikTokInitiateCheckout";
import { pushAuthCheckoutGtmEvent } from "@/componentsedit/analytics/authCheckoutEvents";

function extractCreatedAddressUuid(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.uuid === "string" && o.uuid.trim()) return o.uuid.trim();
  const inner = o.data;
  if (inner && typeof inner === "object") {
    const uuid = (inner as Record<string, unknown>).uuid;
    if (typeof uuid === "string" && uuid.trim()) return uuid.trim();
  }
  return null;
}

export default function CheckoutPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { currency } = useCurrency();
  const currencyCode = currency || "QAR";
  const previewLanguage = locale === "ar" ? "ar" : "en";
  const savedToken = Cookies.get("token");
  const { user, loading: userLoading } = useUser();
  const { cart, loading: cartLoading, fetchCart } = useCart();
  useRedirectGuestFromCheckout(userLoading);

  const [storedCartItemUuids] = useState<string[] | undefined>(() =>
    typeof window !== "undefined" ? readCheckoutCartItemUuids() : undefined,
  );

  const selection = useMemo(
    () => resolveCheckoutCartSelection(cart, storedCartItemUuids),
    [cart, storedCartItemUuids],
  );
  const checkoutCart = selection.checkoutLines;
  const checkoutCartItemUuids = selection.cartItemUuids;

  useEffect(() => {
    if (selection.staleSelection) writeCheckoutCartItemUuids(null);
  }, [selection.staleSelection]);

  const checkoutReadyForPixel =
    Boolean(savedToken) &&
    !cartLoading &&
    !userLoading &&
    !isGuestSession() &&
    checkoutCart.length > 0;

  useFacebookInitiateCheckout({
    enabled: checkoutReadyForPixel,
    cart: checkoutCart,
    currency: currencyCode,
  });

  useTikTokInitiateCheckout({
    enabled: checkoutReadyForPixel,
    cart: checkoutCart,
    currency: currencyCode,
  });

  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [orderPreview, setOrderPreview] = useState<OrderPreviewResponse | null>(null);
  const shippingKnown = shippingCost != null;
  const cartSummary = useMemo(() => {
    if (orderPreview) {
      const previewCartTotal = Number(orderPreview.cart_total ?? 0);
      const previewDiscount = Number(orderPreview.discount ?? 0);
      const previewShippingTotal = Number(
        orderPreview.shippingTotal ?? shippingCost ?? 0,
      );
      const previewGrandTotal = Number(
        orderPreview.grand_total ??
          previewCartTotal - previewDiscount + previewShippingTotal,
      );
      return {
        cart_total: Number.isFinite(previewCartTotal) ? previewCartTotal : 0,
        discount: Number.isFinite(previewDiscount) ? previewDiscount : 0,
        shipping_total: Number.isFinite(previewShippingTotal)
          ? previewShippingTotal
          : undefined,
        grand_total: Number.isFinite(previewGrandTotal) ? previewGrandTotal : 0,
      } satisfies CartSummaryShape;
    }
    return disconnectedCartSummary(checkoutCart, shippingCost, 0);
  }, [checkoutCart, orderPreview, shippingCost]);
  const [addressData, setAddressData] = useState<AddressDraft>({});
  const [phoneCountryCode, setPhoneCountryCode] = useState("+974");
  const [saveForNextTime, setSaveForNextTime] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(
    null,
  );
  const [shippingAddressHighlightKey, setShippingAddressHighlightKey] = useState(0);
  const hasHydratedCheckoutAddressesRef = useRef(false);
  const lastEmptyProfileUserKeyRef = useRef<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<SavedShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesFetchFailed, setAddressesFetchFailed] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [addressFormModalOpen, setAddressFormModalOpen] = useState(false);
  const [addressFormEditingUuid, setAddressFormEditingUuid] = useState<string | null>(
    null,
  );
  /** Bumped after address save/select/default so shipping preview refetches for the active address. */
  const [orderPreviewNonce, setOrderPreviewNonce] = useState(0);
  const bumpOrderPreview = useCallback(() => {
    setOrderPreviewNonce((n) => n + 1);
  }, []);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [skipcashSavedCardTokenId, setSkipcashSavedCardTokenId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const stored = readCheckoutReviewSession().paymentMethodType?.trim();
    if (stored) setSelectedPaymentMethod(stored);

    // Default to the standard card option so the saved-card selector is enabled.
    if (!stored) {
      const cardMethod = CHECKOUT_PAYMENT_METHODS.find((m) => m.id === "visa");
      if (cardMethod) setSelectedPaymentMethod(String(cardMethod.id));
    }

    const storedSkipCashTokenId =
      typeof readCheckoutReviewSession().skipcashSavedCardTokenId === "string"
        ? readCheckoutReviewSession().skipcashSavedCardTokenId
        : null;
    if (storedSkipCashTokenId) setSkipcashSavedCardTokenId(storedSkipCashTokenId);
  }, []);

  const loadSavedAddresses = useCallback(
    async (opts?: {
      /** After REST set-default; GraphQL may return stale `isDefault` flags. */
      enforceDefaultId?: string;
    }): Promise<SavedShippingAddress[]> => {
      const token = Cookies.get("token");
      if (!token || isGuestSession()) {
        setSavedAddresses([]);
        setAddressesFetchFailed(false);
        setAddressesLoading(false);
        return [];
      }
      setAddressesLoading(true);
      setAddressesFetchFailed(false);
      try {
        const { getCustomerAddresses } = await fetchCustomerAddresses(
          { pageNumber: 1, itemsPerPage: 50 },
          token,
        );
        let mapped = savedAddressesFromCustomerAddresses(getCustomerAddresses ?? []);
        if (
          opts?.enforceDefaultId &&
          mapped.some((a) => a.id === opts.enforceDefaultId)
        ) {
          mapped = applyDefaultToSavedAddressList(mapped, opts.enforceDefaultId);
        }
        setSavedAddresses(mapped);
        return mapped;
      } catch {
        setSavedAddresses([]);
        setAddressesFetchFailed(true);
        return [];
      } finally {
        setAddressesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (userLoading && !orderPreview) return;
    setShippingCost(resolveCheckoutShippingFee(orderPreview, user));
  }, [orderPreview, user, userLoading]);

  useEffect(() => {
    if (!savedToken || isGuestSession() || !checkoutCart?.length) {
      setOrderPreview(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchOrderPreview(savedToken, {
          currency: currencyCode,
          language: previewLanguage,
          cartItemUuids: checkoutCartItemUuids,
        });
        if (!cancelled) setOrderPreview(p);
      } catch {
        if (!cancelled) setOrderPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    savedToken,
    checkoutCart?.length,
    checkoutCartItemUuids,
    currencyCode,
    previewLanguage,
    orderPreviewNonce,
    savedAddresses.length,
    selectedSavedAddressId,
  ]);

  useEffect(() => {
    if (userLoading || addressesLoading) return;

    if (!user) {
      setAddressData({});
      setSelectedSavedAddressId(null);
      hasHydratedCheckoutAddressesRef.current = false;
      lastEmptyProfileUserKeyRef.current = null;
      return;
    }

    const u = user as Record<string, unknown>;
    const userKey = String(u.id ?? u.sub ?? u.uuid ?? "");

    if (savedAddresses.length > 0) {
      lastEmptyProfileUserKeyRef.current = null;
      if (!hasHydratedCheckoutAddressesRef.current) {
        hasHydratedCheckoutAddressesRef.current = true;
        const defId = pickDefaultSavedAddressId(savedAddresses);
        const item = savedAddresses.find((x) => x.id === defId);
        if (item && defId) {
          setSelectedSavedAddressId(defId);
          setAddressData(mergeUserContactIntoDraft(u, item.draft));
          setPhoneCountryCode(String(item.draft.countryCode || "+974"));
        }
      }
      return;
    }

    if (lastEmptyProfileUserKeyRef.current === userKey) return;
    lastEmptyProfileUserKeyRef.current = userKey;
    hasHydratedCheckoutAddressesRef.current = false;

    setSelectedSavedAddressId(null);
    const rawAddr = u.address;
    const addr =
      rawAddr != null && typeof rawAddr === "object"
        ? (rawAddr as Record<string, unknown>)
        : {};
    const fullNameStr = String(u.fullName ?? u.name ?? addr.fullName ?? "").trim();
    const nameParts = fullNameStr.split(/\s+/).filter(Boolean);
    const phoneStr = String(u.phone ?? u.phoneNumber ?? addr.phone ?? "").trim();
    const { dialCode, national } = splitInternationalPhone(phoneStr);
    setPhoneCountryCode(dialCode);
    const fallbackContact = [u.first_name, u.last_name]
      .filter((x) => x != null && String(x).trim() !== "")
      .map(String)
      .join(" ")
      .trim();
    const contactDisplay = fullNameStr || fallbackContact || nameParts.join(" ");
    const legacy = splitFullNameToLegacy(String(contactDisplay));
    setAddressData({
      contactFullName: String(contactDisplay),
      first_name: legacy.first_name,
      last_name: legacy.last_name,
      email: String(u.email ?? u.emailAddress ?? addr.email ?? ""),
      phone: national,
      fullName: fullNameStr || nameParts.join(" "),
      countryCode: dialCode,
      phoneLocal: national,
      streetAddress: String(
        addr.streetAddress ?? addr.address_1 ?? addr.address1 ?? addr.street ?? "",
      ),
      apartment: String(addr.apartment ?? addr.address_2 ?? ""),
      zipCode: String(addr.zipCode ?? addr.postcode ?? addr.postal_code ?? ""),
      city: String(addr.city ?? ""),
      state: String(addr.state ?? ""),
      country: String(addr.country ?? ""),
      address_1: String(addr.address_1 ?? addr.address1 ?? addr.street ?? ""),
      address_2: String(addr.address_2 ?? ""),
      postcode: String(addr.postcode ?? addr.postal_code ?? ""),
    });
  }, [user, userLoading, savedAddresses, addressesLoading]);

  const applyDeliveryFromSavedId = useCallback(
    (id: string, list: SavedShippingAddress[]) => {
      if (!user) return;
      const item = list.find((a) => a.id === id);
      if (!item) return;
      setSelectedSavedAddressId(id);
      setAddressData(
        mergeUserContactIntoDraft(user as Record<string, unknown>, item.draft),
      );
      setPhoneCountryCode(String(item.draft.countryCode || "+974"));
    },
    [user],
  );

  const persistDefaultAddressIfNeeded = useCallback(
    async (
      id: string,
      showSuccessToast: boolean,
      listOverride?: SavedShippingAddress[],
    ) => {
      const token = Cookies.get("token");
      if (!token) {
        toast.error(t("pleaseLogin"));
        return;
      }
      const list = listOverride ?? savedAddresses;
      const item = list.find((a) => a.id === id);
      if (item?.isDefault) return;

      setSettingDefaultId(id);
      try {
        await setCustomerAddressAsDefault(id, token);
        if (showSuccessToast) toast.success(t("saved"));
        await loadSavedAddresses({ enforceDefaultId: id });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("somethingWentWrong"));
      } finally {
        setSettingDefaultId(null);
      }
    },
    [savedAddresses, t, loadSavedAddresses],
  );

  const handleSelectSavedAddress = useCallback(
    async (id: string) => {
      applyDeliveryFromSavedId(id, savedAddresses);
      await persistDefaultAddressIfNeeded(id, false);
      bumpOrderPreview();
    },
    [
      applyDeliveryFromSavedId,
      savedAddresses,
      persistDefaultAddressIfNeeded,
      bumpOrderPreview,
    ],
  );

  const handleCloseAddressFormModal = useCallback(() => {
    setAddressFormModalOpen(false);
    setAddressFormEditingUuid(null);
  }, []);

  const handleOpenAddAddressModal = useCallback(() => {
    setAddressFormEditingUuid(null);
    const cc = phoneCountryCode || "+974";
    setPhoneCountryCode(cc);
    setAddressData((prev) => ({
      ...prev,
      fullName: (prev.fullName ?? prev.contactFullName ?? "").trim(),
      countryCode: cc,
      phoneLocal: prev.phoneLocal ?? "",
      streetAddress: "",
      apartment: "",
      zipCode: "",
      city: "",
      state: "",
      country: DEFAULT_COUNTRY_NAME,
      address_1: "",
      address_2: "",
      postcode: "",
    }));
    setAddressFormModalOpen(true);
    pushAuthCheckoutGtmEvent("address_started", {
      source: "checkout",
      method: "create",
    });
  }, [phoneCountryCode]);

  const handleOpenEditAddressModal = useCallback(
    (id: string) => {
      const item = savedAddresses.find((a) => a.id === id);
      if (!item || !user) return;
      setAddressFormEditingUuid(id);
      setAddressData(
        mergeUserContactIntoDraft(user as Record<string, unknown>, item.draft),
      );
      setPhoneCountryCode(String(item.draft.countryCode || "+974"));
      setAddressFormModalOpen(true);
      pushAuthCheckoutGtmEvent("address_started", {
        source: "checkout",
        method: "update",
        address_id: id,
      });
    },
    [savedAddresses, user],
  );

  const handleSaveAddressFromForm = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token || !user) {
      toast.error(t("pleaseLogin"));
      return;
    }
    const payload = addressDraftToCreateCustomerAddressPayload(addressData);
    if (!payload.fullName || !payload.streetAddress || !payload.phoneNumber) {
      toast.error(t("checkoutAddressRequiredFields"));
      return;
    }
    const editingId = addressFormEditingUuid;
    setSavingAddress(true);
    try {
      if (editingId) {
        await updateCustomerAddress(editingId, payload, token);
        pushAuthCheckoutGtmEvent("address_completed", {
          source: "checkout",
          method: "update",
          address_id: editingId,
        });
        toast.success(t("addressUpdatedSuccessfully"));
      } else {
        const created = await createCustomerAddress(payload, token);
        const newUuid = extractCreatedAddressUuid(created);
        pushAuthCheckoutGtmEvent("address_completed", {
          source: "checkout",
          method: "create",
          address_id: newUuid ?? undefined,
        });
        toast.success(t("saved"));
        const list = await loadSavedAddresses();
        hasHydratedCheckoutAddressesRef.current = true;
        const pickId =
          (newUuid && list.some((x) => x.id === newUuid) ? newUuid : null) ||
          pickDefaultSavedAddressId(list) ||
          list[0]?.id ||
          null;
        if (pickId) {
          applyDeliveryFromSavedId(pickId, list);
          await persistDefaultAddressIfNeeded(pickId, false, list);
        }
        bumpOrderPreview();
        setAddressFormModalOpen(false);
        setAddressFormEditingUuid(null);
        return;
      }
      const list = await loadSavedAddresses();
      hasHydratedCheckoutAddressesRef.current = true;
      if (editingId && list.some((x) => x.id === editingId)) {
        applyDeliveryFromSavedId(editingId, list);
      }
      bumpOrderPreview();
      setAddressFormModalOpen(false);
      setAddressFormEditingUuid(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("somethingWentWrong"));
    } finally {
      setSavingAddress(false);
    }
  }, [
    addressData,
    user,
    t,
    loadSavedAddresses,
    applyDeliveryFromSavedId,
    addressFormEditingUuid,
    persistDefaultAddressIfNeeded,
    bumpOrderPreview,
  ]);

  const handleSetDefaultSavedAddress = useCallback(
    async (id: string) => {
      applyDeliveryFromSavedId(id, savedAddresses);
      await persistDefaultAddressIfNeeded(id, true);
      bumpOrderPreview();
    },
    [
      applyDeliveryFromSavedId,
      savedAddresses,
      persistDefaultAddressIfNeeded,
      bumpOrderPreview,
    ],
  );

  useEffect(() => {
    if (!savedToken) return;
    void fetchCart(true);
  }, [savedToken, fetchCart]);

  useEffect(() => {
    if (!savedToken || userLoading) return;
    void loadSavedAddresses();
  }, [savedToken, userLoading, loadSavedAddresses]);

  const subtotal = cartSummary.cart_total ?? 0;
  const discount = cartSummary.discount ?? 0;
  const grandTotal =
    cartSummary.grand_total ??
    subtotal - discount + (shippingKnown ? (shippingCost ?? 0) : 0);

  const handleSelectPaymentMethod = useCallback(
    (paymentMethod: string) => {
      setSelectedPaymentMethod(paymentMethod);
      pushAuthCheckoutGtmEvent("payment_method_selected", {
        source: "checkout",
        payment_method: paymentMethod,
        cart_value: subtotal,
        currency: currencyCode,
      });
    },
    [subtotal, currencyCode],
  );

  const canContinueToPayment =
    isGuestSession() ||
    (!addressesLoading &&
      !addressesFetchFailed &&
      savedAddresses.length > 0 &&
      Boolean(selectedSavedAddressId));

  const handleContinueToOrderReview = useCallback(() => {
    if (!isGuestSession()) {
      const highlightShipping = () => setShippingAddressHighlightKey((k) => k + 1);
      if (addressesLoading) {
        highlightShipping();
        toast.info(t("loading"), { position: "top-center", autoClose: 2000 });
        return;
      }
      if (addressesFetchFailed) {
        highlightShipping();
        toast.error(t("checkoutAddressesLoadFailed"), {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }
      if (savedAddresses.length === 0) {
        highlightShipping();
        toast.error(t("checkoutRequiresSavedAddress"), {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }
      if (!selectedSavedAddressId) {
        highlightShipping();
        toast.error(t("pleaseAddAddress"), {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }
    }
    writeCheckoutReviewSession({
      paymentMethod: "CREDIT_CARD",
      paymentMethodType: selectedPaymentMethod,
      skipcashSavedCardTokenId: skipcashSavedCardTokenId ?? null,
      // Only tokenize the card if the user explicitly opted to save it for next time
      // and this is a new-card flow (no saved token selected).
      skipcashTokenizeCard: Boolean(saveForNextTime && !skipcashSavedCardTokenId),
    });
    pushAuthCheckoutGtmEvent("add_shipping_info", {
      source: "checkout",
      address_id: selectedSavedAddressId ?? undefined,
      shipping_method: orderPreview ? "4px" : undefined,
      shipping_cost: shippingKnown ? (shippingCost ?? 0) : undefined,
      cart_value: subtotal,
      currency: currencyCode,
    });
    pushAuthCheckoutGtmEvent("add_payment_info", {
      source: "checkout",
      payment_method: selectedPaymentMethod,
      cart_value: subtotal,
      currency: currencyCode,
    });
    const locale = pathname?.split("/")[1] || "en";
    router.push(`/${locale}/checkout/order-review`);
  }, [
    pathname,
    router,
    t,
    addressesLoading,
    addressesFetchFailed,
    savedAddresses.length,
    selectedSavedAddressId,
    selectedPaymentMethod,
    skipcashSavedCardTokenId,
    orderPreview,
    shippingKnown,
    shippingCost,
    subtotal,
    currencyCode,
    saveForNextTime,
  ]);

  if (!savedToken) {
    return (
      <RootLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
          <p className="font-sans font-semibold text-xl">
            {t("pleaseSignInOrCreateAccount")}
          </p>
          <Link
            href="/auth/login"
            className="font-sans bg-[#CB262E] text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            {t("logIn")}
          </Link>
        </div>
      </RootLayout>
    );
  }

  if (cartLoading) {
    return (
      <RootLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="font-sans">{t("loading")}</p>
        </div>
      </RootLayout>
    );
  }

  if (!cart?.length) {
    return (
      <RootLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
          <p className="font-sans font-semibold text-xl">{t("yourCartIsEmpty")}</p>
          <Link
            href="/cart"
            className="font-sans bg-[#CB262E] text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            {t("cart")}
          </Link>
        </div>
      </RootLayout>
    );
  }

  if (!userLoading && isGuestSession()) {
    return (
      <RootLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="font-sans">{t("loading")}</p>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <CheckoutCenterContent
        cart={checkoutCart}
        addressData={addressData}
        setAddressData={setAddressData}
        phoneCountryCode={phoneCountryCode}
        setPhoneCountryCode={setPhoneCountryCode}
        cartSummary={cartSummary}
        shippingCost={shippingKnown ? (shippingCost ?? 0) : 0}
        shippingKnown={shippingKnown}
        subtotal={subtotal}
        discount={discount}
        grandTotal={grandTotal}
        currencyCode={currencyCode}
        onPlaceOrder={handleContinueToOrderReview}
        continueToPaymentDisabled={!canContinueToPayment}
        continueButtonLabel={t("continueToOrderReview")}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={handleSelectPaymentMethod}
        skipcashSavedCardTokenId={skipcashSavedCardTokenId}
        setSkipcashSavedCardTokenId={setSkipcashSavedCardTokenId}
        shippingAddressHighlightKey={shippingAddressHighlightKey}
        saveForNextTime={saveForNextTime}
        setSaveForNextTime={setSaveForNextTime}
        savedAddresses={savedAddresses}
        selectedSavedAddressId={selectedSavedAddressId}
        onSelectSavedAddress={handleSelectSavedAddress}
        onSaveAddressFromForm={handleSaveAddressFromForm}
        savingAddress={savingAddress}
        onSetDefaultSavedAddress={handleSetDefaultSavedAddress}
        settingDefaultId={settingDefaultId}
        addressFormModalOpen={addressFormModalOpen}
        onCloseAddressFormModal={handleCloseAddressFormModal}
        onOpenAddAddressModal={handleOpenAddAddressModal}
        onOpenEditAddressModal={handleOpenEditAddressModal}
        addressFormEditingUuid={addressFormEditingUuid}
      />
    </RootLayout>
  );
}

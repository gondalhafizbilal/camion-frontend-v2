"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import RootLayout from "@/componentsedit/layout/RootLayout";
import OrderConfirmationCenterContent from "./_components/OrderConfirmationCenterContent";
import { useRedirectGuestFromCheckout } from "@/lib/auth/useGuestCheckoutGuard";
import Cookies from "js-cookie";
import { fetchCurrentCustomerOrder } from "@/services/graphql";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import { useFacebookPurchase } from "@/componentsedit/analytics/useFacebookPurchase";
import { useTikTokPurchase } from "@/componentsedit/analytics/useTikTokPurchase";
import { useGtmPurchase } from "@/componentsedit/analytics/useGtmPurchase";
import { trackConfirmationPaymentOutcomes } from "@/componentsedit/analytics/postPurchaseGtm";

function parseEstDelivery(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  return trimmed || null;
}

export default function OrderConfirmationPage() {
  useRedirectGuestFromCheckout(false);
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { currency } = useCurrency();
  const redirectOrderId =
    searchParams?.get("orderId") ??
    searchParams?.get("order_id") ??
    searchParams?.get("id") ??
    null;
  const transactionId = searchParams?.get("transId") ?? searchParams?.get("trans_id") ?? null;
  const lookupUuid = transactionId || redirectOrderId;
  const statusParam = searchParams?.get("status") ?? null;
  const orderNumberParam =
    searchParams?.get("orderNumber") ?? searchParams?.get("order_number") ?? null;
  const orderNumber = useMemo(() => {
    const fromParam = parseEstDelivery(orderNumberParam);
    if (fromParam) return fromParam;
    const id = typeof lookupUuid === "string" ? lookupUuid.trim() : "";
    if (id.length >= 8) return `#${id.slice(0, 8)}`;
    if (id) return `#${id}`;
    return null;
  }, [orderNumberParam, lookupUuid]);
  const estDeliveryParam = searchParams?.get("estDelivery") ?? searchParams?.get("est_delivery");
  const estDelivery = useMemo(() => parseEstDelivery(estDeliveryParam), [estDeliveryParam]);
  const [order, setOrder] = useState(null);
  const resolvedOrderUuid = order?.uuid || lookupUuid;
  const trackOrderHref = resolvedOrderUuid
    ? `/myaccount/orders/${resolvedOrderUuid}/track`
    : null;

  useEffect(() => {
    const token = Cookies.get("token");
    const id = typeof lookupUuid === "string" ? lookupUuid.trim() : "";
    if (!token || !id) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const data = await fetchCurrentCustomerOrder(
        {
          uuid: id,
          language: locale === "ar" ? "ar" : "en",
          currency: String(currency || "QAR").toLowerCase(),
        },
        token,
      );
      if (!cancelled) {
        const next = data?.getCurrentCustomerOrder ?? null;
        setOrder(
          next
            ? {
                uuid: next.uuid,
                status: next.status,
                subTotal: next.subTotal,
                shippingCost: next.shippingCost,
                discount: next.discount,
                total: next.total,
                eta: next.eta,
                orderItems: next.orderItems,
              }
            : null,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lookupUuid, locale, currency]);

  const purchaseOrder = useMemo(() => {
    if (!order?.uuid || !order?.orderItems?.length) return null;
    return {
      orderUuid: order.uuid,
      status: order.status,
      total: order.total,
      orderItems: order.orderItems,
    };
  }, [order]);

  useFacebookPurchase({
    enabled: Boolean(purchaseOrder),
    order: purchaseOrder,
  });

  useTikTokPurchase({
    enabled: Boolean(purchaseOrder),
    order: purchaseOrder,
  });

  useGtmPurchase({
    enabled: Boolean(purchaseOrder),
    order: purchaseOrder,
  });

  useEffect(() => {
    if (!order?.uuid || !order?.status) return;
    trackConfirmationPaymentOutcomes({
      orderId: order.uuid,
      status: order.status,
      total: order.total,
      gatewayTransactionReference: transactionId,
    });
  }, [order, transactionId]);

  return (
    <RootLayout>
      <OrderConfirmationCenterContent
        orderNumber={(order?.uuid ? `#${String(order.uuid).slice(0, 8)}` : orderNumber) ?? undefined}
        estDelivery={(order?.eta ?? estDelivery) ?? undefined}
        trackOrderHref={trackOrderHref}
        order={
          (order ??
            (statusParam || lookupUuid
              ? {
                  uuid:
                    typeof lookupUuid === "string" && lookupUuid.trim()
                      ? lookupUuid.trim()
                      : undefined,
                  status: statusParam || undefined,
                }
              : undefined)) ?? undefined
        }
      />
    </RootLayout>
  );
}

"use client";

import Image from "@/componentsedit/StaticImage";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Cookies from "js-cookie";
import ReturnRequestModal from "@/app/[locale]/track/_components/ReturnRequestModal";
import TrackReviewModal from "@/app/[locale]/track/_components/TrackReviewModal";
import { toast } from "@/componentsedit/toast";
import { canCancelOrder } from "@/lib/order/canCancelOrder";
import { cancelOrder } from "@/services/orders/cancelOrder";
import type { OrderDetailLine, OrderDetailShape } from "@/types/checkoutDisplay";
import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";
import { trackOrderCancelled } from "@/componentsedit/analytics/postPurchaseGtm";

const sanitizePrice = (price: unknown): number => {
  if (price == null) return 0;
  if (typeof price === "number") return price;
  if (typeof price === "string") {
    const n = parseFloat(
      price
        .replace(/\$/g, "")
        .replace(/QAR|QAT|USD/gi, "")
        .replace(/,/g, "")
        .trim(),
    );
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

function LineCard({
  item,
  index,
  currencyCode,
  locale,
  canReview,
  onReview,
}: {
  item: OrderDetailLine;
  index: number;
  currencyCode: string;
  locale: string;
  canReview?: boolean;
  onReview?: () => void;
}) {
  const t = useTranslations();
  const bg = index >= 2 ? "#F1F1F1" : "#ECEFF1";
  const imgBg = index >= 2 ? "#E3E7EA" : undefined;
  const mirror = index < 2;

  const category = item.categoryName || item.category || t("category");
  const title = item.title || item.name || t("product");
  const variations = Array.isArray(item.variation)
    ? item.variation.filter(
        (v) =>
          String(v?.attribute ?? "").trim() !== "" ||
          String(v?.value ?? "").trim() !== "",
      )
    : [];

  const unit = sanitizePrice(item.price);
  const qty = Number(item.quantity) || 1;

  return (
    <div
      className="flex flex-row items-center w-full flex-shrink-0"
      style={{
        minHeight: 120,
        padding: "8px 16px",
        gap: 12,
        background: bg,
        borderRadius: 5,
      }}
    >
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-[5px]"
        style={{
          width: 80,
          height: 104,
          background: imgBg || "#E3E7EA",
          transform: mirror ? "scaleX(-1)" : undefined,
        }}
      >
        <Image
          src={item.image || "/assets/images/no-image.png"}
          alt={title}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized
        />
      </div>

      <div className="flex flex-col items-start flex-1 min-w-0" style={{ gap: 12 }}>
        <div className="flex flex-col w-full" style={{ gap: 2 }}>
          <div className="flex flex-col w-full" style={{ gap: 2 }}>
            <span
              className="w-full capitalize"
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 8,
                lineHeight: "12px",
                color: "#000000",
              }}
            >
              {category}
            </span>
            <span
              className="w-full capitalize line-clamp-2"
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 12,
                lineHeight: "18px",
                color: "#000000",
              }}
            >
              {title}
            </span>
          </div>
          <div className="flex flex-row items-start gap-1.5 flex-wrap">
            {variations.length > 0 ? (
              variations.map((v, vi) => (
                <span
                  key={`${v.attribute ?? "opt"}-${v.value ?? ""}-${vi}`}
                  style={{
                    fontFamily:
                      "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: 8,
                    lineHeight: "12px",
                    textTransform: "capitalize",
                    color: "#000000",
                  }}
                >
                  {`${v.attribute ?? t("variantOption")}: ${v.value ?? "—"}`}
                </span>
              ))
            ) : (
              <span
                style={{
                  fontFamily:
                    "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: 8,
                  lineHeight: "12px",
                  textTransform: "capitalize",
                  color: "rgba(0, 0, 0, 0.6)",
                }}
              >
                {t("variantOption")}: —
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center w-full" style={{ gap: 12 }}>
          <span
            className="flex-1"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              lineHeight: "24px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {formatAmountWithCurrency(unit, currencyCode, locale)}
          </span>
          <span
            className="flex-1 text-end"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "18px",
              textTransform: "capitalize",
              color: "rgba(0, 0, 0, 0.6)",
            }}
          >
            X {qty}
          </span>
        </div>
        {canReview && onReview ? (
          <button
            type="button"
            onClick={onReview}
            className="flex h-9 w-full max-w-[180px] items-center justify-center rounded-[5px] bg-[#CB262E] px-4 font-sans text-xs font-semibold capitalize text-white hover:opacity-90"
          >
            {t("orderLineProductReview")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueSize = 16,
  labelWeight = 400,
  gapClass = "justify-between",
  labelTall = false,
}: {
  label: string;
  value: string;
  valueSize?: number;
  labelWeight?: number;
  gapClass?: string;
  labelTall?: boolean;
}) {
  return (
    <div className={`flex flex-row items-center w-full ${gapClass}`}>
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: labelWeight,
          fontSize: 16,
          lineHeight: labelTall ? "24px" : "18px",
          textTransform: "capitalize",
          color: "#000000",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        className="text-end flex-1 min-w-0 truncate"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: valueSize,
          lineHeight: "24px",
          textTransform: "capitalize",
          color: "#000000",
        }}
      >
        {value}
      </span>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  const value = String(text || "").trim();
  if (!value) return false;

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "true");
    el.style.position = "fixed";
    el.style.top = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export default function OrderDetailCenterContent({
  order,
  onOrderCancelled,
}: {
  order?: OrderDetailShape;
  onOrderCancelled?: () => void | Promise<void>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const currencyCode = "QAR";
  const items: OrderDetailLine[] = Array.isArray(order?.items) ? order.items : [];
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductUuid, setReviewProductUuid] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const orderUuid = String(
    (order as unknown as { orderUuid?: unknown })?.orderUuid ?? "",
  ).trim();
  const shippingAddress = (order as unknown as {
    customer_data?: { shipping_address?: unknown };
  })?.customer_data?.shipping_address as
    | null
    | undefined
    | {
        fullName?: unknown;
        phoneNumber?: unknown;
        streetAddress?: unknown;
        apartment?: unknown;
        zipCode?: unknown;
        city?: unknown;
        state?: unknown;
        country?: unknown;
      };

  const shippingLines = [
    String(shippingAddress?.fullName ?? "").trim(),
    String(shippingAddress?.phoneNumber ?? "").trim(),
    [shippingAddress?.streetAddress, shippingAddress?.apartment]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join(", "),
    [shippingAddress?.city, shippingAddress?.state, shippingAddress?.zipCode]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join(", "),
    String(shippingAddress?.country ?? "").trim(),
  ].filter(Boolean);

  const statusKey = String(
    (order as unknown as { statusDisplay?: unknown })?.statusDisplay ?? "",
  )
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
  const statusDisplay = String(
    (order as unknown as { statusDisplay?: unknown })?.statusDisplay ?? "",
  ).trim();
  const orderStatus = String(
    (order as unknown as { orderStatus?: unknown })?.orderStatus ?? statusDisplay,
  ).trim();
  const canShowCancelOrder = canCancelOrder(orderStatus);
  const canShowPostPurchaseActions =
    statusKey.includes("delivered") || statusKey.includes("payment_successful");
  const canRequestReturn = statusKey.includes("delivered");
  const canReview = canShowPostPurchaseActions;

  const subtotal = items.reduce(
    (acc, item) => acc + sanitizePrice(item.price) * (Number(item.quantity) || 1),
    0,
  );
  const discount = sanitizePrice(order?.discount);
  const shipping = sanitizePrice(order?.customer_data?.shipping_option?.cost);
  const grand =
    sanitizePrice(order?.grandTotal) > 0
      ? sanitizePrice(order?.grandTotal)
      : subtotal - discount + shipping;

  const handleCancelOrder = async () => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("cancelOrderError"));
      return;
    }
    if (!orderUuid || cancelling) return;

    setCancelling(true);
    try {
      await cancelOrder(token, orderUuid);
      trackOrderCancelled(orderUuid);
      toast.success(t("cancelOrderSuccess"));
      setCancelConfirmOpen(false);
      await onOrderCancelled?.();
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : t("cancelOrderError");
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="flex flex-col items-start w-full"
        style={{ maxWidth: 550, gap: 24 }}
      >
        <div
          className="flex flex-col items-start w-full box-border bg-white"
          style={{
            padding: "16px 14px",
            gap: 12,
            border: "1px solid rgba(0, 0, 0, 0.15)",
            borderRadius: 10,
          }}
        >
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-sans text-sm font-medium text-black">
                  {t("orderId") || "Order ID"}
                </div>
                <div
                  className="font-sans text-sm text-black/70 break-all"
                  style={{ lineHeight: "20px" }}
                >
                  {orderUuid || "—"}
                </div>
              </div>
              <button
                type="button"
                disabled={!orderUuid}
                onClick={() => {
                  void (async () => {
                    const ok = await copyText(orderUuid);
                    if (ok) toast.success(t("copied") || "Copied");
                    else toast.error(t("somethingWentWrong") || "Something went wrong");
                  })();
                }}
                className="shrink-0 rounded-md border border-black/10 bg-white px-3 py-2 font-sans text-xs font-semibold text-black hover:bg-black/[0.03] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("copy") || "Copy"}
              </button>
            </div>
          </div>

          <div className="w-full border-t border-black/10" />

          <div className="flex w-full flex-col gap-2">
            <div className="font-sans text-sm font-medium text-black">
              {t("deliveryAddress") || t("shippingAddress") || "Delivery address"}
            </div>
            <div className="font-sans text-sm text-black/70">
              {shippingLines.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {shippingLines.map((line) => (
                    <div key={line} className="break-words">
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-start w-full box-border"
          style={{
            padding: "16px 14px",
            gap: 20,
            border: "1px solid rgba(0, 0, 0, 0.15)",
            borderRadius: 10,
          }}
        >
          {items.length === 0 ? (
            <p
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontSize: 14,
                color: "#666",
              }}
            >
              {t("noOrderItems") || "No items"}
            </p>
          ) : (
            items.map((item, index) => {
              const productUuid = String(item.productUuid ?? "").trim();
              return (
                <LineCard
                  key={item.id ?? index}
                  item={item}
                  index={index}
                  currencyCode={currencyCode}
                  locale={locale}
                  canReview={canReview && Boolean(productUuid)}
                  onReview={
                    productUuid
                      ? () => {
                          setReviewProductUuid(productUuid);
                          setReviewModalOpen(true);
                        }
                      : undefined
                  }
                />
              );
            })
          )}
        </div>

        <div
          className="flex flex-col items-start w-full box-border bg-white"
          style={{
            padding: "20px 24px",
            gap: 24,
            borderTop: "1px solid rgba(0, 0, 0, 0.15)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.15)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: "24px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {t("orderSummary")}
          </h2>

          <div className="flex flex-col w-full" style={{ gap: 12 }}>
            <SummaryRow
              label={t("subtotal")}
              value={formatAmountWithCurrency(subtotal, currencyCode, locale)}
            />
            <SummaryRow
              label={t("discount")}
              value={
                discount > 0
                  ? formatAmountWithCurrency(-discount, currencyCode, locale)
                  : "—"
              }
            />
            <SummaryRow
              label={t("shippingFee")}
              value={formatAmountWithCurrency(shipping, currencyCode, locale)}
            />
            <SummaryRow
              label={t("orderTotalShort")}
              value={formatAmountWithCurrency(grand, currencyCode, locale)}
              valueSize={20}
              labelWeight={500}
              labelTall
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center w-full print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900"
          >
            {t("printOrder")}
          </button>
          {!order?.isPaid && order?.skipCashPaymentUrl && (
            <a
              href={String(order.skipCashPaymentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 rounded-lg bg-[#CB262E] text-white text-sm hover:opacity-90"
            >
              {t("payNow")}
            </a>
          )}
          {canShowCancelOrder && !cancelConfirmOpen ? (
            <button
              type="button"
              onClick={() => setCancelConfirmOpen(true)}
              className="px-6 py-2 rounded-lg border border-[#CB262E] text-[#CB262E] text-sm hover:bg-[#CB262E]/5"
            >
              {t("cancelOrder")}
            </button>
          ) : null}
          {canShowCancelOrder && cancelConfirmOpen ? (
            <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-4">
              <p className="text-center font-sans text-sm text-black/80">
                {t("cancelOrderConfirm")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => void handleCancelOrder()}
                  className="px-6 py-2 rounded-lg bg-[#CB262E] text-white text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cancelling ? t("submitting") : t("cancelOrderConfirmAction")}
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setCancelConfirmOpen(false)}
                  className="px-6 py-2 rounded-lg border border-black/15 bg-white text-sm text-black hover:bg-black/[0.03] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t("cancelOrderGoBack")}
                </button>
              </div>
            </div>
          ) : null}
          {canRequestReturn && (
            <button
              type="button"
              onClick={() => setReturnModalOpen(true)}
              className="px-6 py-2 rounded-lg bg-[#CB262E] text-white text-sm hover:opacity-90"
            >
              {t("requestReturn") || "Request Return"}
            </button>
          )}
        </div>
      </div>

      <ReturnRequestModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        orderUuid={orderUuid}
        orderItems={items}
      />
      <TrackReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productUuid={reviewProductUuid}
      />
    </div>
  );
}

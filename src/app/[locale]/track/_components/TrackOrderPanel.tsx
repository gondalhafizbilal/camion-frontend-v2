"use client";

import {
  useState,
  useEffect,
  useMemo,
  type ComponentType,
  type CSSProperties,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Cookies from "js-cookie";
import OrderTrackingTimeline from "@/componentsedit/order/OrderTrackingTimeline";
import { FOUR_PX_BRAND_NAME } from "@/lib/checkout/fourPxShipping";
import {
  canRequestReturnFromTracking,
  canReviewFromTracking,
  DEMO_ORDER_TRACKING_STAGES,
  formatOrderPlacementDate,
  formatTrackingDate,
  getTrackingStage,
  isOrderCancelledFromTracking,
  lastCheckedTrackingStage,
  shippingAddressLines,
  shortOrderNumber,
  trackingIdFromStages,
} from "@/lib/order/orderTracking";
import {
  ORDER_TRACKING_STAGE,
  type GqlOrderTrackingStage,
} from "@/services/graphql/types/orderTracking";
import {
  fetchCurrentCustomerOrder,
  fetchOrderTracking,
} from "@/services/graphql";
import type { GqlCustomerOrder, GqlOrderItem } from "@/services/graphql/types/order";
import ReturnRequestModal from "./ReturnRequestModal";

function PillarIconDelivery({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M28.666 20.6667C29.0393 20.6667 29.3327 20.9601 29.3327 21.3334V22.6667C29.3327 24.8801 27.546 26.6667 25.3327 26.6667C25.3327 24.4667 23.5327 22.6667 21.3327 22.6667C19.1327 22.6667 17.3327 24.4667 17.3327 26.6667H14.666C14.666 24.4667 12.866 22.6667 10.666 22.6667C8.46602 22.6667 6.66602 24.4667 6.66602 26.6667C4.45268 26.6667 2.66602 24.8801 2.66602 22.6667V20.0001C2.66602 19.2667 3.26602 18.6667 3.99935 18.6667H16.666C18.506 18.6667 19.9993 17.1734 19.9993 15.3334V8.00008C19.9993 7.26675 20.5993 6.66675 21.3327 6.66675H22.4527C23.4127 6.66675 24.2927 7.18675 24.7727 8.01342L25.626 9.50675C25.746 9.72008 25.586 10.0001 25.3327 10.0001C23.4927 10.0001 21.9993 11.4934 21.9993 13.3334V17.3334C21.9993 19.1734 23.4927 20.6667 25.3327 20.6667H28.666Z"
        fill="white"
      />
      <path
        d="M10.6667 29.3333C12.1394 29.3333 13.3333 28.1394 13.3333 26.6667C13.3333 25.1939 12.1394 24 10.6667 24C9.19391 24 8 25.1939 8 26.6667C8 28.1394 9.19391 29.3333 10.6667 29.3333Z"
        fill="white"
      />
      <path
        d="M21.3327 29.3333C22.8054 29.3333 23.9993 28.1394 23.9993 26.6667C23.9993 25.1939 22.8054 24 21.3327 24C19.8599 24 18.666 25.1939 18.666 26.6667C18.666 28.1394 19.8599 29.3333 21.3327 29.3333Z"
        fill="white"
      />
      <path
        d="M29.3333 16.7067V18.6667H25.3333C24.6 18.6667 24 18.0667 24 17.3333V13.3333C24 12.6 24.6 12 25.3333 12H27.0533L28.9867 15.3867C29.2133 15.7867 29.3333 16.24 29.3333 16.7067Z"
        fill="white"
      />
      <path
        d="M17.4413 2.66675H7.58797C5.2013 2.66675 3.2013 4.37341 2.7613 6.64008H8.58797C9.09464 6.64008 9.49464 7.05341 9.49464 7.56008C9.49464 8.06675 9.09464 8.46675 8.58797 8.46675H2.66797V10.3067H6.13464C6.6413 10.3067 7.05464 10.7201 7.05464 11.2267C7.05464 11.7334 6.6413 12.1334 6.13464 12.1334H2.66797V13.9734H3.69464C4.2013 13.9734 4.61464 14.3867 4.61464 14.8934C4.61464 15.4001 4.2013 15.8001 3.69464 15.8001H2.66797V16.1067C2.66797 16.8401 3.26797 17.4401 4.0013 17.4401H16.2013C17.5613 17.4401 18.668 16.3334 18.668 14.9734V3.89341C18.668 3.21341 18.1213 2.66675 17.4413 2.66675Z"
        fill="white"
      />
      <path
        d="M2.76065 6.64014H2.56065H1.25398C0.747318 6.64014 0.333984 7.05347 0.333984 7.56014C0.333984 8.0668 0.747318 8.4668 1.25398 8.4668H2.46732H2.66732V7.5868C2.66732 7.2668 2.70732 6.9468 2.76065 6.64014Z"
        fill="white"
      />
      <path
        d="M2.46732 10.3066H1.25398C0.747318 10.3066 0.333984 10.72 0.333984 11.2266C0.333984 11.7333 0.747318 12.1333 1.25398 12.1333H2.46732H2.66732V10.3066H2.46732Z"
        fill="white"
      />
      <path
        d="M2.46732 13.9734H1.25398C0.747318 13.9734 0.333984 14.3867 0.333984 14.8934C0.333984 15.4001 0.747318 15.8001 1.25398 15.8001H2.46732H2.66732V13.9734H2.46732Z"
        fill="white"
      />
    </svg>
  );
}

function PillarIconStatus({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2" />
      <path
        d="M11 16l3 3 7-7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PillarIconTracking({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="5" y="8" width="22" height="16" rx="2" stroke="white" strokeWidth="2" />
      <path d="M5 13h22" stroke="white" strokeWidth="2" />
      <path d="M10 19h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShipmentDetailPillar({
  icon: Icon,
  title,
  subtitle,
  iconWrap = 60,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  subtitle: string;
  iconWrap?: number;
}) {
  const iconSm = Math.max(24, Math.round(iconWrap * 0.47));
  const iconLg = Math.max(28, Math.round(iconWrap * 0.53));
  return (
    <div className="mx-auto flex min-w-0 flex-1 basis-0 flex-col items-center gap-1 sm:gap-[7px]">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#CB262E] text-white sm:h-[60px] sm:w-[60px]">
        <div className="flex items-center justify-center sm:hidden">
          <Icon size={iconSm} />
        </div>
        <div className="hidden items-center justify-center sm:flex">
          <Icon size={iconLg} />
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col items-center gap-px text-center">
        <span
          className="flex w-full min-w-0 items-center justify-center px-0.5 text-xs leading-[150%] sm:text-sm sm:leading-[150%]"
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 500,
            color: "#262626",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        <span
          className="flex w-full min-w-0 items-center justify-center px-0.5 text-[11px] leading-[150%] sm:text-[13px] sm:leading-[150%]"
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
            color: "#7A7A7A",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={subtitle}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
}

const metaLabelStyle: CSSProperties = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: 11,
  lineHeight: "150%",
  color: "#8F8F8F",
};

const metaValueStyle: CSSProperties = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: 13,
  lineHeight: "150%",
  color: "#262626",
  wordBreak: "break-word",
};

function TrackMetaItem({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span style={metaLabelStyle}>{label}</span>
      <span style={metaValueStyle}>{value}</span>
    </div>
  );
}

function TrackDetailRow({
  label,
  value,
  wrap = true,
}: {
  label: string;
  value: string;
  /** When true, value flows as one paragraph and wraps only when width runs out. */
  wrap?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-3">
      <span
        className="shrink-0 sm:w-[140px]"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 12,
          lineHeight: "160%",
          color: "#8F8F8F",
        }}
      >
        {label}
      </span>
      <span
        className="min-w-0"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: 13,
          lineHeight: "160%",
          color: "#262626",
          whiteSpace: wrap ? "normal" : "nowrap",
          overflowWrap: wrap ? "anywhere" : undefined,
          wordBreak: wrap ? "break-word" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export type TrackOrderPanelProps = {
  /** When set (e.g. `/myaccount/orders/[uuid]/track`), loads `getOrderTracking`. */
  orderUuid?: string | null;
};

const lineStyle = {
  borderTop: "0.5px solid #DCF3EF",
  width: "100%",
  maxWidth: 328,
};

const ctaLabel: CSSProperties = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 600,
  fontSize: 16,
  lineHeight: "24px",
  textTransform: "capitalize",
};

export default function TrackOrderPanel({ orderUuid }: TrackOrderPanelProps = {}) {
  const t = useTranslations();
  const locale = useLocale();
  const token = Cookies.get("token");
  const liveUuid = String(orderUuid ?? "").trim();

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [trackingStages, setTrackingStages] = useState<GqlOrderTrackingStage[] | null>(null);
  const [orderDetail, setOrderDetail] = useState<GqlCustomerOrder | null>(null);
  const [liveLoading, setLiveLoading] = useState(Boolean(liveUuid));
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    if (!liveUuid) {
      setTrackingStages(null);
      setOrderDetail(null);
      setLiveLoading(false);
      setLiveError(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLiveLoading(true);
      setLiveError(false);
      try {
        if (!token) throw new Error("no token");
        const language = locale === "ar" ? "ar" : "en";
        const [trackingData, orderData] = await Promise.all([
          fetchOrderTracking({ uuid: liveUuid, language }, token ?? null),
          fetchCurrentCustomerOrder(
            { uuid: liveUuid, language, currency: "qar" },
            token ?? null,
          ).catch(() => null),
        ]);
        if (cancelled) return;
        const stages = trackingData?.getOrderTracking;
        if (!Array.isArray(stages) || stages.length === 0) throw new Error("not found");
        setTrackingStages(stages);
        setOrderDetail(orderData?.getCurrentCustomerOrder ?? null);
      } catch {
        if (!cancelled) {
          setTrackingStages(null);
          setOrderDetail(null);
          setLiveError(true);
        }
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [liveUuid, locale, token]);

  const returnOrderItems: GqlOrderItem[] = useMemo(
    () =>
      Array.isArray(orderDetail?.orderItems) ? orderDetail.orderItems : [],
    [orderDetail],
  );

  const stages = useMemo((): GqlOrderTrackingStage[] => {
    if (!liveUuid || !trackingStages) return DEMO_ORDER_TRACKING_STAGES;
    return trackingStages;
  }, [liveUuid, trackingStages]);

  const isCancelled = isOrderCancelledFromTracking(stages);
  const lastStage = lastCheckedTrackingStage(stages);
  const stageWaybill = trackingIdFromStages(stages);
  const orderWaybill = String(orderDetail?.tracking?.waybillNo ?? "").trim();
  const waybillNo = stageWaybill || orderWaybill;
  const canReview = canReviewFromTracking(stages);
  const canRequestReturn = canRequestReturnFromTracking(stages);
  const hasDispatchCourier = Boolean(
    getTrackingStage(stages, ORDER_TRACKING_STAGE.DISPATCHING)?.checked && waybillNo,
  );

  const statusSubtitle = useMemo(() => {
    if (!liveUuid || !trackingStages) return t("trackStatusPending");
    return lastStage?.name ?? t("trackStatusPending");
  }, [liveUuid, trackingStages, lastStage, t]);

  const lastUpdateSubtitle = useMemo(() => {
    if (!liveUuid || !trackingStages) return t("trackDemoTimelineMeta");
    const formatted = formatTrackingDate(lastStage?.date, locale);
    return formatted || "—";
  }, [liveUuid, trackingStages, lastStage, locale, t]);

  const lastUpdateCombined = useMemo(() => {
    if (!liveUuid || !trackingStages) return "";
    const name = String(lastStage?.name ?? "").trim();
    const when = formatTrackingDate(lastStage?.date, locale);
    if (name && when) return `${name} · ${when}`;
    return name || when || "";
  }, [liveUuid, trackingStages, lastStage, locale]);

  const trackingSubtitle = useMemo(() => {
    if (!liveUuid || !trackingStages) return t("trackDemoTimelineMeta");
    return waybillNo || "—";
  }, [liveUuid, trackingStages, waybillNo, t]);

  const etaSubtitle = useMemo(() => {
    if (!liveUuid) return t("trackPillarStandard");
    const eta = String(orderDetail?.eta ?? "").trim();
    if (eta) return eta;
    return t("deliveryEtaUnavailable");
  }, [liveUuid, orderDetail?.eta, t]);

  const orderNumberDisplay = useMemo(() => {
    if (!liveUuid) return "";
    const short = shortOrderNumber(liveUuid);
    return short ? `#${short}` : "";
  }, [liveUuid]);

  const orderDateDisplay = useMemo(() => {
    if (!liveUuid) return "";
    const fromOrder = formatOrderPlacementDate(orderDetail?.orderPlacementDate, locale);
    if (fromOrder) return fromOrder;
    const placed = getTrackingStage(stages, ORDER_TRACKING_STAGE.ORDER_PLACED);
    return formatTrackingDate(placed?.date, locale);
  }, [liveUuid, orderDetail?.orderPlacementDate, locale, stages]);

  const destinationCountry = useMemo(
    () => String(orderDetail?.shippingAddress?.country ?? "").trim(),
    [orderDetail?.shippingAddress?.country],
  );

  const addressLines = useMemo(() => {
    const lines = shippingAddressLines(orderDetail?.shippingAddress);
    const country = String(orderDetail?.shippingAddress?.country ?? "").trim();
    // Country is shown on its own row — avoid repeating it in the address block.
    if (country) return lines.filter((line) => line !== country);
    return lines;
  }, [orderDetail?.shippingAddress]);

  const addressBlock = addressLines.length > 0 ? addressLines.join(", ") : "";
  const showDeliveryDetails =
    Boolean(liveUuid && trackingStages) &&
    Boolean(destinationCountry || addressBlock || hasDispatchCourier);

  if (liveUuid && liveLoading) {
    return (
      <div
        className="flex w-full flex-col items-start"
        style={{ width: 870, maxWidth: "100%", gap: 16 }}
      >
        <span
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontSize: 14,
            color: "#666",
          }}
        >
          {t("loadingOrderDetails")}
        </span>
      </div>
    );
  }

  if (liveUuid && liveError && !trackingStages) {
    return (
      <div
        className="flex w-full flex-col items-start gap-4"
        style={{ width: 870, maxWidth: "100%" }}
      >
        <span
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            fontSize: 14,
            color: "#666",
          }}
        >
          {t("loadOrderError") || "Could not load this order."}
        </span>
        <Link
          href="/myaccount/orders"
          className="text-sm font-semibold text-[#CB262E] underline"
        >
          {t("backToOrders") || "Back to Orders"}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col items-start"
      style={{ width: 870, maxWidth: "100%", gap: 8 }}
    >
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 16,
          lineHeight: "120%",
          color: "#262626",
        }}
      >
        {t("trackShipment") || "Track shipment"}
      </span>
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: 12,
          lineHeight: "150%",
          color: "#8F8F8F",
        }}
      >
        {t("trackShipmentSubtitle") || "Follow your order status and delivery updates."}
      </span>

      {liveUuid && trackingStages ? (
        <div className="mt-1 flex w-full flex-col gap-3">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <TrackMetaItem label={t("orderNumber")} value={orderNumberDisplay} />
            <TrackMetaItem label={t("trackOrderDate")} value={orderDateDisplay} />
            <TrackMetaItem
              label={t("trackLatestUpdate")}
              value={lastUpdateCombined || lastUpdateSubtitle}
            />
          </div>

          {showDeliveryDetails ? (
            <div className="flex w-full flex-col gap-2.5">
              <span
                style={{
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  lineHeight: "150%",
                  color: "#262626",
                }}
              >
                {t("trackDeliveryDetails")}
              </span>
              <div className="flex flex-col gap-2.5">
                <TrackDetailRow
                  label={t("trackDestinationCountry")}
                  value={destinationCountry}
                />
                <TrackDetailRow label={t("deliveryAddress")} value={addressBlock} />
                {hasDispatchCourier ? (
                  <TrackDetailRow
                    label={t("trackCourierLabel")}
                    value={FOUR_PX_BRAND_NAME}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col items-start gap-1">
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 13,
                lineHeight: "150%",
                color: isCancelled ? "#CB262E" : "#262626",
              }}
            >
              {`${t("orderStatus")}: ${
                isCancelled
                  ? t("trackStatusCancelled")
                  : (lastStage?.name ?? t("trackStatusPending"))
              }`}
            </span>
            {!isCancelled && waybillNo ? (
              <span
                style={{
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: "150%",
                  color: "#8F8F8F",
                }}
              >
                {`${t("trackWaybillNo")}: ${waybillNo}`}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div style={lineStyle} className="mt-1" aria-hidden />

      <div
        className="flex w-full flex-row flex-nowrap items-center justify-between gap-2 sm:gap-6 md:gap-8"
        style={{
          minHeight: 124,
          background: "#FFFFFF",
          borderRadius: 6,
          padding: "16px 12px",
          boxSizing: "border-box",
        }}
      >
        <ShipmentDetailPillar
          icon={PillarIconDelivery}
          title={t("estDelivery")}
          subtitle={etaSubtitle}
        />
        <ShipmentDetailPillar
          icon={PillarIconStatus}
          title={t("trackPillarStatus")}
          subtitle={statusSubtitle}
          iconWrap={60}
        />
        <ShipmentDetailPillar
          icon={PillarIconTracking}
          title={t("trackPillarTrackingNo")}
          subtitle={trackingSubtitle}
          iconWrap={60}
        />
      </div>

      <div
        className="w-full"
        style={{ borderTop: "0.5px solid #DCF3EF", maxWidth: 870 }}
        aria-hidden
      />

      <div className="w-full overflow-x-auto">
        <OrderTrackingTimeline stages={stages} locale={locale} className="min-w-[320px]" />
      </div>

      <div
        className="box-border flex w-full flex-col items-stretch"
        style={{
          marginTop: 32,
          paddingLeft: "clamp(16px, 6vw, 77px)",
          paddingRight: "clamp(16px, 6vw, 77px)",
          maxWidth: "100%",
        }}
      >
        {canReview && liveUuid ? (
          <Link
            href={`/myaccount/orders/${encodeURIComponent(liveUuid)}`}
            className="inline-flex w-full flex-row items-center justify-center hover:opacity-90 sm:w-auto"
            style={{
              boxSizing: "border-box",
              padding: "14px 28px",
              gap: 4,
              maxWidth: "100%",
              minHeight: 48,
              border: "1px solid #CB262E",
              borderRadius: 5,
              background: "transparent",
              textDecoration: "none",
              ...ctaLabel,
              color: "#CB262E",
            }}
          >
            {t("trackAddReviewShort")}
          </Link>
        ) : null}

        <div
          className="flex flex-col items-stretch justify-start sm:flex-row sm:flex-wrap sm:items-center"
          style={{
            marginTop: canReview && liveUuid ? 17 : 0,
            gap: 18,
            width: 700,
            maxWidth: "100%",
          }}
        >
          {canRequestReturn ? (
            <button
              type="button"
              onClick={() => setReturnModalOpen(true)}
              className="flex shrink-0 flex-row items-center justify-center hover:opacity-90"
              style={{
                boxSizing: "border-box",
                padding: "20px 34px",
                gap: 4,
                width: 333,
                maxWidth: "100%",
                height: 50,
                background: "#CB262E",
                border: "1px solid #CB262E",
                borderRadius: 5,
                cursor: "pointer",
                ...ctaLabel,
                color: "#FFFFFF",
              }}
            >
              {t("requestReturn") || "Request Return"}
            </button>
          ) : null}
          <Link
            href="/myaccount/orders"
            className="flex shrink-0 flex-row items-center justify-center hover:opacity-90"
            style={{
              boxSizing: "border-box",
              padding: "16px 34px",
              gap: 4,
              width: 333,
              maxWidth: "100%",
              height: 50,
              background: "#CB262E",
              borderRadius: 5,
              border: "none",
              textDecoration: "none",
              ...ctaLabel,
              color: "#FFFFFF",
            }}
          >
            {t("backToOrders") || "Back to Orders"}
          </Link>
        </div>
      </div>

      <ReturnRequestModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        orderUuid={liveUuid}
        orderItems={returnOrderItems}
      />
    </div>
  );
}

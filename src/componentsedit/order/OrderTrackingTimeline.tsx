"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { FOUR_PX_BRAND_BLUE, FOUR_PX_BRAND_NAME } from "@/lib/checkout/fourPxShipping";
import {
  formatTrackingDate,
} from "@/lib/order/orderTracking";
import {
  ORDER_TRACKING_STAGE,
  type GqlOrderTrackingStage,
} from "@/services/graphql/types/orderTracking";

function IconOrderPlaced({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconPaymentConfirmed({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6 15h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="17" cy="15" r="1.25" fill="currentColor" />
    </svg>
  );
}

function IconOrderConfirmed({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconProcessing({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPacking({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconDispatching({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 18V6H3v12h2.5M14 18h-5M14 18h2.5M19 18a2 2 0 100-4 2 2 0 000 4zM7 18a2 2 0 100-4 2 2 0 000 4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10h3l2 3v3h-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDelivered({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 11l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReview({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCancelled({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M15 9l-6 6M9 9l6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMessage({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCall({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STAGE_ICONS: Record<number, ComponentType<{ size?: number }>> = {
  [ORDER_TRACKING_STAGE.ORDER_PLACED]: IconOrderPlaced,
  [ORDER_TRACKING_STAGE.PAYMENT_CONFIRMED]: IconPaymentConfirmed,
  [ORDER_TRACKING_STAGE.ORDER_CONFIRMED]: IconOrderConfirmed,
  [ORDER_TRACKING_STAGE.PROCESSING]: IconProcessing,
  [ORDER_TRACKING_STAGE.PACKING]: IconPacking,
  [ORDER_TRACKING_STAGE.DISPATCHING]: IconDispatching,
  [ORDER_TRACKING_STAGE.DELIVERED]: IconDelivered,
  [ORDER_TRACKING_STAGE.REVIEW]: IconReview,
  [ORDER_TRACKING_STAGE.CANCELLED]: IconCancelled,
};

function stageIcon(id: number): ComponentType<{ size?: number }> {
  return STAGE_ICONS[id] ?? IconOrderPlaced;
}

function StarRating({ rating }: { rating: number }) {
  const safe = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex flex-row items-center gap-0.5" aria-label={`${safe} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill={i < safe ? "#CB262E" : "none"}
          aria-hidden
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke={i < safe ? "#CB262E" : "#C4C4C4"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function StatusBlock({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-px" style={{ maxWidth: "100%" }}>
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          lineHeight: "150%",
          color: "#000000",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: 12,
          lineHeight: "190%",
          color: "#7A7A7A",
        }}
      >
        {meta}
      </span>
    </div>
  );
}

function DispatchingPartnerCard({ trackingId }: { trackingId: string }) {
  const t = useTranslations();
  return (
    <div
      className="mt-2 w-full max-w-[285px] rounded-[5px]"
      style={{ background: "#F8F8F8", padding: "0 0 6px 0" }}
    >
      <div className="flex flex-row items-center gap-3 px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-col px-2.5 pt-px pb-1">
          <div className="flex flex-row items-center gap-2">
            <span
              className="inline-flex shrink-0 items-center justify-center rounded px-2 py-0.5 font-sans text-[10px] font-bold tracking-wide text-white"
              style={{ background: FOUR_PX_BRAND_BLUE }}
            >
              {FOUR_PX_BRAND_NAME}
            </span>
            <span
              className="min-w-0 truncate"
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 10,
                lineHeight: "150%",
                color: "#000000",
              }}
            >
              {t("deliveryPartner")}
            </span>
          </div>
          {trackingId ? (
            <span
              className="mt-1 truncate"
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 11,
                lineHeight: "150%",
                color: "#262626",
              }}
            >
              {`${t("trackWaybillNo")}: ${trackingId}`}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-full hover:opacity-90"
          style={{
            width: 28,
            height: 28,
            background: "#F8F8F8",
            border: "1px solid #CB262E",
            color: "#CB262E",
          }}
          aria-label={t("trackAriaMessage")}
        >
          <IconMessage />
        </button>
        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-full hover:opacity-90"
          style={{
            width: 28,
            height: 28,
            background: "#F8F8F8",
            border: "1px solid #CB262E",
            color: "#CB262E",
          }}
          aria-label={t("trackAriaCall")}
        >
          <IconCall />
        </button>
      </div>
    </div>
  );
}

function StageExtraContent({ stage }: { stage: GqlOrderTrackingStage }) {
  const t = useTranslations();
  const meta = stage.metadata;

  if (stage.id === ORDER_TRACKING_STAGE.DISPATCHING && stage.checked) {
    const trackingId = String(meta?.trackingId ?? "").trim();
    if (trackingId) return <DispatchingPartnerCard trackingId={trackingId} />;
  }

  if (stage.id === ORDER_TRACKING_STAGE.REVIEW && stage.checked) {
    const rating = meta?.reviewRating;
    const reviewText = String(meta?.reviewText ?? "").trim();
    if (rating != null || reviewText) {
      return (
        <div className="mt-2 flex max-w-[285px] flex-col gap-1.5 rounded-md bg-[#FAFAFA] px-3 py-2">
          {rating != null ? (
            <div className="flex flex-row items-center gap-2">
              <span
                style={{
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontSize: 11,
                  color: "#7A7A7A",
                }}
              >
                {t("trackReviewRatingLabel")}
              </span>
              <StarRating rating={Number(rating)} />
            </div>
          ) : null}
          {reviewText ? (
            <p
              className="m-0"
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontSize: 12,
                lineHeight: "160%",
                color: "#262626",
              }}
            >
              {reviewText}
            </p>
          ) : null}
        </div>
      );
    }
  }

  if (stage.id === ORDER_TRACKING_STAGE.CANCELLED && stage.checked) {
    const reason = String(meta?.cancellationReason ?? "").trim();
    if (reason) {
      return (
        <p
          className="m-0 mt-1.5 max-w-[285px] text-xs leading-[160%] text-[#7A7A7A]"
          role="status"
        >
          <span
            className="font-medium text-[#262626]"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {`${t("trackCancellationReasonLabel")}: `}
          </span>
          {reason}
        </p>
      );
    }
  }

  return null;
}

function buildStageMeta(
  stage: GqlOrderTrackingStage,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): string {
  if (!stage.checked) return t("trackMetaPending");
  const formatted = formatTrackingDate(stage.date, locale);
  return formatted || t("trackMetaCompleted");
}

export type OrderTrackingTimelineProps = {
  stages: GqlOrderTrackingStage[];
  locale: string;
  className?: string;
};

export default function OrderTrackingTimeline({
  stages,
  locale,
  className = "",
}: OrderTrackingTimelineProps) {
  const t = useTranslations();
  const sorted = [...stages].sort((a, b) => a.id - b.id);

  return (
    <div
      className={`flex w-full flex-col items-start ${className}`.trim()}
      style={{
        paddingBlock: 8,
        paddingInline: "11px 9px",
        gap: 8,
        background: "#FFFFFF",
        borderRadius: 6,
      }}
    >
      <div className="flex w-full flex-col">
        {sorted.map((stage, i) => {
          const Icon = stageIcon(stage.id);
          const active = stage.checked;
          const isLast = i === sorted.length - 1;

          return (
            <div key={stage.id} className="flex w-full flex-row items-stretch gap-2.5">
              <div className="flex w-8 shrink-0 flex-col items-center">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: active ? "#CB262E" : "#E8E8E8",
                    border: `1px solid ${active ? "#CB262E" : "#E8E8E8"}`,
                    color: active ? "#FFFFFF" : "#757575",
                  }}
                  aria-current={active ? "step" : undefined}
                >
                  <Icon size={18} />
                </div>
                {!isLast ? (
                  <div
                    className="w-0 flex-1"
                    style={{
                      minHeight: 12,
                      borderInlineStart: `1px dashed ${active ? "#CB262E" : "#D0D0D0"}`,
                    }}
                    aria-hidden
                  />
                ) : null}
              </div>

              <div
                className="min-w-0 flex-1"
                style={{
                  paddingBottom: isLast ? 0 : 16,
                  opacity: active ? 1 : 0.72,
                }}
              >
                <StatusBlock
                  title={stage.name}
                  meta={buildStageMeta(stage, locale, t)}
                />
                <StageExtraContent stage={stage} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { stageIcon, STAGE_ICONS };

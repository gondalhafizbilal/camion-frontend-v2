"use client";

import { useTranslations } from "next-intl";
import { getOrderStatusBadgeStyle } from "@/lib/order/orderStatusBadge";
import { translateOrderDisplayStatus } from "@/lib/order/translateOrderDisplayStatus";

export type OrderStatusBadgeProps = {
  statusDisplay: string | undefined | null;
  className?: string;
};

export default function OrderStatusBadge({
  statusDisplay,
  className = "",
}: OrderStatusBadgeProps) {
  const t = useTranslations();
  const { background, color } = getOrderStatusBadgeStyle(statusDisplay);
  const label =
    translateOrderDisplayStatus(statusDisplay, t) || t("orderStatusInProcess");

  return (
    <span
      className={`inline-flex items-center justify-center self-start shrink-0 ${className}`.trim()}
      style={{
        minWidth: 100,
        height: 24,
        padding: "5px 13px",
        background,
        borderRadius: 5,
        fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
        fontWeight: 500,
        fontSize: 12,
        lineHeight: "15px",
        letterSpacing: "-0.19px",
        color,
      }}
    >
      {label}
    </span>
  );
}

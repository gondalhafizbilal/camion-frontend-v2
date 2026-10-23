"use client";

import Image from "@/componentsedit/StaticImage";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export type HeaderCartButtonProps = {
  totalItems?: number;
  /** Desktop header uses smaller icons; mobile uses 32px + optional label. */
  variant?: "desktop" | "mobile";
  showLabel?: boolean;
};

function CartBadge({
  totalItems,
  variant,
}: {
  totalItems: number;
  variant: "desktop" | "mobile";
}) {
  if (totalItems <= 0) return null;
  return (
    <span
      className={[
        "absolute flex items-center justify-center rounded-full bg-white font-bold text-[#CB262E]",
        variant === "mobile"
          ? "-top-1 -end-1 min-w-[16px] h-4 px-0.5"
          : "-top-2 -end-2 min-w-[16px] h-4 px-1",
      ].join(" ")}
      style={{ fontSize: 10 }}
    >
      {totalItems}
    </span>
  );
}

function CartIcon({
  iconSize,
  totalItems,
  variant,
}: {
  iconSize: number;
  totalItems: number;
  variant: "desktop" | "mobile";
}) {
  return (
    <span className={variant === "mobile" ? "relative inline-block" : "relative"}>
      <Image
        src="/assets/icons/cart.svg"
        alt=""
        width={iconSize}
        height={iconSize}
        unoptimized
        className="block"
      />
      <CartBadge totalItems={totalItems} variant={variant} />
    </span>
  );
}

export default function HeaderCartButton({
  totalItems = 0,
  variant = "desktop",
  showLabel = false,
}: HeaderCartButtonProps) {
  const t = useTranslations();
  const iconSize = variant === "mobile" ? 32 : 24;

  const label =
    variant === "mobile" && showLabel ? (
      <span
        className="hidden sm:inline"
        style={{
          fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          lineHeight: "16px",
          textTransform: "capitalize",
        }}
      >
        {t("cart")}
      </span>
    ) : null;

  return (
    <Link
      href="/cart"
      className={[
        "relative transition-opacity hover:opacity-90",
        variant === "mobile"
          ? "flex items-center text-white hover:opacity-80"
          : "",
      ].join(" ")}
      style={variant === "mobile" && showLabel ? { gap: 8 } : undefined}
      aria-label={t("cart")}
    >
      <CartIcon iconSize={iconSize} totalItems={totalItems} variant={variant} />
      {label}
    </Link>
  );
}

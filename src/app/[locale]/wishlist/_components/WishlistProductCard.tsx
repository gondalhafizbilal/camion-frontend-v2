"use client";

import Image from "@/componentsedit/StaticImage";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useCurrency } from "@/componentsedit/context/CurrencyContext";
import type { CarouselProduct } from "@/componentsedit/home/ProductCarouselSection";
import {
  PRODUCT_IMAGE_FALLBACK,
  productImageUrlOrFallback,
} from "@/lib/productImageFallback";
import {
  DISCOUNT_PERCENT_DIR,
  formatDiscountPercentLabel,
} from "@/lib/formatDiscountPercent";
import { formatMoneyAmount } from "@/lib/currency/localizedCurrencyCode";

function FilledHeartIcon() {
  return (
    <svg width="18" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"
        fill="#CB262E"
        stroke="#CB262E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="flex-shrink-0"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="#F7C95F"
        stroke="rgba(0,0,0,0.05)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const decodeHtml = (html: unknown): string => {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/\$amp/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
};

export default function WishlistProductCard({
  product,
  imageSrc = PRODUCT_IMAGE_FALLBACK,
  discountPercent = 35,
  name = "Product",
  favouritesText = "Favourite",
  ratingValue = 4.5,
  reviewCountText = "",
  priceText = "",
  oldPriceText = "",
}: {
  product?: CarouselProduct | null;
  imageSrc?: string;
  discountPercent?: number;
  name?: string;
  favouritesText?: string;
  ratingValue?: number;
  reviewCountText?: string;
  priceText?: string;
  oldPriceText?: string;
}) {
  const locale = useLocale();
  const { currency } = useCurrency();

  const resolvedName = product
    ? decodeHtml(product?.name || "Product")
    : name;
  const resolvedImg = productImageUrlOrFallback(
    product
      ? product?.images?.[0]?.thumbnail || product?.images?.[0]?.src || ""
      : imageSrc || "",
  );
  const [imgSrc, setImgSrc] = useState(resolvedImg);
  useEffect(() => {
    setImgSrc(resolvedImg);
  }, [resolvedImg]);
  const prices = product?.prices || {};
  const regular = prices?.regular_price;
  const sale = prices?.sale_price;
  const displayPrice = prices?.price ?? sale ?? regular;
  const onSale =
    Boolean(product?.on_sale) ||
    (Number(sale) > 0 &&
      Number(regular) > 0 &&
      Number(sale) < Number(regular));
  const computedDiscount =
    onSale && Number(regular) > 0
      ? Math.round(
          (1 - Number(sale || displayPrice) / Number(regular)) * 100,
        )
      : discountPercent;
  const resolvedPrice =
    product && displayPrice != null
      ? formatMoneyAmount(
          displayPrice,
          locale,
          prices?.currency_code || currency || "QAR",
        )
      : priceText;
  const resolvedOldPrice =
    product && onSale && Number(regular) > 0
      ? formatMoneyAmount(
          regular,
          locale,
          prices?.currency_code || currency || "QAR",
        )
      : oldPriceText;
  const showStrikePrice =
    typeof resolvedOldPrice === "string" && resolvedOldPrice.trim().length > 0;

  return (
    <article
      className="flex flex-col items-start p-0"
      style={{ width: 270, height: 536.64 }}
    >
      <div
        className="relative w-full flex-shrink-0 rounded-[4px]"
        style={{ height: 375, background: "#F5F5F5" }}
      >
        <Image
          src={imgSrc}
          alt={resolvedName}
          fill
          sizes="270px"
          className="object-cover rounded-[4px]"
          unoptimized
          loading="lazy"
          onError={() => setImgSrc(PRODUCT_IMAGE_FALLBACK)}
        />

        {Number(computedDiscount) > 0 && (
          <div
            className="absolute start-[12px] top-[12px] flex items-center justify-center rounded-[4px]"
            style={{
              width: 55,
              height: 26,
              background: "#CB262E",
              padding: "4px 12px",
            }}
          >
            <span
              dir={DISCOUNT_PERCENT_DIR}
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "18px",
                color: "#FAFAFA",
              }}
            >
              {formatDiscountPercentLabel(Number(computedDiscount))}
            </span>
          </div>
        )}

        <button
          type="button"
          aria-label="Remove from wishlist"
          className="absolute end-[12px] top-[12px] w-[34px] h-[34px] rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.1)" }}
        >
          <FilledHeartIcon />
        </button>
      </div>

      <div
        className="w-full flex flex-col items-start bg-white"
        style={{ height: 161.64, padding: 13.0909, gap: 9.82 }}
      >
        <div className="w-full flex flex-col items-start" style={{ gap: 6.55 }}>
          <div
            className="w-full flex flex-col items-start"
            style={{ gap: 3.27 }}
          >
            <div
              className="w-full"
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: 18,
                lineHeight: "22px",
                textTransform: "capitalize",
                color: "#000000",
              }}
            >
              {resolvedName}
            </div>
          </div>

          <div className="w-full flex items-center" style={{ gap: 3.27 }}>
            <div className="flex items-center" style={{ gap: 3.27 }}>
              <FilledHeartIcon />
              <span
                style={{
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: "20px",
                  textTransform: "capitalize",
                  color: "#000000",
                }}
              >
                40M
              </span>
            </div>

            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: "20px",
                textTransform: "capitalize",
                color: "#000000",
              }}
            >
              {favouritesText}
            </span>
          </div>
        </div>

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center">
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "20px",
                textTransform: "capitalize",
                color: "#000000",
                marginInlineEnd: 8,
              }}
            >
              {Number(ratingValue).toFixed(1)}
            </span>
            <div className="flex items-center">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
            </div>
          </div>

          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 14,
              lineHeight: "20px",
              textTransform: "capitalize",
              color: "rgba(0, 0, 0, 0.6)",
            }}
          >
            {reviewCountText}
          </span>
        </div>

        <div
          className={`w-full flex ${showStrikePrice ? "flex-col items-start gap-1" : "items-center"}`}
          style={showStrikePrice ? undefined : { gap: 6.55 }}
        >
          <span
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 18,
              lineHeight: "22px",
              textTransform: "capitalize",
              color: "#000000",
            }}
          >
            {resolvedPrice}
          </span>
          {showStrikePrice ? (
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "20px",
                textDecorationLine: "line-through",
                textTransform: "capitalize",
                color: "#CB262E",
              }}
            >
              {resolvedOldPrice}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

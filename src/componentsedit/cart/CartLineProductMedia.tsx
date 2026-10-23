"use client";

import type { ReactNode } from "react";
import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import { ProductDetailCampaignStrip } from "@/componentsedit/products/ProductDetailCampaignBlock";
import {
  getCheckoutLineCampaign,
  getCheckoutLineDiscountPercentage,
  type CheckoutCartLine,
} from "@/types/checkoutDisplay";

export type CartLineProductMediaProps = {
  item: CheckoutCartLine;
  alt: string;
  href?: string | null;
  imageSrc?: string;
  imageWidth: number;
  imageHeight: number;
  imageClassName?: string;
  className?: string;
  badgeClassName?: string;
  campaignStripClassName?: string;
  showCampaign?: boolean;
  overlay?: ReactNode;
};

export default function CartLineProductMedia({
  item,
  alt,
  href = null,
  imageSrc,
  imageWidth,
  imageHeight,
  imageClassName = "h-full w-full object-cover",
  className = "",
  badgeClassName = "text-[10px] px-1.5 py-0.5 sm:text-xs sm:px-2",
  campaignStripClassName = "h-5 sm:h-6",
  showCampaign = true,
  overlay = null,
}: CartLineProductMediaProps) {
  const img = imageSrc || item.image || item.thumbnail || "/assets/images/no-image.png";
  const campaign = getCheckoutLineCampaign(item);
  const discountPct = getCheckoutLineDiscountPercentage(item);

  const imageBox = (
    <div className="relative w-full shrink-0 overflow-hidden rounded-sm bg-[#F6F6F6]">
      <Image
        src={img}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        className={imageClassName}
        unoptimized
      />
      {discountPct > 0 ? (
        <span
          className={`absolute start-0 top-0 rounded-ee-md bg-[#B92123] font-sans font-semibold leading-none text-white ${badgeClassName}`.trim()}
        >
          {discountPct}%
        </span>
      ) : null}
      {overlay}
    </div>
  );

  return (
    <div className={`flex shrink-0 flex-col overflow-hidden ${className}`.trim()}>
      {href ? (
        <Link
          href={href}
          className="block transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CB262E]"
          aria-label={alt}
        >
          {imageBox}
        </Link>
      ) : (
        imageBox
      )}
      {showCampaign ? (
        <ProductDetailCampaignStrip
          campaign={campaign}
          className={campaignStripClassName}
        />
      ) : null}
    </div>
  );
}

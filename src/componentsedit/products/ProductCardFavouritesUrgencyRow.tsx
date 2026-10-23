"use client";

import { useLocale, useTranslations } from "next-intl";
import ProductUrgencyLabel from "@/componentsedit/products/ProductUrgencyLabel";
import { resolveProductUrgencyCount } from "@/lib/product/resolveProductUrgencyCount";

const ROW_HEIGHT_PX = 14;
const BRAND_RED = "#CB262E";

function MiniHeartIcon() {
  return (
    <svg
      width={11.73}
      height={11.73}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="flex-shrink-0"
    >
      <path
        d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"
        fill={BRAND_RED}
        stroke={BRAND_RED}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatLikesCount(v: unknown, locale: string) {
  const loc = locale === "ar" ? "ar" : "en";
  if (v === null || v === undefined) return "0";
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Intl.NumberFormat(loc, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return "0";
    const n = Number(s);
    if (Number.isFinite(n)) {
      return new Intl.NumberFormat(loc, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);
    }
    return s;
  }
  const n = Number(v);
  if (Number.isFinite(n)) {
    return new Intl.NumberFormat(loc, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return "0";
}

const ROW_FONT = {
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontSize: 10.04,
  lineHeight: "14px",
} as const;

function FavouritesContent({ likesCount }: { likesCount: unknown }) {
  const t = useTranslations();
  const locale = useLocale();
  const likes = formatLikesCount(likesCount, locale);
  const label = t("productCarouselFavourites");

  return (
    <div className="flex flex-row items-center" style={{ gap: 2.35 }}>
      <div className="flex flex-row items-center" style={{ gap: 2.35 }}>
        <MiniHeartIcon />
        <span style={{ ...ROW_FONT, fontWeight: 400, textTransform: "capitalize", color: "#000000" }}>
          {likes}
        </span>
      </div>
      <span style={{ ...ROW_FONT, fontWeight: 600, color: "#000000" }}>{label}</span>
    </div>
  );
}

export type ProductCardFavouritesUrgencyRowProps = {
  likesCount: unknown;
  urgencyCount?: number | string | null;
  className?: string;
};

/**
 * Product card body row: favourites likes, or slides between favourites and
 * fake urgency (“Only {count} left”) when urgencyCount > 0.
 */
export default function ProductCardFavouritesUrgencyRow({
  likesCount,
  urgencyCount,
  className = "",
}: ProductCardFavouritesUrgencyRowProps) {
  const resolvedCount =
    typeof urgencyCount === "number" || typeof urgencyCount === "string"
      ? resolveProductUrgencyCount({ urgency_count: urgencyCount })
      : 0;
  const showUrgency = resolvedCount > 0;

  if (!showUrgency) {
    return (
      <div
        className={`flex flex-row items-center leading-[14px] ${className}`.trim()}
        style={{ gap: 2.35 }}
      >
        <FavouritesContent likesCount={likesCount} />
      </div>
    );
  }

  return (
    <div
      className={`product-card-favourites-urgency-viewport overflow-hidden leading-[14px] ${className}`.trim()}
      style={{ height: ROW_HEIGHT_PX }}
    >
      <div className="product-card-favourites-urgency-slider flex flex-col">
        <div
          className="flex shrink-0 items-center"
          style={{ height: ROW_HEIGHT_PX, gap: 2.35 }}
        >
          <FavouritesContent likesCount={likesCount} />
        </div>
        <div
          className="flex shrink-0 items-center"
          style={{ height: ROW_HEIGHT_PX, gap: 2.35 }}
        >
          <ProductUrgencyLabel count={resolvedCount} size="card" />
        </div>
      </div>
    </div>
  );
}

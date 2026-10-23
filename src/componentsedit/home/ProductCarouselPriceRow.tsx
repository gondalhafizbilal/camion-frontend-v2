"use client";

import {
  DISCOUNT_PERCENT_DIR,
  formatDiscountPercentLabel,
} from "@/lib/formatDiscountPercent";
import {
  getCurrencyAffixes,
  isArabicLocale,
} from "@/lib/currency/localizedCurrencyCode";

const FONT = "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif";
const BRAND = "#CB262E";

type PriceParts = {
  currencyPrefix: string;
  main: string;
  fraction: string;
  currencySuffix: string;
};

function getPriceParts(
  amount: unknown,
  locale: string,
  currencyCode?: string,
): PriceParts | null {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;

  const arabic = isArabicLocale(locale);
  let parts: Intl.NumberFormatPart[];
  try {
    parts = new Intl.NumberFormat(arabic ? "ar" : "en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
      numberingSystem: arabic ? "arab" : "latn",
    }).formatToParts(n);
  } catch {
    return null;
  }

  let prefix = "";
  let integer = "";
  let fraction = "";
  let phase: "prefix" | "int" | "frac" = "prefix";

  for (const part of parts) {
    if (part.type === "integer") {
      phase = "int";
      integer += part.value;
    } else if (part.type === "decimal" || part.type === "fraction") {
      phase = "frac";
      fraction += part.value;
    } else if (phase === "int" || phase === "frac") {
      // ignore unexpected trailing tokens on number-only format
    } else {
      prefix += part.value;
    }
  }

  const { prefix: currencyPrefix, suffix: currencySuffix } = getCurrencyAffixes(
    currencyCode,
    locale,
  );

  return {
    currencyPrefix,
    main: prefix + integer,
    fraction,
    currencySuffix,
  };
}

function PriceWithSmallFraction({
  amount,
  locale,
  currencyCode,
  mainClassName,
  fractionClassName,
}: {
  amount: unknown;
  locale: string;
  currencyCode?: string;
  mainClassName: string;
  fractionClassName: string;
}) {
  const parts = getPriceParts(amount, locale, currencyCode);
  if (!parts) return null;

  return (
    <span className={mainClassName} style={{ fontFamily: FONT }}>
      {parts.currencyPrefix}
      {parts.main}
      {parts.fraction ? (
        <span className={fractionClassName}>{parts.fraction}</span>
      ) : null}
      {parts.currencySuffix}
    </span>
  );
}

type ProductCarouselPriceRowProps = {
  onSale: boolean;
  discountPercent: number;
  displayPrice: unknown;
  regularPrice: unknown;
  locale: string;
  currencyCode?: string;
};

export default function ProductCarouselPriceRow({
  onSale,
  discountPercent,
  displayPrice,
  regularPrice,
  locale,
  currencyCode = "QAR",
}: ProductCarouselPriceRowProps) {
  const currency = currencyCode || "QAR";
  const showSaleRow = onSale && Number(regularPrice) > 0;

  if (showSaleRow) {
    return (
      <div className="flex min-w-0 flex-row flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        {discountPercent > 0 ? (
          <span
            dir={DISCOUNT_PERCENT_DIR}
            className="shrink-0 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#FAFAFA]"
            style={{ fontFamily: FONT, background: BRAND }}
          >
            {formatDiscountPercentLabel(discountPercent)}
          </span>
        ) : null}
        <PriceWithSmallFraction
          amount={displayPrice}
          locale={locale}
          currencyCode={currency}
          mainClassName="shrink-0 text-[14px] font-bold leading-tight text-[#CB262E]"
          fractionClassName="text-[11px] font-bold leading-tight text-[#CB262E]"
        />
        <PriceWithSmallFraction
          amount={regularPrice}
          locale={locale}
          mainClassName="shrink-0 text-[11px] font-bold leading-tight text-black/45 line-through"
          fractionClassName="text-[9px] font-bold leading-tight text-black/45 line-through"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline">
      <PriceWithSmallFraction
        amount={displayPrice}
        locale={locale}
        currencyCode={currency}
        mainClassName="text-[14px] font-semibold leading-snug text-black"
        fractionClassName="text-[11px] font-semibold leading-snug text-black"
      />
    </div>
  );
}

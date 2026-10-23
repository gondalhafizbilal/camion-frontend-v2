/**
 * Display helpers for amounts across the site.
 *
 * Arabic (`locale` starts with `ar`): Eastern Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
 * and Arabic decimal separator (٫), e.g. ١٤٫٥٠
 *
 * Other locales: Latin digits, e.g. 14.50
 */

export type FormatLocalizedAmountOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /**
   * Thousands separators. Default false to match classic `toFixed(2)` money rows.
   */
  useGrouping?: boolean;
};

function resolveAmount(amount: number): number {
  return Number.isFinite(amount) ? amount : 0;
}

export function isArabicLocale(locale: string): boolean {
  return String(locale || "")
    .toLowerCase()
    .startsWith("ar");
}

/**
 * Formats a numeric amount for on-screen display.
 * Use this (or {@link formatAmountWithCurrency}) anywhere money/qty amounts are shown.
 *
 * @example
 * formatLocalizedAmount(14.5, "en") // "14.50"
 * formatLocalizedAmount(14.5, "ar") // "١٤٫٥٠"
 * formatLocalizedAmount(-5, "ar")   // "-٥٫٠٠"
 */
export function formatLocalizedAmount(
  amount: number,
  locale: string,
  options: FormatLocalizedAmountOptions = {},
): string {
  const value = resolveAmount(amount);
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useGrouping = false,
  } = options;

  const arabic = isArabicLocale(locale);
  try {
    return new Intl.NumberFormat(arabic ? "ar" : "en", {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
      numberingSystem: arabic ? "arab" : "latn",
    }).format(value);
  } catch {
    return value.toFixed(Math.max(0, maximumFractionDigits));
  }
}

/**
 * Localized currency label for UI (e.g. QAR → ر.ق. when locale is Arabic).
 * Keeps ISO codes for English and other locales.
 */
export function getLocalizedCurrencyCode(
  currencyCode: string | null | undefined,
  locale: string,
): string {
  const code = String(currencyCode ?? "QAR").trim().toUpperCase() || "QAR";
  if (!isArabicLocale(locale)) return code;
  try {
    const parts = new Intl.NumberFormat("ar", {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
      numberingSystem: "arab",
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === "currency")?.value?.trim();
    return symbol || code;
  } catch {
    return code;
  }
}

/**
 * Locale-aware currency placement around a pre-formatted amount.
 * English: currency before — { prefix: "QAR ", suffix: "" }
 * Arabic: currency after — { prefix: "", suffix: " ر.ق." }
 *
 * Pass an explicit empty/`undefined` code only when no currency label should render
 * (e.g. strikethrough amounts). Prefer {@link joinAmountWithCurrency} for full money strings.
 */
export function getCurrencyAffixes(
  currencyCode: string | null | undefined,
  locale: string,
): { prefix: string; suffix: string } {
  if (currencyCode == null || String(currencyCode).trim() === "") {
    return { prefix: "", suffix: "" };
  }
  const currency = getLocalizedCurrencyCode(currencyCode, locale);
  if (!currency) return { prefix: "", suffix: "" };
  if (isArabicLocale(locale)) {
    return { prefix: "", suffix: ` ${currency}` };
  }
  return { prefix: `${currency} `, suffix: "" };
}

/**
 * Joins a pre-formatted amount with a localized currency label.
 * English: "QAR 14.00" — currency before amount
 * Arabic: "١٤٫٠٠ ر.ق." — currency after amount
 */
export function joinAmountWithCurrency(
  formattedAmount: string,
  currencyCode: string | null | undefined,
  locale: string,
): string {
  const { prefix, suffix } = getCurrencyAffixes(
    currencyCode ?? "QAR",
    locale,
  );
  return `${prefix}${formattedAmount}${suffix}`;
}

/**
 * Amount + localized currency label.
 * English: currency before amount — "QAR 14.00"
 * Arabic: currency after amount — "١٤٫٠٠ ر.ق."
 *
 * Pass a negative `amount` for discounts (e.g. `-5` → "-٥٫٠٠ ر.ق.").
 */
export function formatAmountWithCurrency(
  amount: number,
  currencyCode: string | null | undefined,
  locale: string,
  options?: FormatLocalizedAmountOptions,
): string {
  const n = resolveAmount(amount);
  const formatted = formatLocalizedAmount(n, locale, options);
  return joinAmountWithCurrency(formatted, currencyCode, locale);
}

/**
 * Drop-in for legacy local `formatMoney(amount, locale, currency)` helpers.
 * Returns "" for non-finite amounts (same as most product-card formatters).
 */
export function formatMoneyAmount(
  amount: unknown,
  locale: string,
  currencyCode: string | null | undefined = "QAR",
  options?: FormatLocalizedAmountOptions,
): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  return formatAmountWithCurrency(n, currencyCode, locale, options);
}

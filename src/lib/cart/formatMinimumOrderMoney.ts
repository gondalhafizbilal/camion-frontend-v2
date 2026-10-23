import { formatAmountWithCurrency } from "@/lib/currency/localizedCurrencyCode";

/** Cart / free-shipping money labels — delegates to shared localized amount helper. */
export function formatMinimumOrderMoney(
  amount: number,
  currencyCode: string,
  locale: string,
): string {
  return formatAmountWithCurrency(amount, currencyCode, locale);
}

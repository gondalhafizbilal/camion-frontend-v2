"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import { fetchCustomerSavedCards, type GqlCustomerSavedCard } from "@/services/graphql";
import { PaymentMethodIconByType } from "@/componentsedit/PaymentMethodIcons";

export type SkipCashSavedCardsSelectorProps = {
  selectedPaymentMethod?: string;
  selectedSavedCardTokenId?: string | null;
  onSelectSavedCardTokenId?: (tokenId: string | null) => void;
};

function formatExpiry(card: GqlCustomerSavedCard): string {
  const mm = card.expiryMonth ?? "";
  const yy = card.expiryYear ?? "";
  const mmTrim = typeof mm === "string" ? mm.trim() : "";
  const yyTrim = typeof yy === "string" ? yy.trim() : "";
  if (!mmTrim && !yyTrim) return "";
  return `${mmTrim}/${yyTrim}`.trim();
}

function normalizeSavedCardBrand(brand?: string | null): string {
  const value = String(brand ?? "")
    .trim()
    .toLowerCase();
  if (!value) return "mastercard";

  if (
    [
      "mastercard",
      "master-card",
      "master_card",
      "master card",
      "mc",
      "paywithcard",
      "skipcash",
    ].includes(value) ||
    value.includes("master")
  ) {
    return "mastercard";
  }

  if (value.includes("visa") || ["visaelectron", "visa-electron"].includes(value)) {
    return "visa";
  }

  if (value.includes("amex") || ["american express", "americanexpress"].includes(value)) {
    return "amex";
  }

  return value;
}

export default function SkipCashSavedCardsSelector({
  selectedPaymentMethod,
  selectedSavedCardTokenId = null,
  onSelectSavedCardTokenId,
}: SkipCashSavedCardsSelectorProps) {
  const t = useTranslations();
  const token = Cookies.get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<GqlCustomerSavedCard[]>([]);

  const enabled = Boolean(selectedPaymentMethod) && selectedPaymentMethod !== "cod";

  useEffect(() => {
    if (!enabled) return;
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetchCustomerSavedCards(token);
        const rows = Array.isArray(res.getCustomerSavedCards)
          ? res.getCustomerSavedCards
          : [];
        // Prefer active cards in UI.
        const active = rows.filter((c) => c.isActive !== false);
        if (!cancelled) setCards(active);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : String(t("checkoutSavedCardsLoadFailed"));
        setError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, token]);

  const defaultCard = useMemo(() => {
    return cards.find((c) => c.isDefault) ?? null;
  }, [cards]);

  useEffect(() => {
    if (!enabled) return;
    if (!defaultCard) return;
    if (selectedSavedCardTokenId !== null) return; // user already chose

    // Auto-select default saved card (if user hasn't selected "new card").
    onSelectSavedCardTokenId?.(String(defaultCard.tokenId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, defaultCard]);

  if (!enabled) return null;

  // If there are no saved cards (and not loading), hide the entire section.
  if (!loading && cards.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 mb-6">
      <h2 className="font-sans font-medium text-[#000000] text-xl leading-5">
        {t("savedCards")}
      </h2>

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="font-sans text-sm text-black/60">{t("loadingSavedCards")}</div>
        ) : null}

        {error ? <div className="font-sans text-sm text-black/60">{error}</div> : null}

        {cards.map((c) => {
          const tokenId = c.tokenId ? String(c.tokenId) : "";
          if (!tokenId) return null;
          const isSelected = selectedSavedCardTokenId === tokenId;
          const expiry = formatExpiry(c);
          const iconType = normalizeSavedCardBrand(c.cardBrand);

          return (
            <button
              key={c.uuid}
              type="button"
              onClick={() => onSelectSavedCardTokenId?.(tokenId)}
              className={`box-border flex flex-row items-center w-full gap-[11px] py-2 px-6 rounded-[5px] border bg-white transition-colors ${
                isSelected ? "border-[#CB262E]" : "border-black/15"
              }`}
              style={{ height: 50 }}
            >
              <PaymentMethodIconByType type={iconType} />
              <span
                className="font-sans font-medium text-[#000000] flex-1 text-start"
                style={{ fontSize: 16, lineHeight: "24px" }}
              >
                {String(c.cardBrand ?? "")
                  .trim()
                  .toUpperCase() || "CARD"}{" "}
                •••• {c.last4 ?? "—"}
                {expiry ? ` (${expiry})` : ""}
              </span>
              {c.isDefault ? (
                <span
                  className="shrink-0 rounded px-2 py-0.5 font-sans font-semibold uppercase tracking-wide text-[#CB262E] bg-[#CB262E]/10"
                  style={{ fontSize: 10, lineHeight: "14px" }}
                >
                  {t("defaultAddressBadge")}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

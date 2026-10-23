"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import ConfirmDialog from "@/componentsedit/dialogs/ConfirmDialog";
import { fetchCustomerSavedCards, type GqlCustomerSavedCard } from "@/services/graphql";
import {
  setCustomerSavedCardAsDefault,
  deleteCustomerSavedCard,
  type UpdateSavedCardPayload,
} from "@/services/auth/customerSavedCards";
import { PaymentMethodIconByType } from "@/componentsedit/PaymentMethodIcons";

function formatExpiry(card: GqlCustomerSavedCard) {
  const mm = card.expiryMonth ?? "";
  const yy = card.expiryYear ?? "";
  if (!mm && !yy) return "";
  return `${mm}/${yy}`;
}

export default function SavedCardsPage() {
  const t = useTranslations();
  const [cards, setCards] = useState<GqlCustomerSavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GqlCustomerSavedCard | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      setCards([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchCustomerSavedCards(token);
      const rows = Array.isArray(res.getCustomerSavedCards)
        ? res.getCustomerSavedCards
        : [];
      setCards(rows.filter((r) => r !== null));
    } catch (e) {
      toast.error(t("checkoutSavedCardsLoadFailed") || "Failed to load saved cards");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<GqlCustomerSavedCard | null>(null);

  const onDelete = useCallback((c: GqlCustomerSavedCard) => {
    setToDelete(c);
    setConfirmOpen(true);
  }, []);

  const runDelete = useCallback(async () => {
    if (!toDelete) return;
    const token = Cookies.get("token");
    if (!token) return toast.error(t("pleaseLogin") || "Please login");
    try {
      await deleteCustomerSavedCard(String(toDelete.uuid), token);
      toast.success(t("delete") || "Deleted");
      setConfirmOpen(false);
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("somethingWentWrong"));
    }
  }, [load, t, toDelete]);

  const onSetDefault = useCallback(
    async (c: GqlCustomerSavedCard) => {
      const token = Cookies.get("token");
      if (!token) return toast.error(t("pleaseLogin") || "Please login");
      setSaving(true);
      try {
        const payload: UpdateSavedCardPayload = {
          uuid: String(c.uuid),
          tokenId: String(c.tokenId),
          cardBrand: c.cardBrand ?? null,
          last4: c.last4 ?? null,
          expiryMonth: c.expiryMonth ?? null,
          expiryYear: c.expiryYear ?? null,
          isDefault: true,
          isActive: c.isActive ?? true,
        };
        await setCustomerSavedCardAsDefault(String(c.uuid), payload, token);
        toast.success(t("saved") || "Saved");
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("somethingWentWrong"));
      } finally {
        setSaving(false);
      }
    },
    [load, t],
  );

  const onEdit = useCallback((c: GqlCustomerSavedCard) => {
    setEditing(c);
  }, []);

  const onSaveEdit = useCallback(async () => {
    if (!editing) return;
    const token = Cookies.get("token");
    if (!token) return toast.error(t("pleaseLogin") || "Please login");
    setSaving(true);
    try {
      const payload: UpdateSavedCardPayload = {
        uuid: String(editing.uuid),
        tokenId: String(editing.tokenId),
        cardBrand: editing.cardBrand ?? null,
        last4: editing.last4 ?? null,
        expiryMonth: editing.expiryMonth ?? null,
        expiryYear: editing.expiryYear ?? null,
        isDefault: editing.isDefault ?? false,
        isActive: editing.isActive ?? true,
      };
      await setCustomerSavedCardAsDefault(String(editing.uuid), payload, token);
      toast.success(t("updated") || "Updated");
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("somethingWentWrong"));
    } finally {
      setSaving(false);
    }
  }, [editing, load, t]);

  const surfaceClass =
    "flex-1 w-full bg-white shadow-[0px_1px_13px_rgba(0,0,0,0.05)] rounded-[4px] min-h-0 sm:min-h-[480px] lg:min-h-[978px] p-4 sm:p-6 md:p-8 lg:p-10";

  if (loading) {
    return (
      <section className={surfaceClass}>
        <div className="font-sans font-medium text-base leading-6 text-black mb-5 sm:mb-6">
          {t("savedCards")}
        </div>
        <div className="space-y-4 max-w-[710px]">
          <div className="h-36 rounded-[5px] bg-black/[0.06] animate-pulse" />
          <div className="h-36 rounded-[5px] bg-black/[0.06] animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className={surfaceClass}>
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="font-sans font-medium text-base leading-6 text-black">
          {t("savedCards")}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-6">
          <div className="rounded-full bg-black/[0.06] w-20 h-20 flex items-center justify-center">
            <svg
              width="28"
              height="20"
              viewBox="0 0 28 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1"
                y="4"
                width="26"
                height="12"
                rx="2"
                stroke="#000"
                strokeOpacity="0.2"
              />
              <rect
                x="3"
                y="7"
                width="8"
                height="2"
                rx="1"
                fill="#000"
                fillOpacity="0.2"
              />
            </svg>
          </div>
          <p className="font-sans text-sm leading-relaxed text-black/70 max-w-[710px] text-center">
            {t("noSavedCardsFound")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4 sm:gap-6 w-full max-w-[710px] list-none p-0 m-0">
          {cards.map((c) => (
            <li
              key={c.uuid}
              className="rounded-[5px] border border-black/15 p-4 flex items-center gap-4"
            >
              <div className="shrink-0">
                <PaymentMethodIconByType
                  type={
                    String(c.cardBrand ?? "visa")
                      .trim()
                      .toLowerCase() || "visa"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-sans font-medium text-sm text-black truncate">
                    {String(c.cardBrand ?? "CARD").toUpperCase()} ••••{" "}
                    {String(c.last4 ?? "—")}
                  </div>
                  {c.isDefault ? (
                    <span
                      className="shrink-0 rounded px-2 py-0.5 font-sans font-semibold uppercase tracking-wide text-[#CB262E] bg-[#CB262E]/10"
                      style={{ fontSize: 10, lineHeight: "14px" }}
                    >
                      {t("defaultAddressBadge")}
                    </span>
                  ) : null}
                </div>
                <div className="font-sans text-sm text-black/60">{formatExpiry(c)}</div>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                  {!c.isDefault ? (
                    <button
                      type="button"
                      onClick={() => onSetDefault(c)}
                      className="rounded px-3 py-2 text-sm font-semibold text-white w-full sm:w-auto"
                      style={{ background: "#CB262E" }}
                      disabled={saving}
                    >
                      {t("setAsDefault")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="rounded border border-black/20 px-3 py-2 text-sm font-semibold w-full sm:w-auto"
                    disabled={saving}
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    className="rounded border border-black/20 px-3 py-2 text-sm font-semibold text-[#CB262E] w-full sm:w-auto"
                    disabled={saving}
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="w-full max-w-[710px] rounded-[5px] border border-black/15 p-4 sm:p-5 mt-6">
          <div className="font-sans font-medium mb-3">{t("edit")}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-sans font-medium text-xs text-black/60">
                {t("expiryDate")}
              </span>
              <input
                value={editing.expiryMonth ?? ""}
                onChange={(e) => setEditing({ ...editing, expiryMonth: e.target.value })}
                placeholder="MM"
                className="rounded border border-black/15 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-sans font-medium text-xs text-black/60">&nbsp;</span>
              <input
                value={editing.expiryYear ?? ""}
                onChange={(e) => setEditing({ ...editing, expiryYear: e.target.value })}
                placeholder="YYYY"
                className="rounded border border-black/15 px-3 py-2"
              />
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={saving}
              className="rounded px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "#CB262E" }}
            >
              {saving ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              disabled={saving}
              className="rounded border border-black/20 px-4 py-2 text-sm font-semibold"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={t("delete")}
        description={
          t("confirmDeleteSavedCard") ||
          "Are you sure you want to delete this saved card?"
        }
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={runDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </section>
  );
}

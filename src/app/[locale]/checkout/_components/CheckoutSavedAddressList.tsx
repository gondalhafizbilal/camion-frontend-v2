"use client";

import { useMemo, useState } from "react";
import type { SavedShippingAddress } from "@/lib/checkout/savedAddressesFromUser";
import { formatShippingAddressSummary } from "@/lib/checkout/savedAddressesFromUser";

const labelMuted =
  "font-sans font-normal text-[#000000] text-base leading-6";

function addressLines(draft: SavedShippingAddress["draft"]): string[] {
  const name =
    draft.fullName?.trim() ||
    [draft.first_name, draft.last_name].filter(Boolean).join(" ").trim();
  const line1 = draft.streetAddress?.trim() || draft.address_1?.trim();
  const apt = draft.apartment?.trim() || draft.address_2?.trim();
  const cityLine = [draft.city, draft.state]
    .filter((x) => (x ?? "").trim() !== "")
    .join(", ");
  const zip = (draft.zipCode ?? draft.postcode)?.trim();
  const locality = [cityLine, zip].filter(Boolean).join(" ").trim();
  const country = draft.country?.trim();
  const phoneRaw = String(draft.phoneLocal ?? draft.phone ?? "").trim();
  const phone =
    draft.countryCode && phoneRaw
      ? `${draft.countryCode} ${phoneRaw}`
      : phoneRaw;

  const out: string[] = [];
  if (name) out.push(name);
  if (line1) out.push(line1);
  if (apt) out.push(apt);
  if (locality) out.push(locality);
  if (country) out.push(country);
  if (phone) out.push(phone);
  if (out.length === 0) return [formatShippingAddressSummary(draft).trim() || "—"];
  return out;
}

type CheckoutSavedAddressListProps = {
  options: SavedShippingAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSetDefault?: (id: string) => void;
  /** Opens address form modal (My Account–style edit). */
  onEdit?: (id: string) => void;
  editLabel?: string;
  defaultBadgeLabel: string;
  deliverToLabel: string;
  setAsDefaultLabel: string;
  settingDefaultId?: string | null;
};

export default function CheckoutSavedAddressList({
  options,
  selectedId,
  onSelect,
  onSetDefault,
  onEdit,
  editLabel = "Edit",
  defaultBadgeLabel,
  deliverToLabel,
  setAsDefaultLabel,
  settingDefaultId,
}: CheckoutSavedAddressListProps) {
  const selected = useMemo(() => {
    if (!options.length) return null;
    return (
      options.find((o) => o.id === selectedId) ??
      options.find((o) => o.isDefault) ??
      options[0]
    );
  }, [options, selectedId]);
  const selectedLines = selected ? addressLines(selected.draft) : [];
  const selectedBusy = selected ? settingDefaultId === selected.id : false;
  const [pickerOpen, setPickerOpen] = useState(false);

  if (options.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-3 w-full max-w-[550px]"
      role="radiogroup"
      aria-label={deliverToLabel}
    >
      <span className={labelMuted}>{deliverToLabel}</span>
      {options.length > 2 ? (
        <div className="flex flex-col gap-2">
          {selected ? (
            <div className="rounded-[5px] border border-black/15 bg-white p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-sans text-sm leading-snug sm:text-base text-[#000000] whitespace-pre-line break-words">
                    {selectedLines.join("\n")}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {selected.isDefault ? (
                      <span
                        className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ background: "#CB262E" }}
                      >
                        {defaultBadgeLabel}
                      </span>
                    ) : onSetDefault ? (
                      <button
                        type="button"
                        disabled={selectedBusy}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetDefault(selected.id);
                        }}
                        className="text-xs font-semibold text-black/70 hover:text-[#CB262E] disabled:opacity-50"
                      >
                        {selectedBusy ? "…" : setAsDefaultLabel}
                      </button>
                    ) : null}
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(selected.id);
                        }}
                        className="text-xs font-semibold text-[#CB262E] hover:opacity-80"
                      >
                        {editLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen((s) => !s)}
                  className="shrink-0 rounded border border-black/15 px-3 py-2 text-xs font-semibold text-black/80 hover:bg-black/[0.03]"
                >
                  {pickerOpen ? "Close" : "Change"}
                </button>
              </div>
            </div>
          ) : null}

          {pickerOpen ? (
            <ul className="flex flex-col gap-2 list-none p-0 m-0 max-h-[320px] overflow-auto pr-0.5">
              {options.map((opt) => {
                const isSelected = opt.id === selected?.id;
                const lines = addressLines(opt.draft);
                const busy = settingDefaultId === opt.id;
                return (
                  <li key={opt.id}>
                    <div
                      className={`rounded-[5px] border p-3 sm:p-4 transition-colors ${
                        isSelected
                          ? "border-[#CB262E] bg-[#FFF8F8] ring-1 ring-[#CB262E]/25"
                          : "border-black/15 bg-white hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className="flex flex-row gap-3 items-start">
                        <input
                          type="radio"
                          name="checkout-delivery-address"
                          id={`checkout-addr-${opt.id}`}
                          checked={isSelected}
                          onChange={() => {
                            onSelect(opt.id);
                            setPickerOpen(false);
                          }}
                          className="mt-1 h-4 w-4 shrink-0 accent-[#CB262E] cursor-pointer"
                        />
                        <div className="min-w-0 flex-1 flex flex-col gap-2">
                          <button
                            type="button"
                            id={`checkout-addr-label-${opt.id}`}
                            onClick={() => {
                              onSelect(opt.id);
                              setPickerOpen(false);
                            }}
                            className="text-start font-sans text-sm leading-snug sm:text-base text-[#000000] whitespace-pre-line break-words cursor-pointer"
                          >
                            {lines.join("\n")}
                          </button>
                          <div className="flex flex-wrap items-center gap-2">
                            {opt.isDefault ? (
                              <span
                                className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                                style={{ background: "#CB262E" }}
                              >
                                {defaultBadgeLabel}
                              </span>
                            ) : onSetDefault ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSetDefault(opt.id);
                                }}
                                className="text-xs font-semibold text-black/70 hover:text-[#CB262E] disabled:opacity-50"
                              >
                                {busy ? "…" : setAsDefaultLabel}
                              </button>
                            ) : null}
                            {onEdit ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(opt.id);
                                }}
                                className="ms-auto sm:ms-0 text-xs font-semibold text-[#CB262E] hover:opacity-80"
                              >
                                {editLabel}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {options.map((opt) => {
            const isSelected = opt.id === selectedId;
            const lines = addressLines(opt.draft);
            const busy = settingDefaultId === opt.id;
            return (
              <li key={opt.id}>
                <div
                  className={`rounded-[5px] border p-3 sm:p-4 transition-colors ${
                    isSelected
                      ? "border-[#CB262E] bg-[#FFF8F8] ring-1 ring-[#CB262E]/25"
                      : "border-black/15 bg-white hover:bg-black/[0.02]"
                  }`}
                >
                  <div className="flex flex-row gap-3 items-start">
                    <input
                      type="radio"
                      name="checkout-delivery-address"
                      id={`checkout-addr-${opt.id}`}
                      checked={isSelected}
                      onChange={() => onSelect(opt.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#CB262E] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <button
                        type="button"
                        id={`checkout-addr-label-${opt.id}`}
                        onClick={() => onSelect(opt.id)}
                        className="text-start font-sans text-sm leading-snug sm:text-base text-[#000000] whitespace-pre-line break-words cursor-pointer"
                      >
                        {lines.join("\n")}
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        {opt.isDefault ? (
                          <span
                            className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                            style={{ background: "#CB262E" }}
                          >
                            {defaultBadgeLabel}
                          </span>
                        ) : onSetDefault ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetDefault(opt.id);
                            }}
                            className="text-xs font-semibold text-black/70 hover:text-[#CB262E] disabled:opacity-50"
                          >
                            {busy ? "…" : setAsDefaultLabel}
                          </button>
                        ) : null}
                        {onEdit ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(opt.id);
                            }}
                            className="ms-auto sm:ms-0 text-xs font-semibold text-[#CB262E] hover:opacity-80"
                          >
                            {editLabel}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toast } from "@/componentsedit/toast";
import Cookies from "js-cookie";
import { createReturnRequest } from "@/services/returns/createReturnRequest";
import { uploadReturnRequestEvidence } from "@/services/returns/uploadReturnRequestEvidence";
import { trackRefundRequested } from "@/componentsedit/analytics/postPurchaseGtm";

function ShoppingBagIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M10.67 10.67V8.67C10.67 5.72 13.05 3.33 16 3.33C18.95 3.33 21.33 5.72 21.33 8.67V10.67"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.67 10.67H25.33L23.73 26.67H8.27L6.67 10.67Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeItemOptions(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it, idx) => {
      const uuid = String(it?.uuid ?? it?.id ?? "").trim();
      if (!uuid) return null;
      const title = String(it?.product?.title ?? it?.variant?.title ?? it?.title ?? it?.name ?? `Item ${idx + 1}`);
      return { uuid, title };
    })
    .filter(Boolean);
}

const SELECT_FIELD_STYLE = {
  boxSizing: "border-box",
  minHeight: 44,
  padding: "10px 12px",
  background: "#F6F6F6",
  border: "1px solid #F6F6F6",
  borderRadius: 12,
  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: 12,
  lineHeight: "24px",
  color: "#000000",
};

function truncateLabel(text, max = 80) {
  const s = String(text ?? "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function ReturnItemSelect({ value, onChange, options, allItemsLabel, disabled }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const entries = [
    { value: "", label: allItemsLabel },
    ...options.map((it) => ({ value: it.uuid, label: it.title })),
  ];
  const selected = entries.find((e) => e.value === value) ?? entries[0];

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-w-0 items-center justify-between gap-2 text-start outline-none disabled:cursor-not-allowed disabled:opacity-75"
        style={SELECT_FIELD_STYLE}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate" title={selected?.label}>
          {truncateLabel(selected?.label)}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto overflow-x-hidden rounded-xl border border-black/10 bg-[#F6F6F6] py-1 shadow-md"
        >
          {entries.map((entry) => {
            const isSelected = value === entry.value;
            return (
              <li key={entry.value || "__all__"} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full min-w-0 px-3 py-2.5 text-start text-xs font-medium leading-snug hover:bg-black/5 ${
                    isSelected ? "bg-[#CB262E]/10 text-black" : "text-black"
                  }`}
                  onClick={() => {
                    onChange(entry.value);
                    setOpen(false);
                  }}
                  title={entry.label}
                >
                  <span className="block break-words">{entry.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * @typedef {Object} ReturnRequestModalProps
 * @property {boolean} open
 * @property {() => void} onClose
 * @property {string=} orderUuid
 * @property {any[]=} orderItems
 */

export default function ReturnRequestModal({
  open,
  onClose,
  orderUuid = "",
  orderItems = /** @type {any[]} */ ([]),
}) {
  const t = useTranslations();
  const safeOrderUuid = String(orderUuid || "").trim();
  const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("wrong_variation");
  const [reasonDetail, setReasonDetail] = useState("");
  const [orderItemUuid, setOrderItemUuid] = useState("");
  const fileInputRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdUuid, setCreatedUuid] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setReason("wrong_variation");
      setReasonDetail("");
      setOrderItemUuid("");
      setSubmitting(false);
      setCreatedUuid("");
      setUploadingEvidence(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFilesChange = async (e) => {
    const list = e.target.files;
    if (!list?.length) return;
    const picked = Array.from(list);

    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("loginRequired") || "Please login to upload evidence.");
      return;
    }
    if (!createdUuid) {
      toast.warning(
        t("submitReturnFirst") || "Please submit the return request first.",
      );
      return;
    }

    setUploadingEvidence(true);
    try {
      let okCount = 0;
      for (const f of picked) {
        await uploadReturnRequestEvidence(token, createdUuid, f);
        okCount += 1;
      }
      toast.success(
        t("evidenceUploaded") ||
          `Evidence uploaded (${okCount}/${picked.length}).`,
      );
      onClose();
    } catch (err) {
      const status = err?.status;
      if (status === 400) {
        toast.error(
          t("evidenceUploadNotAllowed") ||
            "Evidence can only be uploaded while the request is pending.",
        );
      } else {
        toast.error(t("evidenceUploadFailed") || "Evidence upload failed.");
      }
    } finally {
      setUploadingEvidence(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("loginRequired") || "Please login to request a return.");
      return;
    }
    const orderId = safeOrderUuid;
    if (!orderId) {
      toast.error(t("missingOrderId") || "Missing order id.");
      return;
    }
    if (!String(reason || "").trim()) {
      toast.warning(t("returnReasonRequired"));
      return;
    }
    if (!String(reasonDetail || "").trim()) {
      toast.warning(t("returnReasonRequired") || "Please provide details for your return request.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReturnRequest(token, {
        orderUuid: orderId,
        orderItemUuid: String(orderItemUuid || "").trim() || undefined,
        reason,
        reasonDetail,
      });
      const newUuid = String(created?.uuid || "").trim();
      if (!newUuid) {
        toast.error(t("returnRequestFailed") || "Failed to submit return request.");
        return;
      }
      const selectedItem = safeOrderItems.find(
        (item) => String(item?.uuid ?? item?.id ?? "").trim() === String(orderItemUuid).trim(),
      );
      trackRefundRequested({
        orderId,
        returnRequestId: newUuid,
        productId: selectedItem?.product?.uuid,
      });
      setCreatedUuid(newUuid);
      setStep(2);
      toast.success(t("returnRequestSubmitted"));
    } catch (err) {
      const status = err?.status;
      if (status === 404) {
        toast.error(t("orderNotFound") || "Order not found.");
      } else if (status === 400) {
        const fieldErrors = err?.fieldErrors;
        const detailMsg =
          fieldErrors && typeof fieldErrors === "object"
            ? String(fieldErrors.reasonDetail || fieldErrors.reason || fieldErrors.orderUuid || "")
            : "";
        if (detailMsg) {
          toast.warning(detailMsg);
        } else {
          toast.error(
            t("returnRequestNotAllowed") ||
              "Return request not allowed for this order, or already exists.",
          );
        }
      } else {
        toast.error(t("returnRequestFailed") || "Failed to submit return request.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !open) return null;

  const itemOptions = normalizeItemOptions(safeOrderItems);

  const labelStyle = {
    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 16,
    lineHeight: "24px",
    textTransform: "capitalize",
  };

  const uploadButtonStyle = {
    boxSizing: "border-box",
    padding: "20px 34px",
    gap: 4,
    height: 50,
    border: "1px solid #CB262E",
    borderRadius: 5,
    background: "transparent",
    cursor: "pointer",
    ...labelStyle,
    color: "#CB262E",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.45)" }}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="relative w-full max-h-[calc(100vh-2rem)] overflow-x-hidden overflow-y-auto"
        style={{
          maxWidth: 870,
          minHeight: step === 2 ? 420 : 600,
          background: "#FFFFFF",
          boxShadow: "0px 1px 13px rgba(0, 0, 0, 0.05)",
          borderRadius: 4,
          boxSizing: "border-box",
          paddingLeft: "clamp(20px, 5vw, 80px)",
          paddingRight: "clamp(20px, 5vw, 80px)",
          paddingBottom: 40,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 end-3 z-10 flex h-9 w-9 items-center justify-center rounded-md text-2xl leading-none text-gray-600 hover:bg-gray-100"
          aria-label={t("close") || "Close"}
        >
          ×
        </button>

        <div className="flex justify-center" style={{ paddingTop: 50 }}>
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 50, height: 50, background: "#CB262E" }}
          >
            <ShoppingBagIcon />
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-3 mx-auto text-center"
          style={{ width: 711, maxWidth: "100%", marginTop: 16 }}
        >
          <div className="flex flex-col items-center gap-2" style={{ maxWidth: 420 }}>
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 16,
                lineHeight: "24px",
                color: "#000000",
              }}
            >
              {t("returnRefundRequestTitle")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: step === 2 ? 12 : 10,
                lineHeight: step === 2 ? "20px" : "18px",
                color: "#000000",
              }}
            >
              {step === 1 ? t("returnRefundRequestSubtitle") : t("returnEvidenceMandatoryNotice")}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-center px-2" style={{ maxWidth: 657, marginLeft: "auto", marginRight: "auto" }}>
          <Link
            href="/myaccount/privacy-policies#return-refund"
            className="text-center underline"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 12,
              lineHeight: "18px",
              color: "#CB262E",
            }}
          >
            {t("viewRefundReturnPolicy")}
          </Link>
        </div>

        {step === 1 ? (
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex min-w-0 flex-col gap-4"
            style={{ width: 665, maxWidth: "100%", marginTop: 16 }}
          >
            <div className="flex flex-col gap-2">
              <label style={labelStyle}>{t("returnReasonLabel") || "Reason"}</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full outline-none"
                style={{
                  boxSizing: "border-box",
                  height: 44,
                  padding: "10px 12px",
                  background: "#F6F6F6",
                  border: "1px solid #F6F6F6",
                  borderRadius: 12,
                  fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  lineHeight: "24px",
                  color: "#000000",
                }}
                disabled={submitting}
              >
                <option value="wrong_variation">{t("returnReasonWrongVariation") || "Wrong Variation"}</option>
                <option value="damaged_broken">{t("returnReasonDamagedBroken") || "Damaged / Broken"}</option>
                <option value="wrong_product">{t("returnReasonWrongProduct") || "Wrong Product"}</option>
              </select>
            </div>

            {itemOptions.length > 0 && (
              <div className="flex min-w-0 flex-col gap-2">
                <label style={labelStyle}>
                  {t("returnItemLabel") || "Item (optional)"}
                </label>
                <ReturnItemSelect
                  value={orderItemUuid}
                  onChange={setOrderItemUuid}
                  options={itemOptions}
                  allItemsLabel={t("returnAllItems") || "All items (order-level)"}
                  disabled={submitting}
                />
              </div>
            )}

            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder={t("returnReasonPlaceholder") || "Tell us what happened..."}
              className="w-full resize-none outline-none placeholder:text-[#908C91]"
              style={{
                boxSizing: "border-box",
                height: 168,
                padding: "12px 16px",
                background: "#F6F6F6",
                border: "1px solid #F6F6F6",
                borderRadius: 12,
                fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "24px",
                color: "#000000",
              }}
              disabled={submitting}
            />

            <button
              type="submit"
              className="flex flex-row justify-center items-center w-full hover:opacity-90"
              style={{
                boxSizing: "border-box",
                padding: "20px 34px",
                gap: 4,
                height: 50,
                background: "#CB262E",
                border: "1px solid #CB262E",
                borderRadius: 5,
                cursor: "pointer",
                ...labelStyle,
                color: "#FFFFFF",
                opacity: submitting ? 0.75 : 1,
              }}
              disabled={submitting}
            >
              {submitting ? t("submitting") || "Submitting..." : t("submitRequest")}
            </button>
          </form>
        ) : (
          <div
            className="flex flex-col gap-5 mx-auto items-stretch"
            style={{ width: 665, maxWidth: "100%", marginTop: 24 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFilesChange}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-row justify-center items-center w-full hover:opacity-90"
              style={uploadButtonStyle}
              disabled={uploadingEvidence || !createdUuid}
            >
              {uploadingEvidence ? t("submitting") || "Uploading..." : t("uploadEvidenceRequired")}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

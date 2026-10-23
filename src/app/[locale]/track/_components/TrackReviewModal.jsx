"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { toast } from "@/componentsedit/toast";
import { createProductReview } from "@/services/reviews/createProductReview";
import { uploadProductReviewImage } from "@/services/reviews/uploadProductReviewImage";
import { trackReviewSubmitted } from "@/componentsedit/analytics/postPurchaseGtm";

function ShoppingBagIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
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

const STAR_PATH =
  "M6.83551 1.69606C7.57028 -0.565342 10.7696 -0.565344 11.5043 1.69605L11.9866 3.18017C12.3152 4.1915 13.2576 4.87622 14.321 4.87622H15.8815C18.2592 4.87622 19.2479 7.91891 17.3242 9.31653L16.0617 10.2338C15.2015 10.8588 14.8415 11.9667 15.1701 12.978L15.6523 14.4621C16.3871 16.7235 13.7988 18.604 11.8751 17.2064L10.6127 16.2892C9.75238 15.6641 8.58746 15.6641 7.72718 16.2892L6.46471 17.2064C4.54105 18.604 1.95278 16.7235 2.68755 14.4621L3.16977 12.978C3.49837 11.9667 3.13839 10.8588 2.27811 10.2338L1.01565 9.31654C-0.908016 7.91891 0.0806146 4.87622 2.45839 4.87622H4.01888C5.08225 4.87622 6.02469 4.1915 6.35329 3.18017L6.83551 1.69606Z";

function StarCell({ index, rating, onPick }) {
  const filled = rating >= index;
  const half = !filled && rating >= index - 0.5 && rating < index;
  const clipId = `track-review-star-clip-${index}`;

  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      style={{
        width: 30,
        height: 30,
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={`Rate ${index} out of 5`}
    >
      <svg
        width="30"
        height="28.421"
        viewBox="0 0 19 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {half ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width="9.5" height="18" />
              </clipPath>
            </defs>
            <path d={STAR_PATH} fill="#F0F0F0" />
            <path d={STAR_PATH} fill="#F7C95F" clipPath={`url(#${clipId})`} />
          </>
        ) : (
          <path d={STAR_PATH} fill={filled ? "#F7C95F" : "#F0F0F0"} />
        )}
      </svg>
    </button>
  );
}

export default function TrackReviewModal({ open, onClose, productUuid = "" }) {
  const t = useTranslations();
  const safeProductUuid = String(productUuid || "").trim();
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdReviewUuid, setCreatedReviewUuid] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setRating(3);
      setFeedback("");
      setFiles([]);
      setSubmitting(false);
      setCreatedReviewUuid("");
      setUploadingImages(false);
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

  const handleFilesChange = (e) => {
    const list = e.target.files;
    if (!list?.length) return;
    setFiles(Array.from(list));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("loginRequired") || "Please login to add a review.");
      return;
    }
    if (!safeProductUuid) {
      toast.error(t("missingProductId") || "Missing product id.");
      return;
    }
    if (!feedback.trim()) {
      toast.warning(t("reviewFeedbackRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createProductReview(token, {
        productUuid: safeProductUuid,
        rating,
        comment: feedback.trim(),
      });
      const reviewUuid = String(created?.uuid ?? "").trim();
      if (!reviewUuid) throw new Error("Invalid review response");
      trackReviewSubmitted(safeProductUuid, rating);
      setCreatedReviewUuid(reviewUuid);
      toast.success(t("reviewSubmittedSuccess") || t("reviewSubmitted"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || t("somethingWentWrong") || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImages = async () => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error(t("loginRequired") || "Please login to upload images.");
      return;
    }
    if (!safeProductUuid || !createdReviewUuid) {
      toast.error(t("somethingWentWrong") || "Something went wrong");
      return;
    }
    if (!files.length) {
      toast.warning(t("addPhotosVideo") || "Please add photos/video first.");
      return;
    }

    setUploadingImages(true);
    try {
      let okCount = 0;
      for (const file of files) {
        await uploadProductReviewImage(token, safeProductUuid, createdReviewUuid, file);
        okCount += 1;
      }
      toast.success(
        t("reviewImagesUploaded") ||
          `Review image uploaded (${okCount}/${files.length}).`,
      );
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || t("somethingWentWrong") || "Something went wrong");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSkipImages = () => {
    toast.success(t("reviewSubmittedSuccess") || t("reviewSubmitted"));
    onClose();
  };

  if (!mounted || !open) return null;

  const labelStyle = {
    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 16,
    lineHeight: "24px",
    textTransform: "capitalize",
  };

  const displayRating = rating === Math.floor(rating) ? `${rating}` : rating.toFixed(1);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.45)" }}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full overflow-y-auto max-h-[calc(100vh-2rem)]"
        style={{
          maxWidth: 870,
          minHeight: 600,
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
          aria-label={t("close")}
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
          <div className="flex flex-col items-center gap-2" style={{ maxWidth: 394 }}>
            <span
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 16,
                lineHeight: "24px",
                color: "#000000",
              }}
            >
              {t("trackReviewModalTitle")}
            </span>
            <span
              style={{
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 10,
                lineHeight: "18px",
                color: "#000000",
              }}
            >
              {t("trackReviewModalSubtitle")}
            </span>
          </div>
        </div>

        <div className="flex justify-center w-full mt-3.5">
          <div className="flex flex-row items-center" style={{ gap: 8.77 }}>
            <span
              style={{
                width: 28,
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 20,
                lineHeight: "26px",
                textTransform: "capitalize",
                color: "#000000",
              }}
            >
              {displayRating}
            </span>
            <div
              className="flex flex-row items-center flex-shrink-0"
              style={{ width: 150, height: 30 }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <StarCell key={i} index={i} rating={rating} onPick={setRating} />
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex flex-col gap-4 mx-auto"
          style={{ width: 665, maxWidth: "100%", marginTop: 16 }}
        >
          {!createdReviewUuid ? (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t("trackReviewFeedbackPlaceholder")}
              className="w-full resize-none outline-none placeholder:text-[#908C91]"
              style={{
                boxSizing: "border-box",
                height: 168,
                padding: "12px 16px",
                background: "#F6F6F6",
                border: "1px solid #F6F6F6",
                borderRadius: 12,
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "24px",
                color: "#000000",
              }}
            />
          ) : (
            <div
              className="w-full text-center"
              style={{
                padding: "18px 16px",
                background: "#F6F6F6",
                borderRadius: 12,
                fontFamily:
                  "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 13,
                lineHeight: "22px",
                color: "#000000",
              }}
            >
              {t("reviewSubmittedSuccess") ||
                "Review submitted successfully. You can upload photos/video or skip."}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFilesChange}
            aria-hidden
          />

          {createdReviewUuid ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-row justify-center items-center w-full hover:opacity-90"
              style={{
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
              }}
            >
              {t("addPhotosVideo")}
              {files.length > 0 ? ` (${files.length})` : ""}
            </button>
          ) : null}

          {!createdReviewUuid ? (
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-row justify-center items-center w-full hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                boxSizing: "border-box",
                padding: "20px 34px",
                gap: 4,
                height: 50,
                background: "#CB262E",
                border: "1px solid #CB262E",
                borderRadius: 5,
                cursor: submitting ? "not-allowed" : "pointer",
                ...labelStyle,
                color: "#FFFFFF",
              }}
            >
              {submitting
                ? t("submitting") || "Submitting..."
                : t("submitFeedback")}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={uploadingImages || files.length === 0}
                onClick={handleUploadImages}
                className="flex flex-row justify-center items-center w-full hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  boxSizing: "border-box",
                  padding: "20px 34px",
                  gap: 4,
                  height: 50,
                  background: "#CB262E",
                  border: "1px solid #CB262E",
                  borderRadius: 5,
                  cursor:
                    uploadingImages || files.length === 0 ? "not-allowed" : "pointer",
                  ...labelStyle,
                  color: "#FFFFFF",
                }}
              >
                {uploadingImages
                  ? t("uploading") || "Uploading..."
                  : t("upload") || "Upload"}
              </button>
              <button
                type="button"
                disabled={uploadingImages}
                onClick={handleSkipImages}
                className="flex flex-row justify-center items-center w-full hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  boxSizing: "border-box",
                  padding: "20px 34px",
                  gap: 4,
                  height: 50,
                  background: "transparent",
                  border: "1px solid #CB262E",
                  borderRadius: 5,
                  cursor: uploadingImages ? "not-allowed" : "pointer",
                  ...labelStyle,
                  color: "#CB262E",
                }}
              >
                {t("skip") || "Skip"}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>,
    document.body,
  );
}

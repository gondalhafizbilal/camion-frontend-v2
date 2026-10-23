"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { StarIcon } from "@/componentsedit/home/ProductCarouselSection";
import type { ProductReviewListRow } from "@/services/graphql/mappers/gqlProductToProductDetails";
import {
  ReviewImagesLightbox,
  type ReviewImageItem,
} from "./ReviewImagesCarousel";
import { pushGtmEvent } from "@/componentsedit/analytics/gtmDataLayer";

const Star = ({ filled, size = 20 }: { filled: boolean; size?: number }) => (
  <StarIcon filled={filled} size={size} />
);

const RatingBar = ({
  star,
  count,
  total,
  starLabel,
}: {
  star: number;
  count: number;
  total: number;
  starLabel: string;
}) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-2">
      <div className="flex flex-row items-center gap-1 flex-shrink-0">
        <span className="font-sans font-medium text-[#0B0F0E]" style={{ fontSize: 14, lineHeight: "160%" }}>
          {star} {starLabel}
        </span>
        <Star filled size={20} />
      </div>
      <div className="flex-1 min-w-[120px] h-2 rounded-full bg-[#E4E9EE] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#CB262E]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-sans text-[#0B0F0E] w-9 text-end" style={{ fontSize: 14, lineHeight: "160%" }}>
        {count}
      </span>
    </div>
  );
};

type ReviewRow = ProductReviewListRow;

export default function ProductReviewsSection({
  initialReviewRows = [],
  productId,
  variantId,
  category,
}: {
  /** From `getProduct.reviews` (GraphQL). */
  initialReviewRows?: ProductReviewListRow[] | null;
  productId?: string | number;
  variantId?: string | number | null;
  category?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [reviews, setReviews] = useState<ReviewRow[]>(
    () => initialReviewRows ?? [],
  );
  const [lightbox, setLightbox] = useState<{
    images: ReviewImageItem[];
    index: number;
  } | null>(null);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);
  const perPage = 5;

  useEffect(() => {
    setReviews(initialReviewRows ?? []);
  }, [initialReviewRows]);

  useEffect(() => {
    const section = sectionRef.current;
    if (
      !section ||
      viewedRef.current ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || viewedRef.current) return;
        viewedRef.current = true;
        pushGtmEvent("view_reviews", {
          product_id: productId,
          variant_id: variantId || undefined,
          category,
          source: "pdp_reviews_section",
        });
        observer.disconnect();
      },
      { rootMargin: "-25% 0px -25% 0px", threshold: 0 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [productId, variantId, category]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => Number(r.rating) === star).length,
    }));
  }, [reviews]);

  const filteredAndSorted = useMemo(() => {
    let list = [...reviews];
    if (ratingFilter !== "all") {
      list = list.filter((r) => Number(r.rating) === Number(ratingFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          String(r.review || r.content || "").toLowerCase().includes(q) ||
          String(r.reviewer || "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "high-low") list.sort((a, b) => Number(b.rating) - Number(a.rating));
    else if (sortBy === "low-high") list.sort((a, b) => Number(a.rating) - Number(b.rating));
    else
      list.sort(
        (a, b) =>
          new Date(b.date_created || b.created_at || 0).getTime() -
          new Date(a.date_created || a.created_at || 0).getTime(),
      );
    return list;
  }, [reviews, ratingFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSorted.slice(start, start + perPage);
  }, [filteredAndSorted, currentPage, perPage]);

  const formatDate = (d: string | undefined) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString(locale || "en", { year: "numeric", month: "short", day: "numeric" });
  };

  const initials = (str: string | undefined) =>
    String(str || "").trim().slice(0, 1).toUpperCase();

  return (
    <section
      ref={sectionRef}
      className="mt-12 w-full min-w-0 md:mt-16 lg:mt-20"
    >
      <div className="mb-6 flex flex-row flex-wrap items-center gap-2">
        <div
          className="shrink-0 rounded"
          style={{ width: 20, height: 40, background: "#CB262E", borderRadius: 4 }}
        />
        <h2 className="font-sans text-lg font-semibold leading-tight text-black sm:text-xl sm:leading-5">
          {t("productReviewsHeading")}
        </h2>
      </div>

      <div
        className="box-border flex w-full min-w-0 flex-col flex-wrap gap-6 rounded-lg border border-dashed border-[#B8B8B8] p-4 sm:p-6 md:flex-row md:gap-8"
        style={{ borderWidth: "0.8px", minHeight: 206 }}
      >
        <div className="flex flex-row items-center gap-4">
          <div
            className="flex-shrink-0 relative rounded-full overflow-hidden"
            style={{ width: 84, height: 84 }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: "#E4E9EE" }}
              aria-hidden
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#CB262E 0deg, #CB262E ${(averageRating / 5) * 360}deg, transparent ${(averageRating / 5) * 360}deg)`,
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 flex items-center justify-center font-sans font-semibold text-[#0B0F0E]"
              style={{ fontSize: 18, lineHeight: "140%" }}
            >
              {averageRating > 0 ? averageRating.toFixed(1) : "0"}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} filled={averageRating >= i} size={20} />
              ))}
            </div>
            <span className="font-sans text-[#525252]" style={{ fontSize: 12, lineHeight: "160%" }}>
              {reviews.length} {reviews.length === 1 ? t("review") : t("reviews")}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {[5, 4, 3, 2, 1].map((star) => {
            const row = ratingCounts.find((r) => r.star === star);
            return (
              <RatingBar
                key={star}
                star={star}
                count={row?.count ?? 0}
                total={reviews.length}
                starLabel={t("star")}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-6 mb-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchReviews") || "Search"}
          className="min-w-0 w-full flex-1 rounded border border-[#E6E6E6] bg-white px-4 py-2.5 font-sans text-xs leading-[160%] text-[#141414] outline-none sm:min-w-[160px]"
        />
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="w-full rounded border border-[#E6E6E6] bg-white px-4 py-2.5 font-sans text-xs leading-[160%] text-[#141414] outline-none sm:w-[150px] sm:flex-shrink-0"
        >
          <option value="all">{t("allRatings")}</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{s} {t("star")}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded border border-[#E6E6E6] bg-white px-4 py-2.5 font-sans text-xs leading-[160%] text-[#141414] outline-none sm:w-[135px] sm:flex-shrink-0"
        >
          <option value="recent">{t("mostRecent")}</option>
          <option value="high-low">{t("highestRating")}</option>
          <option value="low-high">{t("lowestRating")}</option>
        </select>
      </div>

      <div className="flex w-full flex-col gap-0">
        {loading ? (
          <div className="py-8 font-sans text-[#818B9C] text-sm">{t("loadingReviews")}</div>
        ) : paginatedReviews.length === 0 ? (
          <div className="py-8 font-sans text-[#818B9C] text-sm">{t("noReviewsYet")}</div>
        ) : (
          paginatedReviews.map((review, idx) => (
            <div key={review.id || idx} className="w-full">
              <div className="flex w-full flex-col gap-4 py-6 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex min-w-0 w-full flex-1 flex-col gap-4">
                  <div className="flex flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} filled={(review.rating || 0) >= i} size={20} />
                    ))}
                  </div>
                  <div className="flex w-full flex-col gap-1">
                    <p className="w-full font-sans text-[#141414]" style={{ fontSize: 14, lineHeight: "140%", letterSpacing: "-0.2px" }}>
                      {review.review || review.content || "—"}
                    </p>
                    <span className="font-sans text-[#818B9C]" style={{ fontSize: 10, lineHeight: "160%" }}>
                      {formatDate(review.date_created || review.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-3">
                    <div
                      className="flex-shrink-0 rounded-full bg-[#C4C4C4] flex items-center justify-center font-sans font-medium text-[#0B0F0E]"
                      style={{ width: 32, height: 32, fontSize: 12 }}
                    >
                      {initials(review.reviewer || review.reviewer_email)}
                    </div>
                    <span className="font-sans font-medium text-[#0B0F0E]" style={{ fontSize: 12, lineHeight: "160%" }}>
                      {review.reviewer || review.reviewer_email || t("anonymous")}
                    </span>
                  </div>
                </div>
                {Array.isArray(review.images) && review.images.length > 0 && (
                  <div className="flex w-full min-w-0 shrink-0 flex-row flex-wrap gap-2 sm:w-auto sm:justify-end">
                    {review.images.slice(0, 6).map((im, imageIndex) => {
                      const thumb = im.thumbnail || im.src;
                      return (
                        <button
                          key={`${im.src}-${imageIndex}`}
                          type="button"
                          onClick={() =>
                            setLightbox({
                              images: review.images!.slice(0, 6),
                              index: imageIndex,
                            })
                          }
                          className="h-14 w-14 overflow-hidden rounded border border-[#E6E6E6] bg-white"
                          aria-label={t("openImage")}
                        >
                          <img
                            src={thumb}
                            alt={im.alt || ""}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {idx < paginatedReviews.length - 1 && (
                <div className="w-full border-t border-dashed border-[#A3A3A3]" style={{ borderTopWidth: "0.5px" }} />
              )}
            </div>
          ))
        )}
      </div>

      {lightbox && (
        <ReviewImagesLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="flex items-center justify-center w-11 h-11 rounded-lg font-sans font-medium disabled:opacity-50"
            style={{ background: "#CB262E", color: "#FFFFFF", fontSize: 14 }}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 6).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className="flex items-center justify-center w-11 h-11 rounded-lg font-sans font-medium border border-[#CB262E]"
              style={{
                background: p === currentPage ? "#CB262E" : "transparent",
                color: p === currentPage ? "#FFFFFF" : "#000000",
                fontSize: 14,
              }}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center justify-center w-11 h-11 rounded-lg font-sans font-medium border border-[#CB262E] disabled:opacity-50"
            style={{ fontSize: 14, color: "#000000" }}
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}

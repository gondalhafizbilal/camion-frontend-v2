"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ReviewImagesLightbox, type ReviewImageItem } from "./ReviewImagesCarousel";
import type { ProductGalleryImage } from "@/types/checkoutDisplay";

const stripHtml = (html: string) => {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

type DetailCard = { title: string; text: string };

function looksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function stripBrokenImgTags(html: string): string {
  const s = String(html ?? "");
  if (!s) return "";

  // API HTML sometimes contains image tags with invalid/blocked sources, which render as broken icons.
  // For PDP we strip ALL images to keep the details clean and consistent.
  const noImgs = s
    // remove <picture>...</picture> blocks entirely
    .replace(/<picture\b[\s\S]*?<\/picture>/gi, "")
    // remove <img ...> tags
    .replace(/<img\b[^>]*>/gi, "")
    // remove <source ...> tags (often inside <picture>)
    .replace(/<source\b[^>]*>/gi, "");

  // Remove empty blocks and whitespace-only HTML that can leave big gaps.
  return noImgs
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(p|div|span)\b[^>]*>\s*<\/\1>/gi, "")
    .replace(/<(p|div|span)\b[^>]*>\s*(?:\s|\n|<br\s*\/?>)*\s*<\/\1>/gi, "")
    .trim();
}

export default function ProductDetailsSection({
  description = "",
  cards = [],
  attachments = [],
}: {
  description?: string;
  cards?: DetailCard[];
  attachments?: ProductGalleryImage[];
}) {
  const t = useTranslations();
  const [lightbox, setLightbox] = useState<{
    images: ReviewImageItem[];
    index: number;
  } | null>(null);
  const trimmed = String(description ?? "").trim();
  const list = Array.isArray(cards) ? cards : [];
  const renderHtml = Boolean(trimmed) && looksLikeHtml(trimmed);
  const safeHtml = renderHtml ? stripBrokenImgTags(trimmed) : "";
  const descriptionText = !renderHtml ? stripHtml(trimmed) : "";
  const htmlAsText = renderHtml ? stripHtml(safeHtml) : "";
  const hasDescription = renderHtml ? Boolean(htmlAsText) : Boolean(descriptionText);
  const hasCards = list.length > 0;

  // Only render what we actually received from the API (description and/or detail cards).
  if (!hasDescription && !hasCards) return null;

  return (
    <section className="mt-12 w-full min-w-0 md:mt-16 lg:mt-20">
      <div className="mb-5 flex flex-row flex-wrap items-center gap-2 md:mb-6">
        <div
          className="flex-shrink-0 rounded"
          style={{
            width: 20,
            height: 40,
            background: "#CB262E",
            borderRadius: 4,
          }}
        />
        <h2 className="font-sans text-lg font-semibold leading-tight text-black md:text-xl md:leading-5 lg:text-xl">
          {t("productDetailsHeading")}
        </h2>
      </div>
      {hasDescription && renderHtml ? (
        <div
          className="product-details-html mb-6 w-full max-w-full overflow-x-auto font-sans text-sm font-normal leading-relaxed text-black md:mb-8 md:text-base md:leading-[21px] [&_img]:h-auto [&_img]:max-w-full [&_table]:max-w-full"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : hasDescription ? (
        <p className="mb-6 w-full max-w-full font-sans text-sm font-normal leading-relaxed text-black md:mb-8 md:text-base md:leading-[21px]">
          {descriptionText}
        </p>
      ) : null}
      {Array.isArray(attachments) && attachments.length > 0 ? (
        <div className="mb-6 w-full">
          <div className="mb-2 font-sans text-sm font-medium text-black">
            {t("attachments")}
          </div>
          <div className="flex w-full min-w-0 flex-row flex-wrap gap-2">
            {attachments.slice(0, 12).map((att, i) => {
              const thumb = att.thumbnail || att.src;
              return (
                <button
                  key={`${String(att.src)}-${i}`}
                  type="button"
                  onClick={() =>
                    setLightbox({
                      images: (attachments || [])
                        .slice(0, 12)
                        .map(
                          (a) =>
                            ({
                              src: String(a?.src || ""),
                              thumbnail: String(a?.thumbnail || a?.src || ""),
                              alt: a?.alt,
                            }) as ReviewImageItem,
                        ),
                      index: i,
                    })
                  }
                  className="h-14 w-14 overflow-hidden rounded border border-[#E6E6E6] bg-white"
                  aria-label={t("openAttachment")}
                >
                  <img
                    src={thumb}
                    alt={att.alt || ""}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {hasCards ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {list.slice(0, 8).map((card, i) => (
            <div
              key={i}
              className="box-border flex w-full max-w-full flex-col items-start rounded border border-[#CB262E] bg-white py-2.5 pl-3 pr-3 lg:pr-12"
              style={{
                minHeight: 85,
              }}
            >
              <span
                className="font-sans font-semibold text-[#000000]"
                style={{ fontSize: 12, lineHeight: "24px" }}
              >
                {card.title}
              </span>
              <span
                className="font-sans text-[#000000]"
                style={{ fontSize: 10, lineHeight: "140%" }}
              >
                {card.text}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {lightbox && (
        <ReviewImagesLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}

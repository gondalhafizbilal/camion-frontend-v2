"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "@/componentsedit/StaticImage";
import { useLocale, useTranslations } from "next-intl";
import StoryViewerModal, {
  type StoryRecord,
} from "./story/StoryViewerModal";
import {
  HOME_BANNER_SECTION_X_PADDING_CLASS,
  HOME_CONTENT_INNER_CLASS,
} from "@/componentsedit/home/homeSectionLayout";

function normalizeUrlForExt(url: string): string {
  // strip query/hash so `.mp4?token=...` still matches
  return String(url || "").split("#")[0]?.split("?")[0] ?? "";
}

function proxyMediaUrl(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "";
  if (!/^https:\/\//i.test(u)) return u;
  return `/api/media-proxy?url=${encodeURIComponent(u)}`;
}

function getStoryMedia(story: StoryRecord | undefined): string {
  if (!story) return "";
  const fr = story.frames;
  if (fr?.length) {
    const f = fr[0];
    // Prefer the actual media URL; fall back to thumbnail when mediaUrl is missing.
    // (We intentionally do NOT trust `mediaType` yet.)
    const u = f?.mediaUrl ?? f?.thumbnailUrl;
    if (u) return String(u);
  }
  return String(story.mediaUrl ?? story.imageUrl ?? story.url ?? "");
}

export default function Stories({
  initialStories = [],
}: {
  /** GraphQL `getStories` (no client-side fallback). */
  initialStories?: StoryRecord[];
}) {
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [showMoreIndicator, setShowMoreIndicator] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const storyRowRef = useRef<HTMLDivElement | null>(null);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations();

  const STORY_LIST = useMemo(() => {
    return [...initialStories].sort((a, b) => {
      const ah = Boolean(a.isHighlighted);
      const bh = Boolean(b.isHighlighted);
      if (ah !== bh) return ah ? -1 : 1;
      return 0;
    });
  }, [initialStories]);

  const isVideo = (url: string) => {
    if (!url) return false;
    const clean = normalizeUrlForExt(url).toLowerCase();
    const videoExtensions = [
      ".mp4",
      ".m4v",
      ".mov",
      ".avi",
      ".webm",
      ".mkv",
      ".m3u8",
    ];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    if (imageExtensions.some((ext) => clean.endsWith(ext))) return false;
    return videoExtensions.some((ext) => clean.endsWith(ext));
  };

  useEffect(() => {
    const viewport = scrollRef.current;
    const row = storyRowRef.current;
    if (!viewport || !row) return;

    const updateIndicator = () => {
      const lastStory = row.lastElementChild;
      if (!lastStory) {
        setShowMoreIndicator(false);
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const lastStoryRect = lastStory.getBoundingClientRect();
      const hasOverflow = row.scrollWidth > viewport.clientWidth + 1;
      const hasHiddenStories = isRTL
        ? lastStoryRect.left < viewportRect.left - 2
        : lastStoryRect.right > viewportRect.right + 2;

      setShowMoreIndicator(hasOverflow && hasHiddenStories);
    };

    updateIndicator();
    viewport.addEventListener("scroll", updateIndicator, { passive: true });
    window.addEventListener("resize", updateIndicator);

    return () => {
      viewport.removeEventListener("scroll", updateIndicator);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [STORY_LIST.length, isRTL]);

  const scrollStories = useCallback(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;

    viewport.scrollBy({
      left: isRTL
        ? -Math.round(viewport.clientWidth * 0.75)
        : Math.round(viewport.clientWidth * 0.75),
      behavior: "smooth",
    });
  }, [isRTL]);

  if (STORY_LIST.length === 0) return null;

  return (
    <>
      <section
        className={`flex w-full justify-center flex-col ${HOME_BANNER_SECTION_X_PADDING_CLASS}`}
        style={{ marginTop: 23 }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div
          className={`flex flex-col justify-center ${HOME_CONTENT_INNER_CLASS} min-h-[96px] md:min-h-[106px] lg:min-h-[116px] gap-2 lg:gap-[10px]`}
        >
          <div className="relative w-full">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto items-center scrollbar-hide w-full gap-3 md:gap-4 lg:gap-[21.6px] [-webkit-overflow-scrolling:touch] ps-0 pe-0 md:ps-3.5 md:pe-1.5 lg:ps-4 lg:pe-2 py-2.5 md:py-3 lg:py-3.5"
            >
              <div
                ref={storyRowRef}
                className="flex gap-3 md:gap-4 lg:gap-[21.6px] flex-shrink-0 items-center"
              >
                {STORY_LIST.map((story, index) => (
                  <button
                    key={story.id ?? index}
                    type="button"
                    className={`flex-shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C2262C] rounded-full w-[72px] h-[72px] md:w-[80px] md:h-[80px] lg:w-[90px] lg:h-[90px] ${
                      story.isHighlighted
                        ? "ring-[3px] ring-[#C2262C] ring-offset-2 ring-offset-white shadow-[0_0_14px_rgba(194,38,44,0.45)]"
                        : ""
                    }`}
                    onClick={() => setActiveStory(index)}
                  >
                    <span
                      className={`block w-full h-full rounded-full box-border ${
                        story.isHighlighted
                          ? "p-[3px] md:p-[3.4px] lg:p-[3.75px]"
                          : "p-[2.5px] md:p-[2.85px] lg:p-[3.16px]"
                      }`}
                      style={{
                        background: story.isHighlighted
                          ? "linear-gradient(135deg, #ff8a65 0%, #C2262C 45%, #e53935 100%)"
                          : "linear-gradient(0deg, rgba(0,0,0,0.2), #C2262C)",
                      }}
                    >
                      <span
                        className="relative block w-full h-full rounded-full overflow-hidden box-border bg-white"
                        style={{
                          border: story.isHighlighted
                            ? "1.2px solid rgba(194, 38, 44, 0.35)"
                            : "0.79px solid rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {isVideo(
                          getStoryMedia(story),
                        ) ? (
                          <video
                            src={proxyMediaUrl(getStoryMedia(story))}
                            muted
                            autoPlay
                            loop
                            playsInline
                            controls={false}
                            disablePictureInPicture
                            className="w-full h-full object-cover rounded-full pointer-events-none"
                          />
                        ) : (
                          <Image
                            src={getStoryMedia(story)}
                            alt={(story.title as string) || `story-${index}`}
                            fill
                            sizes="(max-width: 768px) 72px, (max-width: 1024px) 80px, 90px"
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        )}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {showMoreIndicator ? (
              <button
                type="button"
                onClick={scrollStories}
                className={[
                  "absolute top-1/2 z-10 flex h-16 w-12 -translate-y-1/2 cursor-pointer items-center justify-center border-0 p-0",
                  isRTL
                    ? "left-0 bg-gradient-to-r from-white via-white/80 to-transparent"
                    : "right-0 bg-gradient-to-l from-white via-white/80 to-transparent",
                ].join(" ")}
                aria-label={isRTL ? "Scroll stories left" : "Scroll stories right"}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={[
                    "h-7 w-7 rounded-full bg-white/80 p-1 text-[#C2262C] opacity-80 shadow-sm",
                    isRTL ? "rotate-180" : "",
                  ].join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <StoryViewerModal
        open={activeStory !== null && Boolean(STORY_LIST[activeStory])}
        stories={STORY_LIST}
        activeIndex={activeStory ?? 0}
        onActiveChange={setActiveStory}
        onClose={() => setActiveStory(null)}
        isRTL={isRTL}
        isVideo={isVideo}
        getMediaUrl={getStoryMedia}
        getAvatarUrl={(s) =>
          String(s.avatarUrl ?? s.brandLogo ?? s.logoUrl ?? "")
        }
        getDisplayName={(s) =>
          String(s.title ?? s.name ?? t("camionStore"))
        }
      />
    </>
  );
}

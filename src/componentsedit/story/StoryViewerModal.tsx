"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type RefObject,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { LazyMotion, m, AnimatePresence } from "framer-motion";
import Image from "@/componentsedit/StaticImage";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const loadFeatures = () =>
  import("framer-motion").then((res) => res.domAnimation);

/** One slide inside a story (from GraphQL `frames`). */
export type StorySlideRecord = {
  uuid?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  /** e.g. `image` | `video` from API */
  mediaType?: string;
  /** Display duration for still images, in seconds (API `duration`). */
  durationSec?: number;
};

export type StoryRecord = {
  id?: string;
  mediaUrl?: string;
  imageUrl?: string;
  url?: string;
  title?: string;
  name?: string;
  avatarUrl?: string;
  brandLogo?: string;
  logoUrl?: string;
  /** When true, story appears first in the ring and uses a stronger border treatment. */
  isHighlighted?: boolean;
  /** Ordered slides; when set, viewer advances frame-by-frame before the next story. */
  frames?: StorySlideRecord[];
  [key: string]: unknown;
};

const HEADER_GRADIENT =
  "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 42.5%, rgba(0, 0, 0, 0) 100%)";

function getVisibleSlots(
  activeIndex: number,
  total: number,
): { offset: number; index: number }[] {
  if (total <= 0) return [];
  return [-2, -1, 0, 1, 2]
    .map((offset) => ({ offset, index: activeIndex + offset }))
    .filter(({ index }) => index >= 0 && index < total);
}

function normalizeUrlForExt(url: string): string {
  return String(url || "").split("#")[0]?.split("?")[0] ?? "";
}

function proxyMediaUrl(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "";
  if (!/^https:\/\//i.test(u)) return u;
  return `/api/media-proxy?url=${encodeURIComponent(u)}`;
}

function VerticalMoreIcon({
  className = "",
  small,
}: {
  className?: string;
  small?: boolean;
}) {
  const dot = small ? 2.83 : 3.33;
  const gap = small ? 4.08 : 4.99;
  return (
    <span
      className={`inline-flex flex-col items-center justify-center ${className ?? ""}`}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full bg-white shrink-0"
          style={{
            width: dot,
            height: dot,
            marginTop: i > 0 ? gap : 0,
          }}
        />
      ))}
    </span>
  );
}

function StoryProgressBar({
  progress,
  wide,
  isActive,
}: {
  progress: number;
  wide: boolean;
  isActive: boolean;
}) {
  const pct = isActive ? Math.min(100, Math.max(0, progress * 100)) : 0;
  const barW = wide ? 345.46 : 293.56;
  const borderW = wide ? 1.66406 : 1.41406;
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-full"
      style={{
        top: wide ? 8.65 : 7.35,
        width: barW,
        maxWidth: "calc(100% - 14px)",
        height: borderW * 2,
      }}
    >
      <div
        className="absolute inset-0 rounded-full border-white"
        style={{
          opacity: 0.4,
          borderWidth: `${borderW}px`,
          borderStyle: "solid",
        }}
      />
      <div
        className="absolute left-0 top-0 h-full rounded-full border-white bg-white/90"
        style={{
          width: `${pct}%`,
          borderWidth: `${borderW}px`,
          borderStyle: "solid",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function StoryAvatar({
  url,
  title,
  sizePx,
}: {
  url?: string;
  title?: string;
  sizePx: number;
}) {
  if (url) {
    return (
      <span
        className="rounded-full overflow-hidden shrink-0 bg-[#222] block relative"
        style={{ width: sizePx, height: sizePx }}
      >
        <Image src={url} alt="" fill className="object-cover" unoptimized />
      </span>
    );
  }
  const initial = (title || "C").slice(0, 1).toUpperCase();
  return (
    <span
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: sizePx,
        height: sizePx,
        fontSize: sizePx * 0.4,
        background: "#B32329",
      }}
    >
      {initial}
    </span>
  );
}

function StoryRailCard({
  mediaUrl,
  isVideo,
  isCenter,
  isActiveStory,
  progress01,
  displayName,
  avatarUrl,
  isRTL,
  onSelect,
  onMediaClick,
  videoRef,
  showCta,
  ctaLabel,
  onShopNavigate,
}: {
  mediaUrl: string;
  isVideo: boolean;
  isCenter: boolean;
  isActiveStory: boolean;
  progress01: number;
  displayName: string;
  avatarUrl?: string;
  isRTL: boolean;
  onSelect?: () => void;
  onMediaClick?: (e: MouseEvent<HTMLDivElement>) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  showCta: boolean;
  ctaLabel: string;
  onShopNavigate?: () => void;
}) {
  const wide = isCenter;
  const headerH = wide ? 96.18 : 81.73;
  const avatarSize = wide ? 31.95 : 27.15;
  const padX = wide ? 12 : 10.18;
  const topPad = wide ? 18.64 : 15.84;
  const nameSize = wide ? 13.9781 : 11.8781;
  const nameLineH = wide ? 16 : 14;
  const moreOffset = wide ? 22.96 : 19.51;

  return (
    <div
      className="relative shrink-0 flex flex-col items-stretch rounded-[10px] bg-black cursor-pointer transition-transform duration-300 hover:opacity-[0.98]"
      style={{
        width: isCenter
          ? "min(90vw, calc(min(85vh, 639px) * (359.44 / 639)))"
          : "min(22vw, calc(min(85vh, 639px) * (543 / 639) * (305.44 / 543)))",
        height: isCenter
          ? "min(85vh, 639px)"
          : "calc(min(85vh, 639px) * (543 / 639))",
        maxHeight: "85vh",
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div
        className="relative flex-1 rounded-[10px] overflow-hidden bg-[#222222]"
        style={{ minHeight: 0 }}
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick?.(e);
        }}
      >
        {mediaUrl && isVideo ? (
          <video
            key={isCenter ? "center-story-video" : undefined}
            ref={isCenter ? videoRef : undefined}
            src={proxyMediaUrl(mediaUrl)}
            className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
            /** Center: imperative `play()` in parent so audio survives swipe (autoplay after gesture stack ends is often muted). */
            autoPlay={!isCenter}
            playsInline
            /** Side rails stay muted so only the active story plays audio. */
            muted={!isCenter}
            controls={false}
            disablePictureInPicture
            loop={!isCenter}
            preload="metadata"
          />
        ) : null}

        <StoryProgressBar
          progress={progress01}
          wide={wide}
          isActive={isActiveStory}
        />

        <div
          className="absolute left-0 right-0 top-0 z-[2] pointer-events-none"
          style={{
            height: headerH,
            background: HEADER_GRADIENT,
          }}
        />

        <div
          className="absolute z-[3] flex flex-row items-start gap-[9.32px] text-white"
          style={{
            left: padX,
            top: topPad,
            right: wide ? 44 : 38,
          }}
        >
          <StoryAvatar
            url={avatarUrl}
            title={displayName}
            sizePx={avatarSize}
          />
          <span
            className="font-bold text-white truncate pt-[5px]"
            style={{
              fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
              fontSize: nameSize,
              lineHeight: `${nameLineH}px`,
              maxWidth: isCenter ? 220 : 180,
            }}
          >
            {displayName}
          </span>
        </div>

        <button
          type="button"
          className="absolute z-[4] p-2 text-white opacity-90 hover:opacity-100 pointer-events-auto"
          style={{
            ...(isRTL ? { left: moreOffset - 8 } : { right: moreOffset - 8 }),
            top: moreOffset - 10,
          }}
          aria-label="More"
          onClick={(e) => e.stopPropagation()}
        >
          <VerticalMoreIcon small={!wide} />
        </button>

        {mediaUrl && !isVideo ? (
          <div
            className="absolute inset-x-0 flex items-center justify-center"
            style={{
              left: 0,
              right: "0.56%",
              top: "15.05%",
              bottom: "15.05%",
            }}
          >
            <Image
              src={mediaUrl}
              alt=""
              fill
              className="object-contain"
              unoptimized
              sizes={isCenter ? "360px" : "300px"}
            />
          </div>
        ) : null}

        {showCta && isCenter && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-[5] pointer-events-auto"
            style={{ bottom: "clamp(12px, 3vh, 24px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShopNavigate?.();
              }}
              className="flex flex-row justify-center items-center rounded bg-[#CB262E] text-[#FAFAFA] hover:opacity-95 transition-opacity font-sans font-medium px-12 py-2 min-h-10 cursor-pointer border-0 w-full"
              style={{ fontSize: 16, lineHeight: "24px", minWidth: 200 }}
            >
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type StoryViewerModalProps = {
  open: boolean;
  stories: StoryRecord[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onClose: () => void;
  isRTL: boolean;
  isVideo: (url: string, mediaType?: string) => boolean;
  getMediaUrl: (story: StoryRecord) => string;
  getAvatarUrl?: (story: StoryRecord) => string;
  getDisplayName: (story: StoryRecord) => string;
};

export default function StoryViewerModal({
  open,
  stories,
  activeIndex,
  onActiveChange,
  onClose,
  isRTL,
  isVideo,
  getMediaUrl,
  getAvatarUrl,
  getDisplayName,
}: StoryViewerModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** After the user opens the viewer, keep center video unmuted across auto-advances. */
  const audioUnlockedRef = useRef(false);
  const [progress01, setProgress01] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const story = stories[activeIndex];

  const slidesForStory = useCallback((s: StoryRecord | undefined) => {
    const fr = s?.frames;
    if (!fr?.length) return null;
    return fr.filter((x) => (x.mediaUrl || x.thumbnailUrl)?.trim());
  }, []);

  const mediaUrlFor = useCallback(
    (s: StoryRecord, storyIdx: number): string => {
      const slides = slidesForStory(s);
      if (slides?.length) {
        const i =
          storyIdx === activeIndex
            ? Math.min(frameIndex, slides.length - 1)
            : 0;
        const f = slides[i];
        // Prefer mediaUrl, fall back to thumbnailUrl. Do not rely on `mediaType` yet.
        return String(f?.mediaUrl ?? f?.thumbnailUrl ?? "");
      }
      return getMediaUrl(s);
    },
    [activeIndex, frameIndex, getMediaUrl, slidesForStory],
  );

  const currentSlideMeta = useCallback((): StorySlideRecord | null => {
    const slides = slidesForStory(story);
    if (!slides?.length) return null;
    const i = Math.min(frameIndex, slides.length - 1);
    return slides[i] ?? null;
  }, [story, frameIndex, slidesForStory]);

  const mediaUrl = story ? mediaUrlFor(story, activeIndex) : "";
  const slideMeta = currentSlideMeta();
  const cleanMediaUrl = normalizeUrlForExt(mediaUrl).toLowerCase();
  const isMediaUrlImage = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].some(
    (ext) => cleanMediaUrl.endsWith(ext),
  );
  const treatAsVideo =
    Boolean(mediaUrl) &&
    !isMediaUrlImage &&
    isVideo(mediaUrl);
  const playbackUrl = treatAsVideo
    ? proxyMediaUrl(mediaUrl)
    : mediaUrl;
  const imageDurationMs = Math.max(
    1000,
    Math.round((Number(slideMeta?.durationSec) || 5) * 1000),
  );

  const goNext = useCallback(() => {
    const s = stories[activeIndex];
    const slides = slidesForStory(s);
    if (slides?.length && frameIndex < slides.length - 1) {
      setFrameIndex((i) => i + 1);
      return;
    }
    setFrameIndex(0);
    if (activeIndex >= stories.length - 1) onClose();
    else onActiveChange(activeIndex + 1);
  }, [
    activeIndex,
    frameIndex,
    onActiveChange,
    onClose,
    stories,
    slidesForStory,
  ]);

  const goPrev = useCallback(() => {
    if (frameIndex > 0) {
      setFrameIndex((i) => i - 1);
      return;
    }
    setFrameIndex(0);
    onActiveChange(activeIndex === 0 ? stories.length - 1 : activeIndex - 1);
  }, [activeIndex, frameIndex, onActiveChange, stories.length]);

  useEffect(() => {
    if (open) audioUnlockedRef.current = true;
    else audioUnlockedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setProgress01(0);
  }, [open, activeIndex, frameIndex]);

  useEffect(() => {
    if (!open) return;
    setFrameIndex(0);
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open || !story || !mediaUrl) return;
    if (treatAsVideo) return;

    const duration = imageDurationMs;
    const start = Date.now();
    let rafId = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress01(Math.min(1, elapsed / duration));
      if (elapsed < duration) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    const timer = setTimeout(() => {
      goNext();
    }, duration);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [
    open,
    activeIndex,
    frameIndex,
    story,
    mediaUrl,
    slideMeta?.mediaType,
    imageDurationMs,
    isVideo,
    goNext,
    treatAsVideo,
  ]);

  const playCenterVideo = useCallback((preferUnmuted: boolean) => {
    const v = videoRef.current;
    if (!v) return;
    const wantSound = preferUnmuted && audioUnlockedRef.current;
    v.muted = !wantSound;
    void v.play().then(() => {
      if (wantSound && !v.muted) audioUnlockedRef.current = true;
    }).catch(() => {
      if (!wantSound) {
        void v.play().catch(() => {});
        return;
      }
      v.muted = true;
      void v.play().then(() => {
        if (audioUnlockedRef.current) {
          v.muted = false;
          void v.play().catch(() => {});
        }
      }).catch(() => {});
    });
  }, []);

  /** Re-try unmuted play soon after a touch swipe (still inside some browsers’ gesture window). */
  const tryPlayCenterUnmutedSoon = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => playCenterVideo(true));
    });
  }, [playCenterVideo]);

  useLayoutEffect(() => {
    if (!open || !story || !treatAsVideo) return;
    const v = videoRef.current;
    if (!v) return;

    v.currentTime = 0;
    setProgress01(0);

    const onTime = () => {
      if (v.duration && Number.isFinite(v.duration)) {
        setProgress01(v.currentTime / v.duration);
      }
    };
    const onEnded = () => goNext();

    const tryPlayUnmuted = () => playCenterVideo(true);

    tryPlayUnmuted();
    /** After `src` updates, first `play()` can run before data is ready; second try picks up audio. */
    const onCanPlay = () => tryPlayUnmuted();
    const onLoadedData = () => tryPlayUnmuted();
    v.addEventListener("canplay", onCanPlay, { once: true });
    v.addEventListener("loadeddata", onLoadedData, { once: true });

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("loadeddata", onLoadedData);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [
    open,
    activeIndex,
    frameIndex,
    story,
    playbackUrl,
    slideMeta?.mediaType,
    isVideo,
    goNext,
    treatAsVideo,
    playCenterVideo,
  ]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        (isRTL ? goNext : goPrev)();
        tryPlayCenterUnmutedSoon();
      }
      if (e.key === "ArrowRight") {
        (isRTL ? goPrev : goNext)();
        tryPlayCenterUnmutedSoon();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isRTL, goNext, goPrev, onClose, tryPlayCenterUnmutedSoon]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    let navigated = false;
    if (isRTL) {
      if (distance > minSwipe) {
        goPrev();
        navigated = true;
      } else if (distance < -minSwipe) {
        goNext();
        navigated = true;
      }
    } else {
      if (distance > minSwipe) {
        goNext();
        navigated = true;
      } else if (distance < -minSwipe) {
        goPrev();
        navigated = true;
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    if (navigated) tryPlayCenterUnmutedSoon();
  };

  if (!open || !story || !Array.isArray(stories) || stories.length === 0)
    return null;

  const slots = getVisibleSlots(activeIndex, stories.length);

  const handleShopNavigate = () => {
    onClose();
    router.push("/shop");
  };

  const modalTree = (
    <LazyMotion features={loadFeatures} strict>
      <AnimatePresence>
        <m.div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <m.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <m.div
            className={`relative z-[1] flex flex-row items-center justify-center gap-2 md:gap-4 px-2 md:px-4 w-full max-w-[100vw] overflow-x-auto overflow-y-hidden scrollbar-hide ${isRTL ? "flex-row-reverse" : ""}`}
            style={{ maxHeight: "100vh" }}
            dir={isRTL ? "rtl" : "ltr"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 z-[10] bg-black/45 hover:bg-black/65 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all backdrop-blur-md md:top-6"
              style={isRTL ? { left: 16 } : { right: 16 }}
              aria-label={t("close")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {slots.map(({ offset, index }) => {
              const s = stories[index];
              const url = mediaUrlFor(s, index);
              const slotMeta =
                index === activeIndex
                  ? slideMeta
                  : s.frames?.filter((x) => (x.mediaUrl || x.thumbnailUrl)?.trim())?.[0];
              const isCenter = offset === 0;
              return (
                <div
                  key={isCenter ? "story-center-slot" : `${index}-${offset}-${url}`}
                  className={`shrink-0 transition-all duration-300 ${isCenter ? "scale-100 z-[2]" : "scale-95 opacity-90 z-[1] hidden sm:block"}`}
                >
                  <StoryRailCard
                    mediaUrl={index === activeIndex ? playbackUrl : url}
                    isVideo={isVideo(url, slotMeta?.mediaType)}
                    isCenter={isCenter}
                    isActiveStory={index === activeIndex}
                    progress01={index === activeIndex ? progress01 : 0}
                    displayName={getDisplayName(s)}
                    avatarUrl={getAvatarUrl?.(s)}
                    isRTL={isRTL}
                    onSelect={() => onActiveChange(index)}
                    onMediaClick={(e: MouseEvent<HTMLDivElement>) => {
                      if (!isCenter) {
                        onActiveChange(index);
                        tryPlayCenterUnmutedSoon();
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        if (x < rect.width / 3) {
                          (isRTL ? goNext : goPrev)();
                          tryPlayCenterUnmutedSoon();
                        } else if (x > (rect.width * 2) / 3) {
                          (isRTL ? goPrev : goNext)();
                          tryPlayCenterUnmutedSoon();
                        }
                      }
                    }}
                    videoRef={videoRef}
                    showCta={isCenter}
                    ctaLabel={t("shopNow")}
                    onShopNavigate={handleShopNavigate}
                  />
                </div>
              );
            })}
          </m.div>
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );

  return createPortal(modalTree, document.body);
}

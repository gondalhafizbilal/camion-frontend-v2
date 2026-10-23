"use client";

import "swiper/css";
import Image from "@/componentsedit/StaticImage";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useLocale } from "next-intl";
import type { ProductGalleryImage } from "@/types/checkoutDisplay";
import { ImageWithSkeleton } from "./ImageWithSkeleton";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export default function ProductGallery({
  images = [],
  t,
  swiperRef,
  currentIndex,
  setCurrentIndex,
  tempImage,
  setTempImage,
}: {
  images?: ProductGalleryImage[];
  t?: TranslateFn;
  swiperRef?: MutableRefObject<SwiperType | null>;
  currentIndex: number;
  setCurrentIndex?: (index: number) => void;
  tempImage: string | null;
  setTempImage?: (url: string | null) => void;
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  // desktop hover-zoom only
  const [isDesktop, setIsDesktop] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 }); // percent
  const mainAreaRef = useRef<HTMLDivElement | null>(null);

  // arrow disabled states (production UX)
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // ✅ desktop detection (no SSR issues) + proper media listener
  useEffect(() => {
    const mql = window.matchMedia("(hover:hover)");
    const update = () => setIsDesktop(!!mql.matches);

    update();

    // Safari fallback
    if (mql.addEventListener) mql.addEventListener("change", update);
    else mql.addListener(update);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", update);
      else mql.removeListener(update);
    };
  }, []);

  // Slides (keep tempImage logic: variation image comes first)
  const mainSlides = useMemo(() => {
    const real = (Array.isArray(images) ? images : [])
      .filter((img): img is ProductGalleryImage & { src: string } =>
        Boolean(img?.src),
      )
      .map((img, i) => ({
        key: `img-${i}`,
        src: img.src,
        alt: img.alt || `Image ${i + 1}`,
        isTemp: false,
        thumb: img.thumbnail || img.src,
      }));

    if (tempImage) {
      return [
        {
          key: "temp",
          src: tempImage,
          alt: t?.("selectedVariationAlt") || "",
          isTemp: true,
          thumb: tempImage,
        },
        ...real,
      ];
    }

    return real;
  }, [images, tempImage, t]);

  const totalSlides = mainSlides.length;

  // ✅ "real images" count (without temp)
  const realCount = useMemo(() => {
    if (!Array.isArray(images)) return 0;
    return images.filter((img) => img?.src).length;
  }, [images]);

  // ✅ active thumbnail index:
  // - when tempImage is selected (index 0), no thumbnail should be active
  const activeRealIndex = useMemo(() => {
    if (tempImage && currentIndex === 0) return -1;
    if (tempImage) return Math.max(0, currentIndex - 1);
    return Math.max(0, currentIndex);
  }, [currentIndex, tempImage]);

  // ✅ counter text:
  // - show "Selected" when temp slide is active
  // - otherwise show 1/6 based on real images
  const counterText = useMemo(() => {
    if (tempImage && currentIndex === 0) {
      return t?.("selectedVariation");
    }

    if (realCount > 0) {
      const idx = Math.min(activeRealIndex + 1, realCount);
      return `${idx}/${realCount}`;
    }

    // fallback if images missing
    return `${Math.min(currentIndex + 1, totalSlides || 1)}/${Math.max(
      totalSlides,
      1,
    )}`;
  }, [tempImage, currentIndex, t, realCount, activeRealIndex, totalSlides]);

  // ✅ keep currentIndex always valid when slides change (production safety)
  useEffect(() => {
    if (!Number.isFinite(currentIndex)) return;

    const maxIdx = Math.max(0, totalSlides - 1);
    const clamped = Math.max(0, Math.min(maxIdx, currentIndex));

    if (clamped !== currentIndex) {
      setCurrentIndex?.(clamped);
      swiperRef?.current?.slideTo?.(clamped);
    }
  }, [totalSlides, currentIndex, setCurrentIndex, swiperRef]);

  const syncEdges = useCallback(() => {
    const sw = swiperRef?.current;
    if (!sw) return;
    setAtStart(!!sw.isBeginning);
    setAtEnd(!!sw.isEnd);
  }, [swiperRef]);

  const onSwiperInit = useCallback(
    (swiper: SwiperType) => {
      if (swiperRef && swiperRef.current !== swiper) swiperRef.current = swiper;
      // initial edge sync
      setAtStart(!!swiper.isBeginning);
      setAtEnd(!!swiper.isEnd);
    },
    [swiperRef],
  );

  const onSlideChange = useCallback(
    (swiper: SwiperType) => {
      setCurrentIndex?.(swiper.activeIndex);
      setAtStart(!!swiper.isBeginning);
      setAtEnd(!!swiper.isEnd);

      // ✅ if user swipes away from temp image, auto-exit temp mode
      // (prevents "shifted index" confusion in production)
      if (tempImage && swiper.activeIndex !== 0) {
        setTempImage?.(null);
      }
    },
    [setCurrentIndex, tempImage, setTempImage],
  );

  const goPrev = useCallback(() => {
    if (atStart) return;
    swiperRef?.current?.slidePrev?.();
  }, [swiperRef, atStart]);

  const goNext = useCallback(() => {
    if (atEnd) return;
    swiperRef?.current?.slideNext?.();
  }, [swiperRef, atEnd]);

  const onThumbClick = useCallback(
    (index: number) => {
      // If tempImage exists, real slides start at 1
      const slideIndex = tempImage ? index + 1 : index;

      // exit temp mode and go to the selected slide
      setTempImage?.(null);
      setCurrentIndex?.(slideIndex);

      // if temp existed, slideIndex points to the correct position in current swiper
      swiperRef?.current?.slideTo?.(slideIndex);
      syncEdges();
    },
    [tempImage, setTempImage, setCurrentIndex, swiperRef, syncEdges],
  );

  // hover zoom handlers (desktop only)
  const onMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!isDesktop || !mainAreaRef.current) return;

      const rect = mainAreaRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setZoomPos({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    },
    [isDesktop],
  );

  const onMouseEnter = useCallback(() => {
    if (!isDesktop) return;
    setZoomActive(true);
  }, [isDesktop]);

  const onMouseLeave = useCallback(() => {
    setZoomActive(false);
  }, []);

  const currentSrc = mainSlides?.[currentIndex]?.src;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* MAIN AREA */}
      <div
        ref={mainAreaRef}
        className="relative group"
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Swiper
          dir={isRtl ? "rtl" : "ltr"}
          key={isRtl ? "rtl" : "ltr"}
          onSwiper={onSwiperInit}
          onSlideChange={onSlideChange}
          spaceBetween={12}
          slidesPerView={1}
          className="h-[340px] md:h-[520px]"
        >
          {mainSlides.map((s) => (
            <SwiperSlide key={s.key}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={s.src}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full"
                >
                  <div className="w-full h-full">
                    <ImageWithSkeleton src={s.src} alt={s.alt} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ✅ Counter / Selected badge */}
        <div className="absolute top-3 start-3 z-10 bg-white/90 backdrop-blur border rounded-lg px-2.5 py-1 text-xs text-gray-700">
          {counterText}
        </div>

        {/* ✅ Zoom hint (desktop only) */}
        {isDesktop ? (
          <div className="absolute bottom-3 end-3 z-10 bg-white/90 backdrop-blur border rounded-lg px-3 py-1 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition">
            {t?.("hoverToZoom") || "Hover to zoom"}
          </div>
        ) : null}

        {/* ✅ Desktop hover-zoom lens */}
        {isDesktop && zoomActive && currentSrc ? (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${currentSrc})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "180%",
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                opacity: 1,
              }}
            />
            <div className="absolute inset-0 bg-white/0" />
          </div>
        ) : null}

        {/* ✅ Arrows (disabled state) */}
        <button
          type="button"
          onClick={goPrev}
          disabled={atStart}
          aria-label={t?.("previousImage") || "Previous image"}
          className={`
            absolute start-3 top-1/2 -translate-y-1/2 z-20
            h-10 w-10 rounded-full border bg-white/95 shadow-sm
            flex items-center justify-center
            hover:bg-white transition
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            ${atStart ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <span className="text-lg leading-none inline-flex rtl:rotate-180">‹</span>
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={atEnd}
          aria-label={t?.("nextImage") || "Next image"}
          className={`
            absolute end-3 top-1/2 -translate-y-1/2 z-20
            h-10 w-10 rounded-full border bg-white/95 shadow-sm
            flex items-center justify-center
            hover:bg-white transition
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            ${atEnd ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <span className="text-lg leading-none inline-flex rtl:rotate-180">›</span>
        </button>
      </div>

      {/* THUMBNAILS */}
      {Array.isArray(images) && images.filter((i) => i?.src).length > 1 ? (
        <div className="p-4 border-t">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images
              .filter((img): img is ProductGalleryImage & { src: string } =>
                Boolean(img?.src),
              )
              .map((img, i) => {
                const isActive = activeRealIndex === i;
                const thumbSrc = img.thumbnail || img.src;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onThumbClick(i)}
                    className={`relative flex-shrink-0 rounded-lg border transition ${
                      isActive
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={
                      t?.("thumbnailAlt", { index: i + 1 }) ||
                      `Thumbnail ${i + 1}`
                    }
                  >
                    <Image
                      unoptimized
                      src={thumbSrc}
                      width={78}
                      height={78}
                      alt={img?.alt || `thumb-${i}`}
                      className="rounded-lg object-cover"
                    />
                    {isActive ? (
                      <span className="absolute inset-0 rounded-lg ring-2 ring-black/40 pointer-events-none" />
                    ) : null}
                  </button>
                );
              })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

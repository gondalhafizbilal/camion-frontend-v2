"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Cookies from "js-cookie";
import { fetchPromos } from "@/services/graphql";
import { cacheRead, cacheWrite, runWhenIdle } from "@/lib/storageTtlCache";

const PROMO_CACHE_VERSION = 3;
const PROMO_CACHE_TTL_MS = 30 * 60 * 1000;
const PROMO_CACHE_KEY = "camion_top_promo_v1";
const PROMO_FETCH_PAGE_SIZE = 50;
const ROTATION_MS = 2000;
const SLIDE_MS = 500;

const TRACK_TRANSITION =
  "transition-transform duration-500 ease-in-out motion-reduce:transition-none";

const ROW_CLASS =
  "h-[42px] md:h-12 shrink-0 flex items-center justify-center w-full";

type PromoItem = {
  id: string;
  promoText: string;
  ctaText: string | null;
  ctaLink: string | null;
};

type CachedPromo = {
  promos: PromoItem[];
};

let inflightFetch: Promise<PromoItem[] | null> | null = null;

function decodeHtml(html: unknown): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/\$amp/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .trim();
}

function mapGqlPromoToItem(promo: {
  uuid?: string | null;
  name?: string | null;
  text?: string | null;
  callToActionText?: string | null;
  callToActionLink?: string | null;
}): PromoItem | null {
  const promoText = promo.text ? decodeHtml(promo.text) : "";
  if (!promoText) return null;

  return {
    id: promo.uuid || promo.name || promoText.slice(0, 32),
    promoText,
    ctaText: promo.callToActionText
      ? decodeHtml(promo.callToActionText)
      : null,
    ctaLink: promo.callToActionLink ? String(promo.callToActionLink) : null,
  };
}

async function loadPromos(): Promise<PromoItem[] | null> {
  if (typeof window !== "undefined") {
    const cached = cacheRead<CachedPromo>(window.sessionStorage, PROMO_CACHE_KEY, {
      version: PROMO_CACHE_VERSION,
    });
    if (cached.value?.promos?.length && !cached.expired) {
      return cached.value.promos;
    }
  }

  if (inflightFetch) return inflightFetch;

  inflightFetch = (async () => {
    try {
      const token = Cookies.get("token") ?? null;
      const data = await fetchPromos(
        { pageNumber: 1, itemsPerPage: PROMO_FETCH_PAGE_SIZE },
        token,
      );
      const items = (data?.getPromos ?? [])
        .map(mapGqlPromoToItem)
        .filter((item): item is PromoItem => item !== null);

      if (!items.length) return null;

      if (typeof window !== "undefined") {
        cacheWrite<CachedPromo>(
          window.sessionStorage,
          PROMO_CACHE_KEY,
          { promos: items },
          { version: PROMO_CACHE_VERSION, ttlMs: PROMO_CACHE_TTL_MS },
        );
      }

      return items;
    } catch (e: unknown) {
      const name = e instanceof Error ? e.name : "";
      if (name !== "AbortError") console.warn("Promo fetch failed:", e);
      return null;
    } finally {
      inflightFetch = null;
    }
  })();

  return inflightFetch;
}

function isSlideTransformProperty(propertyName: string): boolean {
  return (
    propertyName === "transform" ||
    propertyName === "translate" ||
    propertyName === "-webkit-transform"
  );
}

const PromoCtaLink = memo(function PromoCtaLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const isExternal = /^https?:\/\//i.test(href);
  const className =
    "font-semibold underline underline-offset-2 hover:opacity-90 transition-opacity whitespace-nowrap";

  if (isExternal) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
});

const PromoMessage = memo(function PromoMessage({
  promo,
  fallbackCtaLabel,
}: {
  promo: PromoItem;
  fallbackCtaLabel: string;
}) {
  const linkText = promo.ctaText || fallbackCtaLabel;
  const linkHref = promo.ctaLink || "/shop";

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 px-4 text-center font-sans text-[12px] leading-[18px] md:text-[14px] md:leading-[21px]">
      <span className="line-clamp-2 md:line-clamp-1 min-w-0">
        {promo.promoText}
      </span>
      <PromoCtaLink href={linkHref} label={linkText} />
    </div>
  );
});

export default function TopPromoBar() {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const rotationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const promoCountRef = useRef(0);
  const canRotateRef = useRef(false);
  const scheduleDisplayRef = useRef<() => void>(() => {});
  const slideDoneRef = useRef(true);

  const t = useTranslations();

  const fallbackCtaLabel = t("shopNow") || "ShopNow";
  const canRotate = promos.length > 1 && !prefersReducedMotion;

  const safeIndex = activeIndex >= promos.length ? 0 : activeIndex;
  const currentPromo = promos[safeIndex];

  activeIndexRef.current = safeIndex;
  isPausedRef.current = isPaused;
  promoCountRef.current = promos.length;
  canRotateRef.current = canRotate;

  const trackOffsetPercent =
    promos.length > 0 ? (safeIndex * 100) / promos.length : 0;

  const screenReaderText = useMemo(() => {
    const text = currentPromo?.promoText ?? "";
    const cta = currentPromo?.ctaText || fallbackCtaLabel;
    return text ? `${text}. ${cta}.` : cta;
  }, [currentPromo, fallbackCtaLabel]);

  const clearRotationTimer = useCallback(() => {
    if (rotationTimerRef.current !== null) {
      clearTimeout(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
  }, []);

  const clearSlideFallbackTimer = useCallback(() => {
    if (slideFallbackTimerRef.current !== null) {
      clearTimeout(slideFallbackTimerRef.current);
      slideFallbackTimerRef.current = null;
    }
  }, []);

  const scheduleDisplay = useCallback(() => {
    clearRotationTimer();
    if (!canRotateRef.current || isPausedRef.current) return;

    rotationTimerRef.current = setTimeout(() => {
      rotationTimerRef.current = null;
      if (!canRotateRef.current || isPausedRef.current) return;
      if (promoCountRef.current <= 1) return;

      const nextIndex =
        (activeIndexRef.current + 1) % promoCountRef.current;

      slideDoneRef.current = false;
      setActiveIndex(nextIndex);
      activeIndexRef.current = nextIndex;

      clearSlideFallbackTimer();
      slideFallbackTimerRef.current = setTimeout(() => {
        slideFallbackTimerRef.current = null;
        if (slideDoneRef.current) return;
        slideDoneRef.current = true;
        scheduleDisplayRef.current();
      }, SLIDE_MS + 50);
    }, ROTATION_MS);
  }, [clearRotationTimer, clearSlideFallbackTimer]);

  scheduleDisplayRef.current = scheduleDisplay;

  const completeSlide = useCallback(() => {
    if (slideDoneRef.current) return;
    slideDoneRef.current = true;
    clearSlideFallbackTimer();
    scheduleDisplayRef.current();
  }, [clearSlideFallbackTimer]);

  const handleTrackTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (!isSlideTransformProperty(event.propertyName)) return;
      if (!canRotateRef.current || isPausedRef.current) return;

      completeSlide();
    },
    [completeSlide],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cached = cacheRead<CachedPromo>(window.sessionStorage, PROMO_CACHE_KEY, {
      version: PROMO_CACHE_VERSION,
    });
    if (cached.value?.promos?.length) {
      setPromos(cached.value.promos);
      if (!cached.expired) return;
    }

    let cancelled = false;
    const cancelIdle = runWhenIdle(() => {
      void loadPromos().then((items) => {
        if (cancelled || !items?.length) return;
        setPromos(items);
      });
    }, 1200);

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (activeIndex >= promos.length) {
      setActiveIndex(0);
      activeIndexRef.current = 0;
    }
  }, [activeIndex, promos.length]);

  useEffect(() => {
    if (!canRotate || isPaused) {
      clearRotationTimer();
      clearSlideFallbackTimer();
      slideDoneRef.current = true;
      return;
    }

    scheduleDisplay();

    return () => {
      clearRotationTimer();
      clearSlideFallbackTimer();
    };
  }, [
    canRotate,
    clearRotationTimer,
    clearSlideFallbackTimer,
    isPaused,
    scheduleDisplay,
  ]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  return (
    <div
      className="w-full flex items-center justify-center bg-black text-[#FAFAFA]"
      role="region"
      aria-label="Promotional announcements"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full py-2 md:py-0 md:h-12 flex items-center justify-center min-h-[42px] md:min-h-12">
        <div className="relative w-full h-[42px] md:h-12 overflow-hidden">
          {currentPromo ? (
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {screenReaderText}
            </p>
          ) : null}

          {canRotate ? (
            <div
              aria-hidden
              className={["flex flex-col w-full will-change-transform", TRACK_TRANSITION].join(
                " ",
              )}
              style={{
                transform: `translateY(-${trackOffsetPercent}%)`,
              }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {promos.map((promo) => (
                <div key={promo.id} className={ROW_CLASS}>
                  <PromoMessage
                    promo={promo}
                    fallbackCtaLabel={fallbackCtaLabel}
                  />
                </div>
              ))}
            </div>
          ) : currentPromo ? (
            <div className={ROW_CLASS}>
              <PromoMessage
                promo={currentPromo}
                fallbackCtaLabel={fallbackCtaLabel}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

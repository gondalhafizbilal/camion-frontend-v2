"use client";

import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { GqlCategory } from "@/services/graphql/types/category";

const CHILD_THUMB = 20;
/** Grandchild row thumbnail (mega menu). */
const GRAND_THUMB = 34;
/** Watermark when API has no thumbnail: small logo, low contrast. */
const GRAND_THUMB_WATERMARK_SRC = "/assets/icons/logo-light.svg";
/** Logo size inside the thumb cell (px); keep smaller than GRAND_THUMB for watermark look. */
const GRAND_WATERMARK_LOGO_PX = 15;
const CHILD_MEGA_GAP = 10; // px
const VIEWPORT_PAD = 8;
/** Grandchild mega: max rows per column before flowing to the next column. */
const GRAND_PER_COLUMN = 6;
/** Fallback width estimate for flip/position before panel is measured. */
const PANEL_MAX_W = 520;

function thumbUrl(u: string | null | undefined): string | null {
  const t = (u ?? "").trim();
  return t || null;
}

export type HeaderSubcategoryBarProps = {
  /** Top-level categories (full tree). */
  roots: GqlCategory[];
  /** Root `slug` whose children render as level 2 (pathname / hover on level 1). */
  highlightRootSlug: string;
  loading?: boolean;
};

export default function HeaderSubcategoryBar({
  roots,
  highlightRootSlug,
  loading = false,
}: HeaderSubcategoryBarProps) {
  const [hoveredChildUuid, setHoveredChildUuid] = useState<string | null>(null);
  const childMegaLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredTriggerRef = useRef<HTMLElement | null>(null);
  const scrollStripRef = useRef<HTMLDivElement | null>(null);
  const megaPanelRef = useRef<HTMLDivElement | null>(null);
  /** Fixed viewport position: panel opens below the level-2 trigger, left-aligned. */
  const [megaFixed, setMegaFixed] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const highlightedRoot = useMemo(
    () => roots.find((r) => r.slug === highlightRootSlug) ?? roots[0] ?? null,
    [roots, highlightRootSlug],
  );

  const openChildren = useMemo(() => highlightedRoot?.children ?? [], [highlightedRoot]);

  const hoveredChild = useMemo(() => {
    if (!hoveredChildUuid) return null;
    return openChildren.find((c) => c.uuid === hoveredChildUuid) ?? null;
  }, [openChildren, hoveredChildUuid]);

  const hoveredGrandchildren = useMemo(
    () => hoveredChild?.children ?? [],
    [hoveredChild],
  );

  const showChildMega = hoveredChildUuid != null && hoveredGrandchildren.length > 0;

  const clearChildMegaCloseTimer = useCallback(() => {
    if (childMegaLeaveTimerRef.current) {
      clearTimeout(childMegaLeaveTimerRef.current);
      childMegaLeaveTimerRef.current = null;
    }
  }, []);

  const syncMegaToTrigger = useCallback(() => {
    const el = hoveredTriggerRef.current;
    if (!el || typeof window === "undefined") return;

    const anchor = el.getBoundingClientRect();
    const gap = CHILD_MEGA_GAP;

    let panelW = PANEL_MAX_W;
    const measured = megaPanelRef.current?.getBoundingClientRect().width;
    if (measured && measured > 0) panelW = measured;

    // Drop-down: directly under the L2 item, same horizontal start as the trigger.
    let left = anchor.left;
    const maxLeft = window.innerWidth - VIEWPORT_PAD - panelW;
    const minLeft = VIEWPORT_PAD;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    const top = anchor.bottom + gap;

    setMegaFixed({ top, left });
  }, []);

  useEffect(() => {
    hoveredTriggerRef.current = null;
    setHoveredChildUuid(null);
  }, [highlightRootSlug]);

  useLayoutEffect(() => {
    if (!hoveredChildUuid) return;

    syncMegaToTrigger();

    const scrollEl = scrollStripRef.current;
    const onScrollOrResize = () => {
      syncMegaToTrigger();
    };

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    scrollEl?.addEventListener("scroll", onScrollOrResize, { passive: true });

    const id = window.requestAnimationFrame(() => syncMegaToTrigger());

    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      scrollEl?.removeEventListener("scroll", onScrollOrResize);
    };
  }, [hoveredChildUuid, syncMegaToTrigger]);

  useLayoutEffect(() => {
    if (!showChildMega) return;
    syncMegaToTrigger();
  }, [showChildMega, hoveredGrandchildren.length, syncMegaToTrigger]);

  useEffect(() => () => clearChildMegaCloseTimer(), [clearChildMegaCloseTimer]);

  useEffect(() => {
    if (!hoveredChildUuid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hoveredTriggerRef.current = null;
        setHoveredChildUuid(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hoveredChildUuid]);

  const scheduleChildMegaClose = useCallback(() => {
    clearChildMegaCloseTimer();
    childMegaLeaveTimerRef.current = setTimeout(() => {
      hoveredTriggerRef.current = null;
      setHoveredChildUuid(null);
      childMegaLeaveTimerRef.current = null;
    }, 190);
  }, [clearChildMegaCloseTimer]);

  if (!loading && openChildren.length === 0) {
    return null;
  }

  if (loading && roots.length === 0) {
    return (
      <div
        className="w-full border-t border-black/[0.06] bg-white"
        style={{ height: 48 }}
      >
        <div className="w-full h-full flex items-center px-4 md:px-10">
          <div className="h-3 w-40 rounded bg-gray-200 animate-pulse" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-t border-black/[0.06] bg-white" style={{ height: 48 }}>
      <div
        ref={scrollStripRef}
        className="w-full h-full flex items-center px-4 md:px-10 overflow-x-auto overflow-y-visible"
        onPointerEnter={clearChildMegaCloseTimer}
        onPointerLeave={scheduleChildMegaClose}
      >
        <nav aria-label="Subcategories" className="w-full min-h-0">
          <ul className="flex items-center gap-6 whitespace-nowrap">
            {loading && openChildren.length === 0
              ? Array.from({ length: 10 }).map((_, i) => (
                  <li key={`ch-sk-${i}`} className="shrink-0">
                    <span
                      className="inline-block h-3 w-16 rounded bg-gray-200 animate-pulse"
                      aria-hidden
                    />
                  </li>
                ))
              : openChildren.map((child) => {
                  const childLabel = child.name || child.slug;
                  const cThumb = thumbUrl(child.thumbnailUrl);
                  const hasGrands = (child.children ?? []).length > 0;
                  const childRowClassName = [
                    "text-start px-2 py-1.5 rounded-md shrink-0",
                    "font-sans text-[11px] leading-5 inline-flex items-center gap-2",
                    "text-black/80",
                    "hover:bg-black/[0.04] hover:text-black",
                  ].join(" ");
                  return (
                    <li
                      key={child.uuid}
                      className="shrink-0 relative"
                      onPointerEnter={
                        hasGrands
                          ? (e) => {
                              clearChildMegaCloseTimer();
                              hoveredTriggerRef.current = e.currentTarget;
                              setHoveredChildUuid(child.uuid);
                            }
                          : undefined
                      }
                      onPointerLeave={hasGrands ? scheduleChildMegaClose : undefined}
                    >
                      <Link
                        href={`/categories/${child.slug}`}
                        onPointerEnter={() => {
                          if (!hasGrands) {
                            clearChildMegaCloseTimer();
                            hoveredTriggerRef.current = null;
                            setHoveredChildUuid(null);
                          }
                        }}
                        onFocus={(e) => {
                          if (hasGrands) {
                            hoveredTriggerRef.current = e.currentTarget;
                            setHoveredChildUuid(child.uuid);
                          } else {
                            hoveredTriggerRef.current = null;
                            setHoveredChildUuid(null);
                          }
                        }}
                        className={`${childRowClassName} ${
                          hasGrands ? "font-semibold text-black/90" : "font-normal"
                        }`}
                      >
                        {cThumb ? (
                          <Image
                            src={cThumb}
                            alt=""
                            width={CHILD_THUMB}
                            height={CHILD_THUMB}
                            className="shrink-0 rounded-md object-cover bg-gray-50"
                            unoptimized
                          />
                        ) : null}
                        {childLabel}
                      </Link>
                    </li>
                  );
                })}
          </ul>
        </nav>
      </div>

      {showChildMega ? (
        <div
          ref={megaPanelRef}
          className="fixed z-[300] pointer-events-auto motion-safe:transition-[opacity] motion-safe:duration-100 motion-safe:ease-out"
          style={{
            top: megaFixed.top,
            left: megaFixed.left,
          }}
          onPointerEnter={clearChildMegaCloseTimer}
          onPointerLeave={scheduleChildMegaClose}
        >
          <div className="bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)] border border-black/[0.08] rounded-[10px] py-4 px-4 w-max max-w-[min(92vw,720px)]">
            <Link
              href={`/categories/${hoveredChild?.slug ?? ""}`}
              className="font-sans text-[13px] leading-5 font-semibold text-black inline-flex items-center gap-2 select-none whitespace-nowrap border-b border-black/[0.06] pb-2 mb-2 hover:text-black/80"
            >
              {thumbUrl(hoveredChild?.thumbnailUrl) ? (
                <Image
                  src={thumbUrl(hoveredChild?.thumbnailUrl)!}
                  alt=""
                  width={22}
                  height={22}
                  className="shrink-0 rounded-md object-cover bg-gray-50"
                  unoptimized
                />
              ) : null}
              {hoveredChild?.name || hoveredChild?.slug}
            </Link>

            <ul
              className="grid w-max max-w-full gap-x-10 gap-y-1"
              style={{
                gridAutoFlow: "column",
                gridTemplateRows: `repeat(${GRAND_PER_COLUMN}, minmax(0, auto))`,
                gridAutoColumns: "max-content",
              }}
            >
              {hoveredGrandchildren.map((g) => {
                const gLabel = g.name || g.slug;
                const gThumb = thumbUrl(g.thumbnailUrl);
                return (
                  <li key={g.uuid} className="min-w-0 max-w-[220px]">
                    <Link
                      href={`/categories/${g.slug}`}
                      className="font-sans text-[13px] leading-6 text-black/80 hover:text-black inline-flex items-center gap-2 py-0.5 rounded-md hover:bg-black/[0.04] px-1 -mx-1"
                    >
                      {gThumb ? (
                        <Image
                          src={gThumb}
                          alt=""
                          width={GRAND_THUMB}
                          height={GRAND_THUMB}
                          className="shrink-0 rounded object-cover bg-gray-50"
                          unoptimized
                        />
                      ) : (
                        <span
                          className="shrink-0 inline-flex items-center justify-center rounded bg-gray-50 ring-1 ring-black/[0.06]"
                          style={{
                            width: GRAND_THUMB,
                            height: GRAND_THUMB,
                          }}
                          aria-hidden
                        >
                          <Image
                            src={GRAND_THUMB_WATERMARK_SRC}
                            alt=""
                            width={GRAND_WATERMARK_LOGO_PX}
                            height={GRAND_WATERMARK_LOGO_PX}
                            className="object-contain opacity-[0.22]"
                            unoptimized
                          />
                        </span>
                      )}
                      <span className="whitespace-normal break-words">{gLabel}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

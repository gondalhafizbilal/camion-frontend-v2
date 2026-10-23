"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ToastRecord } from "./types";
import { removeToast } from "./toastStore";
import { useHtmlDir } from "./useHtmlDir";

const ACCENT: Record<ToastRecord["type"], string> = {
  success: "#067d62",
  error: "#c40000",
  warning: "#ff9900",
  info: "#007185",
};

type Props = {
  toast: ToastRecord;
};

export function ToastSurface({ toast: item }: Props) {
  const htmlDir = useHtmlDir();
  const enterX = htmlDir === "rtl" ? -28 : 28;
  const [paused, setPaused] = useState(false);
  const remainingMs = useRef(item.duration);
  const deadlineRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartX = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    removeToast(item.id);
  }, [item.id]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    remainingMs.current = item.duration;
  }, [item.duration, item.id]);

  useEffect(() => {
    if (paused) {
      if (deadlineRef.current !== null) {
        remainingMs.current = Math.max(0, deadlineRef.current - Date.now());
        deadlineRef.current = null;
      }
      clearTimer();
      return;
    }

    deadlineRef.current = Date.now() + remainingMs.current;
    timeoutRef.current = setTimeout(() => {
      dismiss();
    }, remainingMs.current);

    return () => clearTimer();
  }, [paused, item.id, dismiss, clearTimer]);

  const role = item.type === "error" || item.type === "warning" ? "alert" : "status";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: enterX }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        opacity: { duration: 0.25, ease: [0, 0, 0.2, 1] },
        x: { duration: 0.25, ease: [0, 0, 0.2, 1] },
        scale: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        layout: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      }}
      role={role}
      aria-atomic="true"
      aria-labelledby={`toast-title-${item.id}`}
      aria-describedby={
        item.description ? `toast-desc-${item.id}` : undefined
      }
      className="pointer-events-auto w-full max-w-[360px] select-none rounded-lg border border-[#e3e6e6] bg-white shadow-[0_2px_8px_rgba(15,17,17,0.12)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          pointerStartX.current = e.clientX;
        }
      }}
      onPointerUp={(e) => {
        if (pointerStartX.current === null) return;
        const dx = e.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(dx) > 56) dismiss();
      }}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
    >
      <div className="flex min-h-[52px] overflow-hidden rounded-lg">
        <div
          className="w-1 shrink-0 self-stretch"
          style={{ backgroundColor: ACCENT[item.type] }}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 pe-2">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <p
                id={`toast-title-${item.id}`}
                className="text-sm font-semibold leading-snug text-[#0f1111]"
              >
                {item.title}
              </p>
              {item.description ? (
                <p
                  id={`toast-desc-${item.id}`}
                  className="mt-0.5 text-xs leading-relaxed text-[#565959]"
                >
                  {item.description}
                </p>
              ) : null}
            </div>
            {item.closable ? (
              <button
                type="button"
                onClick={dismiss}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#565959] outline-none ring-offset-2 hover:bg-[#f0f2f2] focus-visible:ring-2 focus-visible:ring-[#007185]"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </div>
          {item.actionLabel && item.onAction ? (
            <button
              type="button"
              onClick={() => {
                item.onAction?.();
                dismiss();
              }}
              className="self-start rounded-md px-2 py-1 text-xs font-semibold text-[#007185] outline-none ring-offset-2 hover:bg-[#f0f2f2] focus-visible:ring-2 focus-visible:ring-[#007185]"
            >
              {item.actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

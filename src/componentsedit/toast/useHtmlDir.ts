"use client";

import { useEffect, useState } from "react";

export type HtmlDir = "rtl" | "ltr";

function readDir(): HtmlDir {
  if (typeof document === "undefined") return "ltr";
  return document.documentElement.dir === "rtl" ? "rtl" : "ltr";
}

/** Tracks `<html dir>` for portal-mounted UI (e.g. toasts). */
export function useHtmlDir(): HtmlDir {
  const [dir, setDir] = useState<HtmlDir>(() => readDir());

  useEffect(() => {
    const el = document.documentElement;
    setDir(readDir());
    const obs = new MutationObserver(() => setDir(readDir()));
    obs.observe(el, { attributes: true, attributeFilter: ["dir"] });
    return () => obs.disconnect();
  }, []);

  return dir;
}

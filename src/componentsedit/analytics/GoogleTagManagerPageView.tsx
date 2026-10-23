"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackGtmPageFunnel } from "./gtmFunnel";
import { warmGtmCountryContext } from "./gtmEventContext";

/**
 * Pushes funnel page events (PageView + route-specific) on first load and
 * App Router client navigations for GTM Custom Event triggers.
 */
export default function GoogleTagManagerPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;

    warmGtmCountryContext();
    const search = searchParams?.toString() ?? "";
    trackGtmPageFunnel(pathname, search);
  }, [pathname, searchParams]);

  return null;
}

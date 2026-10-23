"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { runWhenFacebookPixelReady } from "./facebookPixelClient";
import { trackFacebookPageView } from "./trackFacebookPageView";

/**
 * Fires PageView on every logical page view (first load + App Router navigations),
 * with page_path (including query) and page_title for Events Manager reporting.
 */
export default function FacebookPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    return runWhenFacebookPixelReady(() => {
      trackFacebookPageView(pathname, search);
    });
  }, [pathname, search]);

  return null;
}

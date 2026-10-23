"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { runWhenTikTokPixelReady } from "./tiktokPixelClient";
import { trackTikTokPageView } from "./trackTikTokPageView";

/**
 * Fires TikTok page view on every logical page view (first load + App Router navigations),
 * with page_path, page_title, and url for Events Manager reporting.
 */
export default function TikTokPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    return runWhenTikTokPixelReady(() => {
      trackTikTokPageView(pathname, search);
    });
  }, [pathname, search]);

  return null;
}

export type FacebookPageViewParams = {
  page_path: string;
  page_title: string;
};

export function buildFacebookPageViewParams(
  pathname: string,
  search: string,
): FacebookPageViewParams {
  const page_path = search ? `${pathname}?${search}` : pathname;
  return {
    page_path,
    page_title: typeof document !== "undefined" ? document.title : "",
  };
}

/** Standard Meta PageView with page_path and page_title (SPA + first load). */
export function trackFacebookPageView(pathname: string, search: string): void {
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "PageView", buildFacebookPageViewParams(pathname, search));
}

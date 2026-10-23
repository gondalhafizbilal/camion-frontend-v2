export type TikTokPageViewParams = {
  page_path: string;
  page_title: string;
  url: string;
};

export function buildTikTokPageViewParams(
  pathname: string,
  search: string,
): TikTokPageViewParams {
  const page_path = search ? `${pathname}?${search}` : pathname;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const url = origin ? `${origin}${page_path}` : page_path;
  return {
    page_path,
    page_title: typeof document !== "undefined" ? document.title : "",
    url,
  };
}

/** Standard TikTok page view (first load + App Router navigations). */
export function trackTikTokPageView(pathname: string, search: string): void {
  if (typeof window.ttq?.page !== "function") return;
  window.ttq.page(buildTikTokPageViewParams(pathname, search));
}

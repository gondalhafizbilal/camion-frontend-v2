import { Suspense } from "react";
import { isValidGtmId } from "./GoogleTagManager";
import GoogleTagManagerPageView from "./GoogleTagManagerPageView";

type GoogleTagManagerBodyProps = {
  gtmId: string;
};

/**
 * GTM noscript fallback + SPA page_view pushes. Render as the first child of <body>.
 */
export default function GoogleTagManagerBody({
  gtmId,
}: GoogleTagManagerBodyProps) {
  const id = gtmId.trim();
  if (!id || !isValidGtmId(id)) return null;

  return (
    <>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${id}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
      <Suspense fallback={null}>
        <GoogleTagManagerPageView />
      </Suspense>
    </>
  );
}

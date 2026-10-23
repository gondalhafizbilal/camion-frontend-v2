import Script from "next/script";
import { Suspense } from "react";
import TikTokPixelPageView from "./TikTokPixelPageView";

type TikTokPixelProps = {
  pixelId: string;
};

function isValidTikTokPixelId(id: string): boolean {
  return /^[A-Za-z0-9]+$/.test(id);
}

/**
 * TikTok Pixel — bootstrap + load in base script; page views (with context)
 * are fired from TikTokPixelPageView on load and client navigations.
 */
export default function TikTokPixel({ pixelId }: TikTokPixelProps) {
  const id = pixelId.trim();
  if (!id || !isValidTikTokPixelId(id)) return null;

  return (
    <>
      <Script
        id="tiktok-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function(w,d,t){
  w.TiktokAnalyticsObject=t;
  var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){
    var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
    ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;
    ttq._t=ttq._t||{};ttq._t[e]=+new Date;
    ttq._o=ttq._o||{};ttq._o[e]=n||{};
    n=document.createElement("script");
    n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;
    e=document.getElementsByTagName("script")[0];
    e.parentNode.insertBefore(n,e)
  };
  ttq.load('${id}');
}(window,document,'ttq');
          `.trim(),
        }}
      />
      <Suspense fallback={null}>
        <TikTokPixelPageView />
      </Suspense>
    </>
  );
}

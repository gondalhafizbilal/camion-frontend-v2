"use client";

import { useEffect, useMemo } from "react";
import Script from "next/script";

type ZendeskApi = ((...args: unknown[]) => void) & { q?: unknown[] };

function getZendeskApi(): ZendeskApi | null {
  const w = globalThis as unknown as { zE?: ZendeskApi; zEQueue?: unknown[] };
  return w.zE ?? null;
}

function tryShowZendeskWidget() {
  const zE = getZendeskApi();
  if (!zE) return false;
  try {
    // Support both classic Web Widget and the newer Messaging widget.
    zE("webWidget", "show");
    zE("messenger", "show");
    return true;
  } catch {
    return false;
  }
}

function tryHideZendeskWidget() {
  const zE = getZendeskApi();
  if (!zE) return false;
  try {
    zE("webWidget", "close");
    zE("webWidget", "hide");
    zE("messenger", "close");
    zE("messenger", "hide");
    return true;
  } catch {
    return false;
  }
}

export default function ZendeskWidgetLoader({
  snippetKey,
}: {
  snippetKey: string;
}) {
  const src = useMemo(
    () => `https://static.zdassets.com/ekr/snippet.js?key=${encodeURIComponent(snippetKey)}`,
    [snippetKey],
  );

  useEffect(() => {
    // On client-side navigation, `zE` may be available slightly later than the script tag.
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      const ok = tryShowZendeskWidget();
      if (ok || tries >= 30) window.clearInterval(id); // ~6s
    }, 200);

    return () => {
      window.clearInterval(id);
      // Hide on unmount (route change) so it disappears without refresh.
      tryHideZendeskWidget();
    };
  }, []);

  return (
    <Script
      id="ze-snippet"
      src={src}
      strategy="afterInteractive"
      onLoad={() => {
        // Ensure widget becomes visible immediately after script loads.
        tryShowZendeskWidget();
      }}
    />
  );
}


declare global {
  interface Window {
    ttq?: {
      page?: (params?: Record<string, unknown>) => void;
      track?: (
        event: string,
        params?: Record<string, unknown>,
        options?: { event_id?: string },
      ) => void;
      load?: (pixelId: string, options?: Record<string, unknown>) => void;
      push?: (args: unknown[]) => void;
    };
  }
}

export const TTQ_POLL_MS = 50;
export const TTQ_MAX_ATTEMPTS = 40;

/** Runs `fn` once `window.ttq.page` exists (pixel stub or loaded script). Returns effect cleanup. */
export function runWhenTikTokPixelReady(fn: () => void): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let attempts = 0;

  const fire = () => {
    if (cancelled || typeof window.ttq?.page !== "function") return false;
    fn();
    return true;
  };

  if (!fire()) {
    timer = setInterval(() => {
      if (fire() || ++attempts >= TTQ_MAX_ATTEMPTS) {
        if (timer) clearInterval(timer);
      }
    }, TTQ_POLL_MS);
  }

  return () => {
    cancelled = true;
    if (timer) clearInterval(timer);
  };
}

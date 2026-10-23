declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName?: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
  }
}

export const FBQ_POLL_MS = 50;
export const FBQ_MAX_ATTEMPTS = 40;

/** Runs `fn` once `window.fbq` exists (pixel stub or loaded script). Returns effect cleanup. */
export function runWhenFacebookPixelReady(fn: () => void): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let attempts = 0;

  const fire = () => {
    if (cancelled || typeof window.fbq !== "function") return false;
    fn();
    return true;
  };

  if (!fire()) {
    timer = setInterval(() => {
      if (fire() || ++attempts >= FBQ_MAX_ATTEMPTS) {
        if (timer) clearInterval(timer);
      }
    }, FBQ_POLL_MS);
  }

  return () => {
    cancelled = true;
    if (timer) clearInterval(timer);
  };
}

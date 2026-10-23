export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type Envelope<T> = {
  v: number;
  /** Epoch ms when written. */
  ts: number;
  /** TTL in ms at time of write (so it can be changed without breaking old entries). */
  ttl: number;
  data: T;
};

function nowMs(): number {
  return Date.now();
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === "object";
}

function readEnvelope<T>(raw: string | null, version: number): Envelope<T> | null {
  if (!raw) return null;
  const parsed = safeParseJson(raw);
  if (!isRecord(parsed)) return null;
  if (parsed.v !== version) return null;
  if (typeof parsed.ts !== "number" || !Number.isFinite(parsed.ts)) return null;
  if (typeof parsed.ttl !== "number" || !Number.isFinite(parsed.ttl)) return null;
  return parsed as Envelope<T>;
}

export type CacheReadResult<T> = {
  /** Cached value if present and not expired. */
  value: T | null;
  /** True when an envelope exists but is expired (useful for stale-while-revalidate UI). */
  expired: boolean;
};

/**
 * Small, reusable TTL cache for `localStorage`/`sessionStorage`.
 * - Safe JSON parsing
 * - Versioned envelopes (bump to invalidate)
 * - TTL stored per-entry
 */
export function cacheRead<T>(
  storage: StorageLike,
  key: string,
  opts: { version: number },
): CacheReadResult<T> {
  const env = readEnvelope<T>(storage.getItem(key), opts.version);
  if (!env) return { value: null, expired: false };

  const age = nowMs() - env.ts;
  const isExpired = age > env.ttl;
  if (isExpired) return { value: env.data ?? null, expired: true };
  return { value: env.data ?? null, expired: false };
}

export function cacheWrite<T>(
  storage: StorageLike,
  key: string,
  data: T,
  opts: { version: number; ttlMs: number },
): void {
  const ttlMs = Math.max(0, Math.floor(opts.ttlMs));
  const payload: Envelope<T> = {
    v: opts.version,
    ts: nowMs(),
    ttl: ttlMs,
    data,
  };
  try {
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function cacheRemove(storage: StorageLike, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Run a callback when the browser is idle, with a timeout fallback. */
export function runWhenIdle(fn: () => void, timeoutMs = 1200): () => void {
  if (typeof window === "undefined") return () => {};
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(fn, { timeout: timeoutMs });
    return () => {
      try {
        w.cancelIdleCallback?.(id);
      } catch {
        /* ignore */
      }
    };
  }
  const t = window.setTimeout(fn, Math.max(0, timeoutMs));
  return () => window.clearTimeout(t);
}


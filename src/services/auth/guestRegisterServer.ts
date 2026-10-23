import { unstable_cache } from "next/cache";
import { cache } from "react";
import { cookies } from "next/headers";
import { HOME_CATALOG_TOKEN_REVALIDATE_SECONDS } from "@/lib/home/homeCacheConfig";
import { API_ENDPOINTS, BASE_URL_AUTH } from "@/services/api/api";
import { GUEST_DEVICE_COOKIE_NAME } from "@/services/auth/guestRegister";

const GUEST_REGISTER_BODY_TOKEN =
  process.env.NEXT_PUBLIC_GUEST_REGISTER_BODY_TOKEN ?? "12349";

function serverGuestDeviceId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return `guest_ssr_${c.randomUUID().replace(/-/g, "")}`;
  }
  return `guest_ssr_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

function upstreamAbsoluteUrl(path: string): string {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${site}${path.startsWith("/") ? path : `/${path}`}`;
}

function directApiUrl(relativePath: string): string | null {
  const base = (BASE_URL_AUTH ?? "").replace(/\/$/, "");
  if (!base) return null;
  const p = relativePath.replace(/^\/+/, "");
  return `${base}/${p}`;
}

function guestRegisterRequestUrl(): string {
  return (
    directApiUrl("v1/auth/guest/register") ??
    upstreamAbsoluteUrl(API_ENDPOINTS.AUTH_GUEST_REGISTER)
  );
}

function parseGuestRegisterToken(raw: string): string | null {
  const trimmed = raw.trimStart();
  if (!trimmed || trimmed.startsWith("<")) return null;
  try {
    const data = JSON.parse(raw) as { token?: string };
    return typeof data?.token === "string" ? data.token : null;
  } catch {
    return null;
  }
}

function guestRegisterRawIndicatesDeviceConflict(raw: string): boolean {
  if (/already\s+been\s+registered/i.test(raw)) return true;
  if (/device.*already.*registered/i.test(raw)) return true;
  if (/already\s+registered/i.test(raw) && /device/i.test(raw)) return true;
  const trimmed = raw.trimStart();
  if (!trimmed || trimmed.startsWith("<")) return false;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const errors = parsed.errors;
    if (errors && typeof errors === "object" && errors !== null) {
      const e = errors as Record<string, unknown>;
      if ("deviceId" in e) return true;
      const d = e.deviceId;
      if (typeof d === "string" && /already/i.test(d)) return true;
      if (Array.isArray(d) && d.some((x) => typeof x === "string" && /already/i.test(x)))
        return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

const GUEST_REGISTER_SERVER_FETCH_MS = 12_000;

/** Fail fast when guest-register is persistently down (avoids hammering upstream). */
const GUEST_REGISTER_BREAKER_FAIL_THRESHOLD = 5;
const GUEST_REGISTER_BREAKER_OPEN_MS = 30_000;

type GuestRegisterBreaker = {
  failStreak: number;
  /** When > now, skip outbound guest-register attempts. */
  openUntil: number;
};

const guestRegisterBreaker: GuestRegisterBreaker = {
  failStreak: 0,
  openUntil: 0,
};

function guestRegisterBreakerIsOpen(now: number): boolean {
  return now < guestRegisterBreaker.openUntil;
}

function guestRegisterBreakerOnSuccess(): void {
  guestRegisterBreaker.failStreak = 0;
  guestRegisterBreaker.openUntil = 0;
}

function guestRegisterBreakerOnFailure(now: number): void {
  guestRegisterBreaker.failStreak += 1;
  if (guestRegisterBreaker.failStreak >= GUEST_REGISTER_BREAKER_FAIL_THRESHOLD) {
    guestRegisterBreaker.openUntil = now + GUEST_REGISTER_BREAKER_OPEN_MS;
    guestRegisterBreaker.failStreak = 0;
    console.warn(
      `[guestRegisterServer] circuit open ${GUEST_REGISTER_BREAKER_OPEN_MS}ms after repeated guest/register failures`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Stable device id for shared home/catalog SSR (not per-visitor). */
export const HOME_CATALOG_DEVICE_ID = "camion_home_ssr_catalog";

type PostGuestRegisterOptions = {
  /** When true, do not mint a random device on conflict (catalog SSR). */
  fixedDeviceOnly?: boolean;
};

async function postGuestRegisterWithDeviceId(
  deviceId: string,
  options: PostGuestRegisterOptions = {},
): Promise<string | null> {
  const doPost = async (id: string) => {
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), GUEST_REGISTER_SERVER_FETCH_MS);
    try {
      const res = await fetch(guestRegisterRequestUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          deviceId: id,
          token: GUEST_REGISTER_BODY_TOKEN,
        }),
        cache: "no-store",
        signal: ctl.signal,
      });
      const raw = await res.text();
      return { res, raw, token: parseGuestRegisterToken(raw) };
    } catch (e) {
      const name = e instanceof DOMException ? e.name : e instanceof Error ? e.name : "";
      if (name === "AbortError") {
        console.warn("[guestRegisterServer] guest/register request timed out");
      } else {
        console.error("[guestRegisterServer] guest/register fetch error", e);
      }
      return {
        res: new Response(null, { status: 408, statusText: "Request Timeout" }),
        raw: "",
        token: null,
      };
    } finally {
      clearTimeout(tid);
    }
  };

  try {
    const first = await doPost(deviceId);
    if (first.token) return first.token;

    if (guestRegisterRawIndicatesDeviceConflict(first.raw)) {
      if (options.fixedDeviceOnly) {
        console.warn(
          "[guestRegisterServer] catalog device already registered:",
          deviceId,
        );
        return null;
      }
      for (let r = 0; r < 2; r++) {
        const second = await doPost(serverGuestDeviceId());
        if (second.token) return second.token;
        if (!guestRegisterRawIndicatesDeviceConflict(second.raw)) {
          if (!second.res.ok) {
            console.error(
              "[guestRegisterServer] retry",
              second.res.status,
              second.raw.slice(0, 400),
            );
          }
          return null;
        }
      }
      console.error("[guestRegisterServer] device conflict persists after retries");
      return null;
    }

    if (!first.res.ok) {
      console.error("[guestRegisterServer]", first.res.status, first.raw.slice(0, 400));
    }
    return null;
  } catch (e) {
    console.error("[guestRegisterServer]", e);
    return null;
  }
}

async function resolveServerGraphqlTokenOnce(): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get("token")?.value;
  if (existing) {
    guestRegisterBreakerOnSuccess();
    return existing;
  }

  const now = Date.now();
  if (guestRegisterBreakerIsOpen(now)) {
    console.warn("[guestRegisterServer] circuit open; skipping guest/register");
    return null;
  }

  const stableDevice = jar.get(GUEST_DEVICE_COOKIE_NAME)?.value ?? null;
  const deviceId = stableDevice ?? serverGuestDeviceId();
  const token = await postGuestRegisterWithDeviceId(deviceId);
  if (token) {
    guestRegisterBreakerOnSuccess();
  } else {
    guestRegisterBreakerOnFailure(now);
  }
  return token;
}

export type ResolveServerGraphqlTokenRetryOptions = {
  /** Total attempts including the first. */
  attempts?: number;
  /** Base delay between attempts (exponential backoff). */
  baseDelayMs?: number;
  /** Max wait between attempts. */
  maxDelayMs?: number;
};

/**
 * Resolves a Bearer for server-side GraphQL with retries.
 * Deduped per React request via `cache`; retries only when the first resolve returns null.
 */
export const resolveServerGraphqlTokenWithRetry = cache(
  async (options: ResolveServerGraphqlTokenRetryOptions = {}): Promise<string | null> => {
    const attempts = Math.max(1, Math.floor(options.attempts ?? 3));
    const baseDelayMs = Math.max(0, Math.floor(options.baseDelayMs ?? 250));
    const maxDelayMs = Math.max(baseDelayMs, Math.floor(options.maxDelayMs ?? 2_000));

    let last = await resolveServerGraphqlTokenOnce();
    if (last) return last;

    for (let i = 1; i < attempts; i++) {
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (i - 1));
      await sleep(exp);
      last = await resolveServerGraphqlTokenOnce();
      if (last) return last;
    }
    return last;
  },
);

export const resolveServerGraphqlToken = cache(async (): Promise<string | null> => {
  return resolveServerGraphqlTokenOnce();
});

/** @deprecated Prefer `resolveServerGraphqlToken` (deduped per request). */
export async function fetchGuestTokenForServer(): Promise<string | null> {
  return resolveServerGraphqlToken();
}

/** In-process TTL for catalog JWT (covers concurrent cache regenerations). */
const CATALOG_TOKEN_TTL_MS = 15 * 60 * 1000;

type CatalogTokenEntry = { token: string; expiresAt: number };

let catalogTokenEntry: CatalogTokenEntry | null = null;
let catalogTokenInflight: Promise<string | null> | null = null;

async function fetchCatalogGraphqlTokenFromAuth(): Promise<string | null> {
  const now = Date.now();
  if (guestRegisterBreakerIsOpen(now)) {
    console.warn("[guestRegisterServer] circuit open; skipping catalog guest/register");
    return null;
  }

  let token = await postGuestRegisterWithDeviceId(HOME_CATALOG_DEVICE_ID, {
    fixedDeviceOnly: true,
  });
  if (!token) {
    /** Stable catalog device may already exist upstream without a retrievable JWT — mint a fresh SSR guest. */
    token = await postGuestRegisterWithDeviceId(serverGuestDeviceId());
  }
  if (token) {
    guestRegisterBreakerOnSuccess();
  } else {
    guestRegisterBreakerOnFailure(now);
  }
  return token;
}

/** Module-scoped catalog token: TTL + in-flight dedupe across parallel SSR workers in one process. */
async function getCatalogGraphqlTokenInProcess(): Promise<string | null> {
  const envToken = process.env.HOME_SSR_GRAPHQL_TOKEN?.trim();
  if (envToken) return envToken;

  const now = Date.now();
  if (catalogTokenEntry && catalogTokenEntry.expiresAt > now) {
    return catalogTokenEntry.token;
  }

  if (catalogTokenInflight) return catalogTokenInflight;

  catalogTokenInflight = (async () => {
    try {
      const token = await fetchCatalogGraphqlTokenFromAuth();
      if (token) {
        catalogTokenEntry = { token, expiresAt: Date.now() + CATALOG_TOKEN_TTL_MS };
      }
      return token;
    } finally {
      catalogTokenInflight = null;
    }
  })();

  return catalogTokenInflight;
}

class CatalogGraphqlTokenEmptyError extends Error {
  constructor() {
    super("CATALOG_GRAPHQL_TOKEN_EMPTY");
    this.name = "CatalogGraphqlTokenEmptyError";
  }
}

const readCachedCatalogGraphqlToken = unstable_cache(
  async () => {
    const token = await getCatalogGraphqlTokenInProcess();
    if (!token) throw new CatalogGraphqlTokenEmptyError();
    return token;
  },
  ["catalog-graphql-token"],
  { revalidate: HOME_CATALOG_TOKEN_REVALIDATE_SECONDS },
);

/**
 * Bearer for public home/catalog SSR. Shared across visitors — not read from request cookies.
 * Layered cache: Next data cache (15m) + in-process TTL (15m) + in-flight dedupe.
 * Set `HOME_SSR_GRAPHQL_TOKEN` to skip guest/register entirely.
 */
export async function getCatalogGraphqlToken(): Promise<string | null> {
  try {
    return await readCachedCatalogGraphqlToken();
  } catch (e) {
    if (e instanceof CatalogGraphqlTokenEmptyError) {
      return getCatalogGraphqlTokenInProcess();
    }
    throw e;
  }
}

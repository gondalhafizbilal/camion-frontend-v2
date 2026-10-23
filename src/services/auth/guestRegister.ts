import Cookies from "js-cookie";
import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";
import { isGuestSession } from "@/lib/auth/isGuestClient";

const GUEST_DEVICE_STORAGE_KEY = "camion_guest_device_id";

/** Legacy key (older builds); removed on each attempt so refresh is never blocked forever. */
const GUEST_REGISTER_BACKOFF_KEY = "camion_guest_register_backoff_until";
/** Cooldown after non–device-conflict failures (avoid hammering a broken upstream). In-memory only — survives SPA nav, clears on full reload. */
const GUEST_REGISTER_BACKOFF_MS = 3 * 60 * 1000;

/** Default timeout for best-effort guest register (keeps first paint / navigation responsive). */
const GUEST_REGISTER_BEST_EFFORT_TIMEOUT_MS = 12_000;

/** Readable cookie so SSR can reuse the same `deviceId` for guest (avoids duplicate registrations). */
export const GUEST_DEVICE_COOKIE_NAME = "camion_guest_device_id";

/** Fired after auth cookies change (guest/customer) so client providers can refetch. */
export const CAMION_SESSION_UPDATED_EVENT = "camion-session-updated";

export function notifySessionUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CAMION_SESSION_UPDATED_EVENT));
}

/**
 * Resolves when `token` is non-empty (poll) or right after {@link CAMION_SESSION_UPDATED_EVENT},
 * or when `maxWaitMs` elapses. Use before client GraphQL that often returns empty without a guest/customer bearer.
 */
export function waitForClientAuthToken(options?: {
  maxWaitMs?: number;
  pollIntervalMs?: number;
}): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const maxWaitMs = options?.maxWaitMs ?? 4_000;
  const pollIntervalMs = options?.pollIntervalMs ?? 80;

  const read = () => Cookies.get("token")?.trim() || null;
  const immediate = read();
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (t: string | null) => {
      if (settled) return;
      settled = true;
      window.clearInterval(iv);
      window.clearTimeout(to);
      window.removeEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
      resolve(t);
    };

    const onSession = () => {
      const t = read();
      if (t) finish(t);
    };

    const iv = window.setInterval(() => {
      const t = read();
      if (t) finish(t);
    }, pollIntervalMs);

    const to = window.setTimeout(() => finish(read()), maxWaitMs);
    window.addEventListener(CAMION_SESSION_UPDATED_EVENT, onSession);
  });
}

/** Clears persisted guest device id (localStorage + cookie). Next visit gets a new `deviceId`. */
export function clearGuestDeviceIdentity(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_DEVICE_STORAGE_KEY);
  } catch {
    /* private mode / blocked storage */
  }
  Cookies.remove(GUEST_DEVICE_COOKIE_NAME, { path: "/" });
  /** New device id should be allowed to register immediately; drop stale cooldown. */
  clearGuestRegisterBackoff();
}

function clearStaleGuestMarkersWithoutToken(): void {
  if (typeof window === "undefined") return;
  if (Cookies.get("token")?.trim()) return;
  if (!isGuestSession()) return;
  const opts = { path: "/" as const };
  Cookies.remove("loginType", opts);
  Cookies.remove("auth_method", opts);
  Cookies.remove("id", opts);
  Cookies.remove("email", opts);
  Cookies.remove("fullName", opts);
  Cookies.remove("phone", opts);
  Cookies.remove("role", opts);
}

function guestPayloadHasDeviceConflict(parsed: unknown, bodyText: string): boolean {
  const text = typeof bodyText === "string" ? bodyText : "";
  const haystack = `${text} ${parsed !== undefined && parsed !== null ? JSON.stringify(parsed) : ""}`;
  if (/already\s+been\s+registered/i.test(haystack)) return true;
  if (/device.*already.*registered/i.test(haystack)) return true;
  if (/already\s+registered/i.test(haystack) && /device/i.test(haystack)) return true;

  const visit = (node: unknown, depth: number): boolean => {
    if (depth > 14) return false;
    if (typeof node === "string") {
      return (
        /already\s+been\s+registered/i.test(node) ||
        (/already\s+registered/i.test(node) && /device/i.test(node))
      );
    }
    if (Array.isArray(node)) return node.some((x) => visit(x, depth + 1));
    if (node && typeof node === "object") {
      return Object.values(node).some((v) => visit(v, depth + 1));
    }
    return false;
  };

  if (visit(parsed, 0)) return true;

  if (parsed && typeof parsed === "object") {
    const root = parsed as Record<string, unknown>;
    const errors = root.errors;
    if (errors && typeof errors === "object") {
      const e = errors as Record<string, unknown>;
      if ("deviceId" in e) return true;
      const d = e.deviceId;
      if (typeof d === "string" && /already/i.test(d)) return true;
      if (Array.isArray(d) && d.some((x) => typeof x === "string" && /already/i.test(x)))
        return true;
    }
  }
  return false;
}

let guestEnsureInFlight: Promise<void> | null = null;

/** Monotonic deadline (ms); 0 = not in backoff. Not persisted — full page reload retries guest register. */
let guestRegisterBackoffUntilMs = 0;

function purgeLegacyGuestRegisterSessionBackoff(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(GUEST_REGISTER_BACKOFF_KEY);
  } catch {
    /* ignore */
  }
}

function isGuestRegisterInBackoff(): boolean {
  purgeLegacyGuestRegisterSessionBackoff();
  if (guestRegisterBackoffUntilMs <= Date.now()) {
    guestRegisterBackoffUntilMs = 0;
    return false;
  }
  return true;
}

function setGuestRegisterBackoff(): void {
  guestRegisterBackoffUntilMs = Date.now() + GUEST_REGISTER_BACKOFF_MS;
}

/** Clears retry backoff (e.g. after logout so a fresh guest attempt can run). */
export function clearGuestRegisterBackoff(): void {
  guestRegisterBackoffUntilMs = 0;
  purgeLegacyGuestRegisterSessionBackoff();
}

/** Thrown when the API rejects `deviceId` as already registered (recover with a fresh device id). */
export class GuestDeviceAlreadyRegisteredError extends Error {
  readonly code = "GUEST_DEVICE_ALREADY_REGISTERED" as const;
  constructor(message = "Guest device id already registered") {
    super(message);
    this.name = "GuestDeviceAlreadyRegisteredError";
  }
}

function isGuestDeviceAlreadyRegisteredError(e: unknown): boolean {
  if (e instanceof GuestDeviceAlreadyRegisteredError) return true;
  if (typeof e !== "object" || e === null) return false;
  const rec = e as { name?: string; code?: string };
  return (
    rec.name === "GuestDeviceAlreadyRegisteredError" ||
    rec.code === "GUEST_DEVICE_ALREADY_REGISTERED"
  );
}

/**
 * Registers a guest without throwing: timeouts, bad payloads, and network errors return `null`.
 * Applies backoff after failures to reduce load when the API is down.
 */
export async function tryRegisterGuestClient(options?: {
  timeoutMs?: number;
}): Promise<GuestRegisterResponse | null> {
  if (typeof window === "undefined") return null;
  purgeLegacyGuestRegisterSessionBackoff();

  const existingToken = Cookies.get("token")?.trim();
  if (existingToken) return null;

  clearStaleGuestMarkersWithoutToken();

  if (isGuestRegisterInBackoff()) return null;

  const timeoutMs = options?.timeoutMs ?? GUEST_REGISTER_BEST_EFFORT_TIMEOUT_MS;

  try {
    return await registerGuestClient({ timeoutMs });
  } catch (e) {
    if (isGuestDeviceAlreadyRegisteredError(e)) {
      console.warn(
        "[guest] device conflict after internal retries; browsing without guest token:",
        e,
      );
      /** Do not use register backoff here — it would block all guest POSTs for 10m with no token. */
      return null;
    }
    console.warn("[guest] registration unavailable; browsing without guest token:", e);
    setGuestRegisterBackoff();
    return null;
  }
}

/**
 * Ensures a guest session exists when there is no `token` cookie (anonymous visitor).
 * Idempotent; dedupes concurrent calls. Never throws; site works without a token if the API fails.
 */
export function ensureGuestSessionIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (Cookies.get("token")?.trim()) return Promise.resolve();

  if (guestEnsureInFlight) return guestEnsureInFlight;

  guestEnsureInFlight = (async () => {
    try {
      if (Cookies.get("token")?.trim()) return;
      const data = await tryRegisterGuestClient();
      if (data) persistGuestAuthCookies(data);
    } catch (e) {
      console.error("ensureGuestSessionIfNeeded:", e);
    }
  })();

  void guestEnsureInFlight.finally(() => {
    guestEnsureInFlight = null;
  });

  return guestEnsureInFlight;
}

/** Placeholder push/FCM token in request body; replace via NEXT_PUBLIC_GUEST_REGISTER_BODY_TOKEN when ready. */
const GUEST_REGISTER_BODY_TOKEN =
  process.env.NEXT_PUBLIC_GUEST_REGISTER_BODY_TOKEN ?? "12349";

export type GuestRegisterCustomer = {
  uuid: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  role: string;
  deviceId?: string;
};

export type GuestRegisterResponse = {
  token: string;
  customer: GuestRegisterCustomer;
};

/** 32 hex chars (UUID v4 shape without hyphens); works when `randomUUID` is missing (older browsers / some WebViews). */
function createGuestIdSuffix(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: Crypto }).crypto
      : undefined;

  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID().replace(/-/g, "");
  }

  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now().toString(16)}${Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;
}

/** Stable per-browser id: `guest_id` + uuid (no hyphens), persisted in localStorage. */
export function getOrCreateGuestDeviceId(): string {
  if (typeof window === "undefined") return "";
  let deviceId = localStorage.getItem(GUEST_DEVICE_STORAGE_KEY);
  if (!deviceId) {
    const fromCookie = Cookies.get(GUEST_DEVICE_COOKIE_NAME);
    if (fromCookie) {
      localStorage.setItem(GUEST_DEVICE_STORAGE_KEY, fromCookie);
      deviceId = fromCookie;
    }
  }
  if (!deviceId) {
    deviceId = `guest_id${createGuestIdSuffix()}`;
    localStorage.setItem(GUEST_DEVICE_STORAGE_KEY, deviceId);
  }
  return deviceId;
}

function unwrapGuestPayload(raw: unknown): GuestRegisterResponse & {
  message?: string;
  error?: string | { message?: string };
} {
  const root =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const inner = root.data && typeof root.data === "object" ? root.data : root;
  return inner as GuestRegisterResponse & {
    message?: string;
    error?: string | { message?: string };
  };
}

/** Parse when possible; used for error bodies so device-conflict handling still runs. */
function parseGuestRegisterJsonLenient(raw: string): unknown | null {
  const trimmed = raw.trimStart();
  if (!trimmed || trimmed.startsWith("<")) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

const GUEST_REGISTER_DEVICE_CONFLICT_MAX_ATTEMPTS = 3;

export async function registerGuestClient(options?: {
  timeoutMs?: number;
}): Promise<GuestRegisterResponse> {
  let lastErr: Error | null = null;

  for (let i = 0; i < GUEST_REGISTER_DEVICE_CONFLICT_MAX_ATTEMPTS; i++) {
    const deviceId = getOrCreateGuestDeviceId();
    if (!deviceId) {
      throw new Error("Unable to create guest device id");
    }

    const res = await apiFetch(API_ENDPOINTS.AUTH_GUEST_REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        token: GUEST_REGISTER_BODY_TOKEN,
      }),
      ...(options?.timeoutMs != null ? { timeoutMs: options.timeoutMs } : {}),
    });

    const bodyText = await res.text();
    const parsed = parseGuestRegisterJsonLenient(bodyText);
    const data =
      parsed != null
        ? unwrapGuestPayload(parsed)
        : ({} as ReturnType<typeof unwrapGuestPayload>);

    const conflict =
      guestPayloadHasDeviceConflict(parsed, bodyText) &&
      (!res.ok || !data?.token);

    if (conflict) {
      clearGuestDeviceIdentity();
      lastErr = new GuestDeviceAlreadyRegisteredError();
      continue;
    }

    if (!res.ok) {
      const errMsg =
        data?.message ||
        (typeof data?.error === "string" ? data.error : data?.error?.message) ||
        bodyText.trim().slice(0, 200) ||
        "Guest registration failed";
      throw new Error(`Guest registration failed (HTTP ${res.status}): ${errMsg}`);
    }

    if (parsed == null) {
      throw new Error(
        `Guest registration returned non-JSON (HTTP ${res.status}): ${bodyText.slice(0, 160).replace(/\s+/g, " ")}`,
      );
    }

    if (!data?.token || !data?.customer?.uuid) {
      throw new Error(
        `Invalid guest registration response (HTTP ${res.status}): missing token or customer.uuid`,
      );
    }

    return data;
  }

  throw lastErr ?? new GuestDeviceAlreadyRegisteredError();
}

export function persistGuestAuthCookies(data: GuestRegisterResponse): void {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const opts = {
    expires: 7,
    path: "/" as const,
    sameSite: "Lax" as const,
    ...(isSecure ? { secure: true as const } : {}),
  };

  const { customer } = data;
  if (typeof window !== "undefined" && customer.deviceId) {
    localStorage.setItem(GUEST_DEVICE_STORAGE_KEY, customer.deviceId);
  }
  Cookies.set("token", data.token, opts);
  Cookies.set("id", customer.uuid, opts);
  Cookies.set("email", customer.emailAddress, opts);
  Cookies.set("fullName", customer.fullName, opts);
  Cookies.set("phone", customer.phoneNumber, opts);
  const roleVal = String(customer.role ?? "").trim();
  if (roleVal) Cookies.set("role", roleVal, opts);
  else Cookies.remove("role", { path: "/" });
  Cookies.set("loginType", "guest", opts);
  Cookies.set("auth_method", "guest", opts);
  if (customer.deviceId) {
    Cookies.set(GUEST_DEVICE_COOKIE_NAME, customer.deviceId, opts);
  }
  notifySessionUpdated();
}

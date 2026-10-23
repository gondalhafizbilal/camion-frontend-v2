import Cookies from "js-cookie";
import { isGuestSession } from "@/lib/auth/isGuestClient";
import { readStoredCurrencyCode } from "@/lib/currency/currencyStorage";
import { getOrCreateGuestDeviceId } from "@/services/auth/guestRegister";
import { fetchCachedIpCountryCode } from "@/services/geo/fetchIpCountryCode";

const SESSION_ID_KEY = "camion_gtm_session_id";
const ATTRIBUTION_KEY = "camion_gtm_attribution_v1";
const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const ATTRIBUTION_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "campaign_id",
  "adset_id",
  "creative_id",
  "gclid",
  "fbclid",
] as const;

type AttributionKey = (typeof ATTRIBUTION_QUERY_KEYS)[number];
type AttributionContext = Partial<Record<AttributionKey, string>>;

let cachedCountry: string | null = null;

function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY)?.trim();
    if (existing) return existing;
    const id = createId();
    sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return createId();
  }
}

function readAttribution(): AttributionContext {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as {
        capturedAt?: number;
        values?: AttributionContext;
      };
      if (
        Number.isFinite(stored.capturedAt) &&
        Date.now() - Number(stored.capturedAt) <= ATTRIBUTION_TTL_MS
      ) {
        return stored.values ?? {};
      }
      localStorage.removeItem(ATTRIBUTION_KEY);
    }

    const searchParams = new URLSearchParams(window.location.search);
    const values: AttributionContext = {};
    for (const key of ATTRIBUTION_QUERY_KEYS) {
      const value = searchParams.get(key)?.trim();
      if (value) values[key] = value.slice(0, 250);
    }
    if (Object.keys(values).length) {
      localStorage.setItem(
        ATTRIBUTION_KEY,
        JSON.stringify({ capturedAt: Date.now(), values }),
      );
    }
    return values;
  } catch {
    return {};
  }
}

function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  const userAgent = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
}

function readLanguage(): string {
  const language = document.documentElement.lang?.trim().toLowerCase();
  return language === "ar" ? "ar" : "en";
}

function readAnonymousId(): string | undefined {
  try {
    return getOrCreateGuestDeviceId() || undefined;
  } catch {
    return undefined;
  }
}

function readAuthenticatedUserId(): string | undefined {
  if (isGuestSession()) return undefined;
  const userId = Cookies.get("id")?.trim();
  return userId || undefined;
}

export function createGtmEventContext(): Record<string, unknown> {
  try {
    if (typeof window === "undefined") return { platform: "web" };

    return {
      platform: "web",
      event_id: createId(),
      anonymous_id: readAnonymousId(),
      user_id: readAuthenticatedUserId(),
      session_id: readOrCreateSessionId(),
      device_type: detectDeviceType(),
      language: readLanguage(),
      country: cachedCountry || undefined,
      currency: readStoredCurrencyCode() || "QAR",
      ...readAttribution(),
    };
  } catch {
    return { platform: "web" };
  }
}

/** Warms the optional IP country field without delaying event pushes. */
export function warmGtmCountryContext(): void {
  if (typeof window === "undefined" || cachedCountry) return;
  void fetchCachedIpCountryCode()
    .then((country) => {
      cachedCountry = country;
    })
    .catch(() => {
      /* Optional context only; never affect page behavior. */
    });
}

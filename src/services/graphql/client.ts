import { API_ENDPOINTS, BASE_URL_AUTH } from "@/services/api/api";
import { extractResponseErrorMessage } from "@/services/api/parseApiErrorResponse";
import { isAbortError } from "@/types/errors";

export type GraphQLRequestBody = {
  query: string;
  operationName?: string;
  variables?: Record<string, unknown>;
};

export type GraphQLErrorItem = {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
};

export type GraphQLResponse<T> = {
  data?: T | null;
  errors?: GraphQLErrorItem[];
};

const DEFAULT_GRAPHQL_TIMEOUT_MS = 45_000;

export type GraphQLRequestOptions = {
  /** Bearer token (customer/guest) forwarded to the API. */
  authToken?: string | null;
  signal?: AbortSignal;
  /** Max wait for the HTTP round-trip; avoids hanging SSR/client on a stuck upstream. */
  timeoutMs?: number;
  /**
   * When true, GraphQL `errors` do not throw if `data` is present (partial success).
   * If there are errors and no usable `data`, returns `null`.
   */
  allowErrors?: boolean;
  /**
   * Set to `true` when the handler returns `null` specifically due to auth-only GraphQL/HTTP
   * errors with no usable `data` (invalid/expired token). Not set for network/502/null-body nulls.
   */
  authFailureOut?: { value: boolean };
  /** When the request returns `null`, populated from GraphQL/REST error payloads when available. */
  errorMessageOut?: { value: string | null };
  /**
   * Server-only: persist successful responses in the Next.js Data Cache.
   * Do not use for authenticated / per-user operations.
   */
  nextCache?: { revalidate: number | false; tags?: string[] };
};

function gqlExtensionsCode(e: GraphQLErrorItem): string {
  return String(e.extensions?.code ?? "").toUpperCase();
}

/** True when every entry looks like an auth failure (invalid/missing token, etc.). */
export function graphqlErrorsAreOnlyAuthFailures(
  errors: GraphQLErrorItem[] | undefined,
): boolean {
  if (!errors?.length) return false;
  return errors.every((e) => {
    const code = gqlExtensionsCode(e);
    if (
      code === "UNAUTHENTICATED" ||
      code === "UNAUTHORIZED" ||
      code === "FORBIDDEN"
    ) {
      return true;
    }
    const msg = (e.message ?? "").toLowerCase();
    return (
      msg.includes("unauthorized") ||
      msg.includes("unauthenticated") ||
      msg.includes("forbidden") ||
      msg.includes("not authenticated") ||
      msg.includes("access denied")
    );
  });
}

function gqlHasNoUsableData(data: unknown): boolean {
  return data === undefined || data === null;
}

function captureResponseError(
  out: { value: string | null } | undefined,
  payload: unknown,
): void {
  if (!out) return;
  const msg = extractResponseErrorMessage(payload);
  if (msg) out.value = msg;
}

function graphqlRequestUrl(): string {
  const path = API_ENDPOINTS.GRAPHQL;
  if (typeof window !== "undefined") {
    return path;
  }
  const apiBase = (BASE_URL_AUTH ?? "").replace(/\/$/, "");
  if (apiBase) {
    return `${apiBase}/graphql`;
  }
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${site}${path}`;
}

/**
 * POST GraphQL through the same-origin `/api/upstream/graphql` proxy.
 * Returns `null` when the response is unusable (parse failure, HTTP error without recoverable body, or
 * **auth-only** GraphQL errors with no `data`) so callers can substitute empty UI state.
 */
function combineAbortSignals(
  timeoutSignal: AbortSignal,
  user?: AbortSignal | null,
): AbortSignal {
  if (!user) return timeoutSignal;
  try {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
      return AbortSignal.any([user, timeoutSignal]);
    }
  } catch {
    /* ignore */
  }
  return timeoutSignal;
}

export async function graphqlRequest<T>(
  body: GraphQLRequestBody,
  options: GraphQLRequestOptions = {},
): Promise<T | null> {
  const allowErrors = options.allowErrors === true;
  const authFailureOut = options.authFailureOut;
  const errorMessageOut = options.errorMessageOut;
  const timeoutMs = options.timeoutMs ?? DEFAULT_GRAPHQL_TIMEOUT_MS;
  const isServer = typeof window === "undefined";
  const nextCache = isServer ? options.nextCache : undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }

  const timeoutCtl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtl.abort(), timeoutMs);
  const signal = combineAbortSignals(timeoutCtl.signal, options.signal ?? null);

  let res: Response;
  try {
    res = await fetch(graphqlRequestUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      ...(nextCache
        ? { next: { revalidate: nextCache.revalidate, tags: nextCache.tags } }
        : { cache: "no-store" as const }),
      signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (isAbortError(e)) {
      console.warn(
        `[graphql] aborted or exceeded ${timeoutMs}ms (${body.operationName ?? "unnamed"}); returning null.`,
      );
      return null;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `[graphql] fetch failed (${body.operationName ?? "unnamed"}): ${msg}; returning null.`,
    );
    return null;
  }
  clearTimeout(timeoutId);

  const raw = await res.text();
  const trimmed = raw.trimStart();
  if (!trimmed || trimmed.startsWith("<")) {
    if (allowErrors) {
      console.warn(
        `GraphQL returned HTML or empty body (HTTP ${res.status}); returning null.`,
      );
      return null;
    }
    throw new Error(
      `GraphQL returned HTML or empty body (HTTP ${res.status}). Often means auth is required before the first response, or the URL is wrong. Preview: ${raw.slice(0, 180).replace(/\s+/g, " ")}`,
    );
  }

  let json: GraphQLResponse<T>;
  try {
    json = JSON.parse(raw) as GraphQLResponse<T>;
  } catch {
    if (allowErrors) {
      console.warn(
        `GraphQL response is not JSON (HTTP ${res.status}); returning null.`,
      );
      return null;
    }
    throw new Error(
      `GraphQL response is not JSON (HTTP ${res.status}): ${raw.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    const msg =
      extractResponseErrorMessage(json) ||
      json.errors?.map((e) => e.message).join("; ") ||
      `GraphQL request failed (${res.status})`;
    if (allowErrors) {
      console.warn(`GraphQL HTTP ${res.status} (non-fatal): ${msg}`);
      captureResponseError(errorMessageOut, json);
      return null;
    }
    if (
      json.errors?.length &&
      graphqlErrorsAreOnlyAuthFailures(json.errors) &&
      gqlHasNoUsableData(json.data)
    ) {
      console.warn(`[graphql] HTTP ${res.status} auth-only errors (non-fatal): ${msg}`);
      if (authFailureOut) authFailureOut.value = true;
      captureResponseError(errorMessageOut, json);
      return null;
    }
    /** Proxy/upstream errors (502 JSON, gateway timeouts) — empty UI instead of throwing. */
    if (res.status >= 500 || res.status === 408) {
      console.warn(`[graphql] HTTP ${res.status} upstream/proxy (non-fatal): ${msg}`);
      captureResponseError(errorMessageOut, json);
      return null;
    }
    throw new Error(msg);
  }

  if (json.errors?.length) {
    const msg =
      extractResponseErrorMessage(json) ||
      json.errors.map((e) => e.message).join("; ");

    if (
      graphqlErrorsAreOnlyAuthFailures(json.errors) &&
      gqlHasNoUsableData(json.data)
    ) {
      console.warn(`[graphql] auth-only GraphQL errors, no data (non-fatal): ${msg}`);
      if (authFailureOut) authFailureOut.value = true;
      captureResponseError(errorMessageOut, json);
      return null;
    }

    if (allowErrors) {
      console.warn(`GraphQL errors (non-fatal): ${msg}`);
      if (gqlHasNoUsableData(json.data)) {
        captureResponseError(errorMessageOut, json);
        return null;
      }
      return json.data as T;
    }
    throw new Error(msg);
  }

  if (gqlHasNoUsableData(json.data)) {
    if (allowErrors) {
      return null;
    }
    throw new Error("GraphQL response missing data");
  }

  return json.data as T;
}

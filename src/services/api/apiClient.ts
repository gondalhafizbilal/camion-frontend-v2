import { RequestTimeoutError, isAbortError } from "@/types/errors";

const REQUEST_TIMEOUT = 20_000;

type LoaderFn = (() => void) | null;

let loaderContext: { startFetch: LoaderFn; endFetch: LoaderFn } = {
  startFetch: null,
  endFetch: null,
};

/** Called from {@link useApiLoader} to wire global loading indicators. */
export function setLoaderContext(
  startFetch: () => void,
  endFetch: () => void,
): void {
  loaderContext = { startFetch, endFetch };
}

function createTimeoutSignal(
  timeoutMs: number,
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

export type ApiFetchInit = RequestInit & {
  timeoutMs?: number;
};

/**
 * Browser `fetch` with optional timeout and global loader hooks.
 * No automatic headers — pass whatever the API expects (e.g. Authorization, Content-Type).
 */
export async function apiFetch(
  input: RequestInfo | URL,
  options: ApiFetchInit = {},
): Promise<Response> {
  const { timeoutMs = REQUEST_TIMEOUT, ...fetchInit } = options;

  loaderContext.startFetch?.();

  const { signal: timeoutSignal, clear: clearTimeoutForRequest } =
    createTimeoutSignal(timeoutMs);

  const signal = fetchInit.signal
    ? AbortSignal.any([fetchInit.signal, timeoutSignal])
    : timeoutSignal;

  try {
    const response = await fetch(input, {
      ...fetchInit,
      signal,
    });
    clearTimeoutForRequest();
    return response;
  } catch (error: unknown) {
    clearTimeoutForRequest();

    if (isAbortError(error)) {
      throw new RequestTimeoutError(
        "Request timeout: Service took too long to respond. Please try again later.",
      );
    }

    throw error;
  } finally {
    loaderContext.endFetch?.();
  }
}

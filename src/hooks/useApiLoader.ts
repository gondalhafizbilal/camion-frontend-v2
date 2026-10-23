import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useApiLoading } from "@/componentsedit/context/ApiLoadingContext";
import { toast } from "@/componentsedit/toast";
import {
  apiFetch,
  setLoaderContext,
  type ApiFetchInit,
} from "@/services/api/apiClient";
import { RequestTimeoutError } from "@/types/errors";

function isTimeoutLike(error: unknown): boolean {
  if (error instanceof RequestTimeoutError) return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "isTimeout" in error &&
    (error as { isTimeout?: boolean }).isTimeout === true
  );
}

function isNetworkLike(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "isNetworkError" in error &&
    (error as { isNetworkError?: boolean }).isNetworkError === true
  ) {
    return true;
  }
  return error instanceof TypeError && error.message.includes("fetch");
}

export function useApiLoader(): (
  input: RequestInfo | URL,
  init?: ApiFetchInit,
) => Promise<Response> {
  const { startFetch, endFetch } = useApiLoading();
  const t = useTranslations();

  useEffect(() => {
    setLoaderContext(startFetch, endFetch);
  }, [startFetch, endFetch]);

  return useCallback(
    async (url: RequestInfo | URL, options: ApiFetchInit = {}) => {
      startFetch();
      try {
        const response = await apiFetch(url, options);

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status} for ${String(url)}`);
        }

        return response;
      } catch (error: unknown) {
        if (isTimeoutLike(error)) {
          const errorMessage =
            error instanceof Error && String(error.message ?? "").trim()
              ? error.message
              : t("toastRequestTimeoutDefault");

          toast.error(errorMessage, {
            position: "top-center",
            autoClose: 5000,
          });

          throw error;
        }

        if (isNetworkLike(error)) {
          const networkMessage =
            error instanceof Error && String(error.message ?? "").trim()
              ? error.message
              : t("toastNetworkErrorDefault");

          toast.error(networkMessage, {
            position: "top-center",
            autoClose: 5000,
          });

          throw error;
        }

        console.error("Fetch error:", error);

        const err = error instanceof Error ? error : null;
        const legacyTimeout =
          err && "isTimeout" in err && (err as { isTimeout?: boolean }).isTimeout;
        const legacyNetwork =
          err &&
          "isNetworkError" in err &&
          (err as { isNetworkError?: boolean }).isNetworkError;

        if (!legacyTimeout && !legacyNetwork) {
          toast.error(
            (err && String(err.message ?? "").trim()) || t("toastGenericFetchError"),
            {
              position: "top-center",
              autoClose: 5000,
            },
          );
        }

        throw error;
      } finally {
        endFetch();
      }
    },
    [startFetch, endFetch, t],
  );
}

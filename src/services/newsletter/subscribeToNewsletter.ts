import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";

export type NewsletterSubscribeResult = { success: true };

export class NewsletterInvalidEmailError extends Error {
  override name = "NewsletterInvalidEmailError";
}

type NewsletterErrorResponse = {
  statusCode?: number;
  message?: string[] | string;
  error?: string;
  errors?: Record<string, string>;
};

type NewsletterSuccessResponse = {
  success?: boolean;
};

function includesInvalidEmailMessage(message: NewsletterErrorResponse["message"]): boolean {
  if (!message) return false;
  const parts = Array.isArray(message) ? message : [message];
  return parts.some((m) => String(m).toLowerCase().includes("must be an email"));
}

function includesInvalidEmailFieldError(errors: NewsletterErrorResponse["errors"]): boolean {
  const msg = errors?.emailAddress;
  if (!msg) return false;
  const s = String(msg).toLowerCase();
  return s.includes("must be an email") || s.includes("should not be empty");
}

export async function subscribeToNewsletter(
  emailAddress: string,
): Promise<NewsletterSubscribeResult> {
  const response = await apiFetch(API_ENDPOINTS.NEWS_LETTER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailAddress }),
  });

  if (response.ok) {
    const data = (await response.json().catch(() => ({}))) as NewsletterSuccessResponse;
    if (data?.success === false) {
      throw new Error("Newsletter subscription failed.");
    }
    return { success: true };
  }

  const err = (await response.json().catch(() => ({}))) as NewsletterErrorResponse;
  if (response.status === 400 && (includesInvalidEmailMessage(err.message) || includesInvalidEmailFieldError(err.errors))) {
    throw new NewsletterInvalidEmailError("Invalid email address.");
  }

  throw new Error("Newsletter subscription failed.");
}


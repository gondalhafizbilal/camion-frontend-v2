/**
 * Main API base for chatbot REST routes (server-only: CHATBOT_UPSTREAM_BASE).
 * e.g. POST `{ "token": "<jwt>" }` → `/v1/chatbot/sessions`.
 * Used by App Router API proxies under /api/chatbot-proxy/*.
 */
export const CHATBOT_UPSTREAM_BASE =
  process.env.CHATBOT_UPSTREAM_BASE ?? "https://chatbot.dev.camiontrading.com";

"use client";

/**
 * Logs when SSR home data is empty. Intentionally does not call `router.refresh()` —
 * under load, refresh storms amplified p95 latency (every empty response re-ran full SSR).
 */
export function HomeEmptyRecovery({ trigger }: { trigger: boolean }) {
  if (!trigger) return null;

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[home] SSR catalog payload empty — check HOME_SSR_GRAPHQL_TOKEN / guest register / upstream GraphQL",
    );
  }

  return null;
}

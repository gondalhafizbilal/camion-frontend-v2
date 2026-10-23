import { notFound } from "next/navigation";

/**
 * Unknown paths under `/[locale]/…` do not hit `not-found.jsx` unless something
 * calls `notFound()` (Next.js + next-intl behavior). This catch-all runs only
 * when no more specific sibling route matched (e.g. `/en/no-such-page`).
 *
 * @see https://next-intl.dev/docs/environments/error-files
 */
export default function CatchAllUnknownLocaleRoute() {
  notFound();
}

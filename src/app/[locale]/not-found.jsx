"use client";

/**
 * Next.js `not-found` UI for the `[locale]` segment: any unknown path under
 * `/en/*` or `/ar/*`, invalid locale (via layout `notFound()`), and `notFound()` from pages.
 */
import RootLayout from "@/componentsedit/layout/RootLayout";
import NotFoundCenterContent from "./404/_components/NotFoundCenterContent";

export default function NotFound() {
  return (
    <RootLayout>
      <NotFoundCenterContent />
    </RootLayout>
  );
}


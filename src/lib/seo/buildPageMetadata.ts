import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { absoluteLocaleUrl, getSiteUrl, localePath } from "./siteUrl";

const DEFAULT_LOCALE = routing.defaultLocale;

export type BuildPageMetadataInput = {
  locale: string;
  /** Path without locale prefix, e.g. `shop/foo` or `` for home. */
  path?: string;
  title: string;
  description: string;
  images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
  type?: "website" | "article";
  /** Extra openGraph fields (merged). */
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
  robots?: Metadata["robots"];
};

/** Canonical for the current locale; hreflang for all locales (`x-default` → defaultLocale). */
export function buildPageAlternates(
  locale: string,
  path = "",
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = localePath(loc, path);
  }
  languages["x-default"] = localePath(DEFAULT_LOCALE, path);
  return {
    canonical: localePath(locale, path),
    languages,
  };
}

export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
  images,
  type = "website",
  openGraph,
  twitter,
  robots,
}: BuildPageMetadataInput): Metadata {
  const pageUrl = absoluteLocaleUrl(locale, path);
  const ogLocale = locale === "ar" ? "ar_AR" : "en_US";
  const fallbackImageUrl = `${getSiteUrl()}/assets/icons/logo-light.svg`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: buildPageAlternates(locale, path),
    robots,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type,
      locale: ogLocale,
      siteName: "Camion Store",
      images: images?.length
        ? images
        : [
            {
              url: fallbackImageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ],
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.length
        ? images.map((img) => img.url)
        : [fallbackImageUrl],
      site: "@camionstore",
      creator: "@camionstore",
      ...twitter,
    },
  };
}

/** Strip HTML and truncate for meta description. */
export function plainTextDescription(
  htmlOrText: string | null | undefined,
  max = 160,
): string {
  const plain = String(htmlOrText ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trimEnd()}…`;
}

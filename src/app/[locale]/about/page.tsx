import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";
import AboutPageClient from "./AboutPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return buildPageMetadata({
    locale,
    path: "about",
    title: t("seoAboutTitle"),
    description: t("seoAboutDescription"),
  });
}

export default function AboutPage() {
  return <AboutPageClient />;
}

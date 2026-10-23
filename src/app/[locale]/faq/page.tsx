import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";
import FaqPageClient from "./FaqPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return buildPageMetadata({
    locale,
    path: "faq",
    title: t("seoFaqTitle"),
    description: t("seoFaqDescription"),
  });
}

export default function FAQPage() {
  return <FaqPageClient />;
}

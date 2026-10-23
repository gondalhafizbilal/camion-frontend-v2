import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";
import ContactPageClient from "./ContactPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return buildPageMetadata({
    locale,
    path: "contact",
    title: t("seoContactTitle"),
    description: t("seoContactDescription"),
  });
}

export default function ContactPage() {
  return <ContactPageClient />;
}

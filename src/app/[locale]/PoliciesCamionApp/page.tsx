import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";
import PoliciesCamionAppContent from "./PoliciesCamionAppContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return buildPageMetadata({
    locale,
    path: "PoliciesCamionApp",
    title: t("seoPoliciesTitle"),
    description: t("seoPoliciesDescription"),
  });
}

export default function PoliciesRoutePage() {
  return <PoliciesCamionAppContent variant="page" />;
}

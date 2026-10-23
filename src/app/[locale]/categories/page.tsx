import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Categories from "./_components/Categories";
import Header from "@/componentsedit/layout/header/header";
import Footer from "@/componentsedit/layout/footer/footer";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return buildPageMetadata({
    locale,
    path: "categories",
    title: t("seoCategoriesTitle"),
    description: t("seoCategoriesDescription"),
  });
}

function CategoriesAll() {
  return (
    <div className="overflow-hidden bg-white">
      <Header />
      <Categories />
      <Footer />
    </div>
  );
}

export default CategoriesAll;

import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import AllProduct from "./_components/allProdect";
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
    path: "shop",
    title: t("seoShopTitle"),
    description: t("seoShopDescription"),
  });
}

function Product() {
  return (
    <div className="overflow-hidden bg-white">
      <Header />
      <Suspense
        fallback={<div className="min-h-[50vh] w-full mt-16" aria-hidden />}
      >
        <AllProduct />
      </Suspense>
      <Footer />
    </div>
  );
}

export default Product;

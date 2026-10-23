import type { Metadata } from "next";
import CategoriesProdect from "./_components/CategoriesProdect";
import Header from "@/componentsedit/layout/header/header";
import Footer from "@/componentsedit/layout/footer/footer";
import { loadCategoryPageGraphql } from "./_lib/loadCategoryPage";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";

type CategoryPageParams = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const path = `categories/${slug}`;

  try {
    const payload = await loadCategoryPageGraphql(locale, slug);
    const name =
      payload?.categoryName ||
      decodeURIComponent(slug).replace(/-/g, " ");
    const isAr = locale === "ar";
    return buildPageMetadata({
      locale,
      path,
      title: isAr ? `${name} | متجر كاميون` : `${name} | Camion Store`,
      description: isAr
        ? `تسوق منتجات ${name} من متجر كاميون. اكتشف مجموعة مختارة بأسعار تنافسية مع توصيل سريع.`
        : `Shop ${name} products at Camion Store. Browse curated items at competitive prices with fast delivery.`,
    });
  } catch {
    return buildPageMetadata({
      locale,
      path,
      title: locale === "ar" ? "فئة | متجر كاميون" : "Category | Camion Store",
      description:
        locale === "ar"
          ? "تصفح منتجات الفئة في متجر كاميون."
          : "Browse category products at Camion Store.",
    });
  }
}

export default async function CategoriesProduct({
  params,
}: {
  params: Promise<CategoryPageParams>;
}) {
  const { locale, slug } = await params;
  const payload = await loadCategoryPageGraphql(locale, slug).catch((e) => {
    console.error("Category page fetch error:", e);
    return null;
  });

  return (
    <div>
      <Header />
      <CategoriesProdect
        categories={[]}
        initialCategoryName={payload?.categoryName}
        initialProducts={payload?.products}
        initialHasMore={payload?.hasMore}
      />
      <Footer />
    </div>
  );
}

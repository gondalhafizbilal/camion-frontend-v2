import type { Metadata } from "next";
import RootLayout from "@/componentsedit/layout/RootLayout";
import ProductDetailsCenterContent from "./_components/ProductDetailsCenterContent";
import { loadShopProductGraphql } from "./_lib/loadShopProduct";
import { buildPageMetadata, plainTextDescription } from "@/lib/seo/buildPageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
} from "@/lib/seo/productJsonLd";

type ShopProductPageParams = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<ShopProductPageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const path = `shop/${slug}`;

  try {
    const payload = await loadShopProductGraphql(locale, slug);
    if (!payload) {
      return buildPageMetadata({
        locale,
        path,
        title: "Product",
        description: "Camion Store product",
      });
    }

    const { product, productName } = payload;
    const siteUrl = getSiteUrl();
    const images =
      product?.images?.map((img) => img.src).filter(Boolean) as string[];
    const mainImage = images[0] || `${siteUrl}/assets/icons/logo-light.svg`;
    const description = plainTextDescription(
      product?.short_description || product?.description,
    );

    return buildPageMetadata({
      locale,
      path,
      title: productName || "Product",
      description,
      images: [
        {
          url: mainImage,
          width: 1200,
          height: 630,
          alt: productName || "Product Image",
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching product metadata:", error);
    return buildPageMetadata({
      locale,
      path,
      title: "Product",
      description: "Camion Store product",
    });
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<ShopProductPageParams>;
}) {
  const { locale, slug } = await params;
  const payload = await loadShopProductGraphql(locale, slug).catch((e) => {
    console.error("Product fetch error:", e);
    return null;
  });

  const productJsonLd =
    payload?.product != null
      ? buildProductJsonLd({
          locale,
          slug,
          product: payload.product,
          productName: payload.productName,
          rating: payload.initialRating,
        })
      : null;

  const breadcrumbJsonLd = payload
    ? buildProductBreadcrumbJsonLd({
        locale,
        slug,
        productName: payload.productName,
        categoryName: payload.categoryName,
        categorySlug: payload.categorySlug,
      })
    : null;

  return (
    <RootLayout>
      {productJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      ) : null}
      {breadcrumbJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />
      ) : null}
      <ProductDetailsCenterContent
        slug={slug}
        productName={payload?.productName}
        categoryName={payload?.categoryName ?? undefined}
        categorySlug={payload?.categorySlug ?? undefined}
        product={payload?.product ?? null}
        initialRating={payload?.initialRating}
        initialReviewRows={payload?.reviewRows}
      />
    </RootLayout>
  );
}

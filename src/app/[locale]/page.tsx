import Footer from "@/componentsedit/layout/footer/footer";
import Header from "@/componentsedit/layout/header/header";
// import StoryServer from "./_components/StoryServer";

import HomeHeroSlider from "@/componentsedit/home/HomeHeroSlider";
import HotDealsBanner from "@/componentsedit/home/HotDealsBanner";
import ThisMonthSection from "@/componentsedit/home/ThisMonthSection";
import HomeAllProductsSection from "@/componentsedit/home/HomeAllProductsSection";
import ServicesSection from "@/componentsedit/home/ServicesSection";
import FeaturedCampaignSection from "@/componentsedit/home/FeaturedCampaignSection";
import PopularProductsSection from "@/componentsedit/home/PopularProductsSection";
import TopProductsSection from "@/componentsedit/home/TopProductsSection";
import SectionDividerLine from "@/componentsedit/home/SectionDividerLine";
import {
  isHomeGraphqlPayloadEmpty,
  loadHomeGraphqlData,
} from "./_lib/loadHomeGraphqlData";
import { HomeEmptyRecovery } from "./_components/HomeEmptyRecovery";
import { gqlBannersToHeroSlides } from "@/services/graphql/mappers/gqlBannersToHeroSlides";
import { gqlBannersToHotDealBanners } from "@/services/graphql/mappers/gqlBannersToHotDeal";
import { gqlProductToCarouselProduct } from "@/services/graphql/mappers/gqlProductToCarousel";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";
// import { gqlStoriesToStoryRecords } from "@/services/graphql/mappers/gqlStoriesToRecords";

/**
 * ISR: regenerate home HTML (default 5m). Must be a literal for Next.js static analysis.
 * Keep in sync with `HOME_PAGE_ISR_REVALIDATE_SECONDS` / `HOME_GRAPHQL_REVALIDATE_SECONDS` in env.
 */
export const revalidate = 300;

// function StoryLoading() {
//   return <div className="w-full h-24 bg-gray-100 rounded-xl animate-pulse" />;
// }

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: "Home - Camion Store | High-Quality Products at Great Prices",
    ar: "الرئيسية - متجر كاميون | منتجات عالية الجودة بأسعار رائعة",
  };

  const descriptions: Record<string, string> = {
    en: "Discover Camion Store's homepage featuring trending products, exclusive deals, and curated categories. Shop with confidence for quality items at unbeatable prices.",
    ar: "اكتشف الصفحة الرئيسية لمتجر كاميون مع المنتجات الرائجة والعروض الحصرية والفئات المنسقة. تسوق بثقة للحصول على منتجات عالية الجودة بأسعار لا تقبل المنافسة.",
  };

  return buildPageMetadata({
    locale,
    path: "",
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  /** SSR catalog uses QAR; client carousels refetch when the user changes currency. */
  const data = await loadHomeGraphqlData(locale, "QAR");

  // const storyRecords = gqlStoriesToStoryRecords(data.stories ?? []);
  const heroSlides = gqlBannersToHeroSlides(data.banners ?? []);
  const hotDealBanners = gqlBannersToHotDealBanners(data.banners ?? []);
  const featuredCampaignCarousel = (data.featuredCampaignProducts ?? []).map(
    gqlProductToCarouselProduct,
  );
  const popularCarousel = (data.popularProducts ?? []).map(gqlProductToCarouselProduct);
  const featuredCarousel = (data.featuredProducts ?? []).map(gqlProductToCarouselProduct);
  const thisMonthCarousel = (data.thisMonthProducts ?? []).map(gqlProductToCarouselProduct);
  const allProductsCarousel = (data.allProducts ?? []).map(gqlProductToCarouselProduct);
  const homeDataEmpty = isHomeGraphqlPayloadEmpty(data);

  return (
    <div className="bg-white overflow-x-hidden">
      <HomeEmptyRecovery trigger={homeDataEmpty} />
      <Header />

      <main id="main-content">
        {/* Stories disabled — see STORIES_ENABLED in lib/features/storiesEnabled.ts */}
        {/* {storyRecords.length > 0 && (
          <Suspense fallback={<StoryLoading />}>
            <StoryServer initialStories={storyRecords} />
          </Suspense>
        )} */}

        <HomeHeroSlider slides={heroSlides} />

        <FeaturedCampaignSection initialProducts={featuredCampaignCarousel} />

        <PopularProductsSection initialProducts={popularCarousel} />

        <SectionDividerLine />

        <TopProductsSection initialProducts={featuredCarousel} />
        <SectionDividerLine />
        <HotDealsBanner banners={hotDealBanners} />
        <SectionDividerLine />

        <ThisMonthSection initialProducts={thisMonthCarousel} />
        <SectionDividerLine />

        <HomeAllProductsSection initialProducts={allProductsCarousel} />
        <SectionDividerLine />

        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}

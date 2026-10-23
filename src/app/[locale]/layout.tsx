import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import Script from "next/script";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CURRENCY_STORAGE_KEY } from "@/lib/currency/currencyStorage";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import "../globals.css";
import { Montserrat, Almarai } from "next/font/google";
import ClientLayout from "../../componentsedit/ClientLayout";
import ChatbotWidgetProvider from "@/componentsedit/chatbot/ChatbotWidgetProvider";
import GoogleTagManagerScript from "@/componentsedit/analytics/GoogleTagManager";
import GoogleTagManagerBody from "@/componentsedit/analytics/GoogleTagManagerBody";
import FacebookPixel from "@/componentsedit/analytics/FacebookPixel";
import TikTokPixel from "@/componentsedit/analytics/TikTokPixel";
/** Primary Latin UI font (market standard). Arabic locale still applies Almarai on the root element for correct Arabic script. */
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const almarai = Almarai({
  subsets: ["arabic"],
  variable: "--font-almarai",
  weight: ["300", "400", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const viewport = {
  themeColor: "#000000",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = getSiteUrl();

  let title =
    locale === "ar"
      ? "متجر كاميون – منتجات عالية الجودة بأسعار رائعة"
      : "Camion Store – High-Quality Products at Great Prices";
  let description =
    locale === "ar"
      ? "متجر كاميون وجهتك الموثوقة للتسوق عبر الإنترنت. استمتع بمنتجات مختارة وعروض مميزة وتجربة تسوق سهلة تناسب احتياجاتك اليومية."
      : "Camion Store is your trusted online destination for high-quality products. Enjoy curated offerings, unbeatable deals, and effortless shopping tailored to your daily needs.";
  let keywords =
    locale === "ar"
      ? "متجر كاميون، تسوق إلكتروني، منتجات عالية الجودة، أفضل الأسعار، عروض"
      : "Camion Store, online shopping, high-quality products, best prices, deals, e-commerce";

  try {
    const t = await getTranslations({ locale });
    title = t("seoDefaultTitle");
    description = t("seoDefaultDescription");
    keywords = t("seoDefaultKeywords");
  } catch {
    // Keep hardcoded locale fallbacks — never fail layout metadata.
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: locale === "ar" ? "%s | متجر كاميون" : "%s | Camion Store",
    },
    description,
    keywords,
    authors: [{ name: "Camion Store", url: `/${locale}` }],
    creator: "Camion Store",
    manifest: "/manifest.json",
    icons: {
      icon: "/assets/icons/logo-light.svg",
      apple: "/assets/icons/logo-light.svg",
    },
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      siteName: "Camion Store",
      images: [
        {
          url: "/assets/icons/logo-light.svg",
          width: 1200,
          height: 630,
          alt: "Camion Store Open Graph Image",
        },
      ],
      type: "website",
      locale: locale === "ar" ? "ar_AR" : "en_US",
    },
    twitter: {
      site: "@camionstore",
      creator: "@camionstore",
      card: "summary_large_image",
    },
    // Per-page generateMetadata must set canonical + hreflang (avoid layout pointing all routes at home).
  };
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const cookieStore = await cookies();
  const initialCurrency = cookieStore.get(CURRENCY_STORAGE_KEY)?.value ?? undefined;

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";

  return (
    <html
      className={`${montserrat.variable} ${almarai.variable} ${
        locale === "ar" ? almarai.className : montserrat.className
      }`}
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      {/* GTM bootstrap must sit high in <head> for Google Ads Tag Coverage */}
      <head>{gtmId ? <GoogleTagManagerScript gtmId={gtmId} /> : null}</head>
      <body className="antialiased">
        {gtmId ? <GoogleTagManagerBody gtmId={gtmId} /> : null}

        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientLayout initialCurrency={initialCurrency}>
            {children}
          </ClientLayout>

          <ChatbotWidgetProvider />
        </NextIntlClientProvider>

        {process.env.NEXT_PUBLIC_FB_PIXEL_ID ? (
          <FacebookPixel pixelId={process.env.NEXT_PUBLIC_FB_PIXEL_ID} />
        ) : null}

        {process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ? (
          <TikTokPixel pixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID} />
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Camion Store",
              url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              potentialAction: {
                "@type": "SearchAction",
                target: `${
                  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
                }/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Camion Store",
              url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              logo: "/assets/icons/logo-light.svg",
            }),
          }}
        />
        {/* SkipCash embedded checkout SDK (used by embedded card payments) */}
        <Script
          src="https://sdk.skipcash.com/checkout/skipcash-embed.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

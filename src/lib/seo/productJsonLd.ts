import {
  PRODUCT_DELIVERY_MAX_DAYS,
  PRODUCT_DELIVERY_MIN_DAYS,
} from "@/lib/product/productDeliveryEstimate";
import type { ProductDetailsCenterProduct } from "@/types/checkoutDisplay";
import { absoluteLocaleUrl, getSiteUrl } from "./siteUrl";
import { plainTextDescription } from "./buildPageMetadata";

type ProductPrices = {
  price?: string | number;
  regular_price?: string | number;
  sale_price?: string | number;
  currency_code?: string;
};

type RatingSummary = { average: number; count: number };

const RETURN_WINDOW_DAYS = 14;
const SHIPPING_COUNTRY = "QA";

function resolveOfferPrice(prices: ProductPrices | undefined): {
  price: number | null;
  currency: string;
} {
  const currency = String(prices?.currency_code ?? "QAR")
    .trim()
    .toUpperCase() || "QAR";
  const sale = Number(prices?.sale_price);
  const regular = Number(prices?.regular_price ?? prices?.price);
  const display = Number(prices?.price);
  const candidates = [sale, display, regular].filter(
    (n) => Number.isFinite(n) && n > 0,
  );
  return {
    price: candidates.length ? Math.min(...candidates) : null,
    currency,
  };
}

/**
 * Product + Offer JSON-LD for PDP SSR.
 * Availability mirrors current UI (stock not yet from API).
 * Shipping/returns use the same static policy shown on the PDP.
 */
export function buildProductJsonLd(input: {
  locale: string;
  slug: string;
  product: ProductDetailsCenterProduct;
  productName: string;
  rating?: RatingSummary | null;
}): Record<string, unknown> {
  const { locale, slug, product, productName, rating } = input;
  const siteUrl = getSiteUrl();
  const productUrl = absoluteLocaleUrl(locale, `shop/${slug}`);
  const images = (product.images ?? [])
    .map((img) => img?.src)
    .filter((src): src is string => Boolean(src));
  const prices = product.prices as ProductPrices | undefined;
  const { price, currency } = resolveOfferPrice(prices);
  const description = plainTextDescription(
    product.short_description || product.description,
    5000,
  );
  const brandName = "Camion Store";
  const sku =
    product.defaultVariantSpecs?.sku ||
    (typeof product.id === "string" || typeof product.id === "number"
      ? String(product.id)
      : undefined);

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url: productUrl,
    priceCurrency: currency,
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: brandName,
      url: siteUrl,
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: SHIPPING_COUNTRY,
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: RETURN_WINDOW_DAYS,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      merchantReturnLink: absoluteLocaleUrl(locale, "PoliciesCamionApp"),
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
        currency,
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: SHIPPING_COUNTRY,
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: 0,
          maxValue: 1,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: PRODUCT_DELIVERY_MIN_DAYS,
          maxValue: PRODUCT_DELIVERY_MAX_DAYS,
          unitCode: "DAY",
        },
      },
    },
  };

  if (price != null) {
    offer.price = price.toFixed(2);
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: description || productName,
    image: images.length ? images : undefined,
    sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    url: productUrl,
    offers: offer,
  };

  if (rating && rating.count > 0 && rating.average > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.average.toFixed(2)),
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const categoryName = product.categories?.[0]?.name;
  if (categoryName) {
    jsonLd.category = categoryName;
  }

  return jsonLd;
}

export function buildProductBreadcrumbJsonLd(input: {
  locale: string;
  slug: string;
  productName: string;
  categoryName?: string | null;
  categorySlug?: string | null;
}): Record<string, unknown> {
  const { locale, slug, productName, categoryName, categorySlug } = input;
  const items: Array<Record<string, unknown>> = [
    {
      "@type": "ListItem",
      position: 1,
      name: locale === "ar" ? "الرئيسية" : "Home",
      item: absoluteLocaleUrl(locale),
    },
  ];

  if (categoryName && categorySlug) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: categoryName,
      item: absoluteLocaleUrl(locale, `categories/${categorySlug}`),
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: productName,
      item: absoluteLocaleUrl(locale, `shop/${slug}`),
    });
  } else {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: productName,
      item: absoluteLocaleUrl(locale, `shop/${slug}`),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

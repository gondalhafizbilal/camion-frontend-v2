/** Placeholder Shopping With Camion footer pages (CMS content wired later). */
export const SHOPPING_WITH_CAMION_PAGES = [
  {
    path: "/myaccount/about-camion",
    slug: "about-camion",
    titleKey: "aboutCamion",
  },
  {
    path: "/myaccount/why-shop-with-camion",
    slug: "why-shop-with-camion",
    titleKey: "whyShopWithCamion",
  },
  {
    path: "/myaccount/how-camion-works",
    slug: "how-camion-works",
    titleKey: "howCamionWorks",
  },
  {
    path: "/myaccount/why-consolidated-shipping",
    slug: "why-consolidated-shipping",
    titleKey: "whyConsolidatedShipping",
  },
  {
    path: "/myaccount/promotions-discounts",
    slug: "promotions-discounts",
    titleKey: "promotionsAndDiscounts",
  },
  {
    path: "/myaccount/secure-payments",
    slug: "secure-payments",
    titleKey: "securePayments",
  },
  {
    path: "/myaccount/buyer-protection",
    slug: "buyer-protection",
    titleKey: "buyerProtection",
  },
  {
    path: "/myaccount/quality-assurance",
    slug: "quality-assurance",
    titleKey: "qualityAssurance",
  },
] as const;

export type ShoppingWithCamionTitleKey =
  (typeof SHOPPING_WITH_CAMION_PAGES)[number]["titleKey"];

export function shoppingPageByPathSegment(segment: string) {
  const key = String(segment || "").trim().toLowerCase();
  return (
    SHOPPING_WITH_CAMION_PAGES.find((p) => p.slug === key) ?? null
  );
}

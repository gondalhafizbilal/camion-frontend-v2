/** Placeholder Help & Support footer pages (CMS content wired later). */
export const HELP_AND_SUPPORT_PAGES = [
  {
    path: "/myaccount/customer-support",
    slug: "customer-support",
    titleKey: "customerSupport",
  },
  {
    path: "/myaccount/report-a-product",
    slug: "report-a-product",
    titleKey: "reportAProduct",
  },
  {
    path: "/myaccount/how-track-your-order-works",
    slug: "how-track-your-order-works",
    titleKey: "howTrackYourOrderWorks",
  },
] as const;

export type HelpAndSupportTitleKey =
  (typeof HELP_AND_SUPPORT_PAGES)[number]["titleKey"];

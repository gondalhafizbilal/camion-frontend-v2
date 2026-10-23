import { allBlogs } from "./[locale]/blogs/_data/allBlogs";
import { routing } from "../i18n/routing";
import { flattenGqlCategories } from "../lib/catalog/categoryTree";

const DEFAULT_LOCALE = routing.defaultLocale;

function bilingualEntries(base, pathWithoutLocale, options = {}) {
  const {
    changeFrequency = "weekly",
    priority = 0.7,
    lastModified = new Date(),
  } = options;
  const origin = base.replace(/\/$/, "");
  const suffix = pathWithoutLocale
    ? `/${String(pathWithoutLocale).replace(/^\/+|\/+$/g, "")}`
    : "";

  const languages = {};
  for (const locale of routing.locales) {
    languages[locale] = `${origin}/${locale}${suffix}`;
  }
  languages["x-default"] = `${origin}/${DEFAULT_LOCALE}${suffix}`;

  return routing.locales.map((locale) => ({
    url: `${origin}/${locale}${suffix}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://camion-app.com";
  const now = new Date();

  // Public, indexable routes only (exclude cart/checkout/account/etc.).
  const staticPaths = [
    "",
    "about",
    "contact",
    "shop",
    "blogs",
    "categories",
    "faq",
    "PoliciesCamionApp",
    "affiliates",
    "track-order",
  ];

  const staticUrls = staticPaths.flatMap((p) =>
    bilingualEntries(base, p, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: p === "" ? 1.0 : 0.7,
    }),
  );

  const GET_PRODUCTS_PAGE_SIZE = 5;
  const SITEMAP_PRODUCT_PAGES_MAX = 2000;
  let productSlugs = [];
  let categorySlugs = [];

  try {
    const gqlUrl = `${base.replace(/\/$/, "")}/api/upstream/graphql`;
    const productsQuery = `
          query SitemapProducts($language: String, $currency: String, $pageNumber: Int, $itemsPerPage: Int) {
            getProducts(language: $language, currency: $currency, pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
              slug
            }
          }
        `;
    let pageNumber = 1;
    for (;;) {
      const res = await fetch(gqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: productsQuery,
          variables: {
            language: "en",
            currency: "qar",
            pageNumber,
            itemsPerPage: GET_PRODUCTS_PAGE_SIZE,
          },
        }),
        next: { revalidate: 86400 },
      });
      if (!res.ok) break;
      const json = await res.json();
      const nodes = json?.data?.getProducts;
      if (!Array.isArray(nodes) || nodes.length === 0) break;
      const slugs = nodes
        .map((p) => p?.slug)
        .filter((s) => typeof s === "string" && s);
      productSlugs.push(...slugs);
      if (nodes.length > GET_PRODUCTS_PAGE_SIZE) break;
      if (nodes.length < GET_PRODUCTS_PAGE_SIZE) break;
      pageNumber += 1;
      if (pageNumber > SITEMAP_PRODUCT_PAGES_MAX) break;
    }

    const categoriesQuery = `
      query SitemapCategories($pageNumber: Int, $itemsPerPage: Int) {
        getCategories(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
          slug
          children {
            slug
            children { slug }
          }
        }
      }
    `;
    const catRes = await fetch(gqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: categoriesQuery,
        variables: { pageNumber: 1, itemsPerPage: 200 },
      }),
      next: { revalidate: 86400 },
    });
    if (catRes.ok) {
      const catJson = await catRes.json();
      categorySlugs = flattenGqlCategories(catJson?.data?.getCategories).map(
        (c) => c.slug,
      );
    }
  } catch {
    // fail silently; still return static URLs
  }

  productSlugs = [...new Set(productSlugs)];
  categorySlugs = [...new Set(categorySlugs)];

  const productUrls = productSlugs.flatMap((slug) =>
    bilingualEntries(base, `shop/${encodeURIComponent(slug)}`, {
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }),
  );

  const categoryUrls = categorySlugs.flatMap((slug) =>
    bilingualEntries(base, `categories/${encodeURIComponent(slug)}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    }),
  );

  const blogUrls = (allBlogs.en || []).flatMap((p) =>
    bilingualEntries(base, `blogs/${p.id}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  return [...staticUrls, ...categoryUrls, ...productUrls, ...blogUrls];
}

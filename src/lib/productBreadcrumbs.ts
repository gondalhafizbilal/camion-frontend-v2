import type { RoadmapItem } from "@/componentsedit/Roadmap";

export type ProductCategoryCrumb = {
  name?: string | null;
  slug?: string | null;
};

/** PDP breadcrumb: Home → category listing (by slug) → product title. No `/categories` index. */
export function buildProductDetailBreadcrumbs(args: {
  t: (key: string) => string;
  productName?: string | null;
  productSlug?: string | null;
  category?: ProductCategoryCrumb | null;
}): RoadmapItem[] {
  const items: RoadmapItem[] = [{ label: args.t("home"), href: "/" }];

  const catName = String(args.category?.name ?? "").trim();
  const catSlug = String(args.category?.slug ?? "").trim();

  if (catName && catSlug) {
    items.push({
      label: catName,
      href: `/categories/${encodeURIComponent(catSlug)}`,
    });
  } else {
    items.push({ label: args.t("shop"), href: "/shop" });
  }

  const title = String(args.productName ?? args.productSlug ?? "").trim();
  if (title) items.push({ label: title });

  return items.filter((i) => i.label);
}

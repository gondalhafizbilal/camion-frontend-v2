import type { GqlCategory } from "@/services/graphql/types/category";

export type FlatCategory = {
  uuid: string;
  slug: string;
  name: string;
  thumbnailUrl?: string | null;
};

/** Flatten up to three levels from `getCategories`. */
export function flattenGqlCategories(
  roots: GqlCategory[] | null | undefined,
): FlatCategory[] {
  const out: FlatCategory[] = [];
  for (const root of roots ?? []) {
    if (root?.slug) {
      out.push({
        uuid: root.uuid,
        slug: root.slug,
        name: (root.name ?? root.slug).trim() || root.slug,
        thumbnailUrl: root.thumbnailUrl,
      });
    }
    for (const child of root?.children ?? []) {
      if (child?.slug) {
        out.push({
          uuid: child.uuid,
          slug: child.slug,
          name: (child.name ?? child.slug).trim() || child.slug,
          thumbnailUrl: child.thumbnailUrl,
        });
      }
      for (const grand of child?.children ?? []) {
        if (grand?.slug) {
          out.push({
            uuid: grand.uuid,
            slug: grand.slug,
            name: (grand.name ?? grand.slug).trim() || grand.slug,
            thumbnailUrl: grand.thumbnailUrl,
          });
        }
      }
    }
  }
  return out;
}

export function findCategoryBySlug(
  roots: GqlCategory[] | null | undefined,
  slug: string,
): FlatCategory | null {
  const needle = String(slug || "").trim();
  if (!needle) return null;
  return (
    flattenGqlCategories(roots).find((c) => c.slug === needle) ?? null
  );
}

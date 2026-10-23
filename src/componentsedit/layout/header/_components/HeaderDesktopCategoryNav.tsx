"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useCategories } from "@/componentsedit/context/CategoriesContext";
import type { GqlCategory } from "@/services/graphql/types/category";
import HeaderPrimaryBar from "./HeaderPrimaryBar";
import HeaderSubcategoryBar from "./HeaderSubcategoryBar";

function findRootForCategorySlug(
  roots: GqlCategory[],
  categorySlug: string,
): GqlCategory | null {
  for (const root of roots) {
    if (root.slug === categorySlug) return root;
    for (const child of root.children ?? []) {
      if (child.slug === categorySlug) return root;
      for (const grand of child.children ?? []) {
        if (grand.slug === categorySlug) return root;
      }
    }
  }
  return null;
}

export type HeaderDesktopCategoryNavProps = {
  totalItems?: number;
  wishlistCount?: number;
};

/**
 * Coordinates primary category tabs with the subcategory strip below (GraphQL `getCategories`).
 */
export default function HeaderDesktopCategoryNav({
  totalItems = 0,
  wishlistCount = 0,
}: HeaderDesktopCategoryNavProps) {
  const { roots, loading } = useCategories();
  const pathname = usePathname();
  /** `null` = default (first root for highlight / sub-row); else hovered or matched root `slug`. */
  const [activeRootSlug, setActiveRootSlug] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/\/categories\/([^/]+)/);
    if (!match?.[1] || roots.length === 0) return;
    const root = findRootForCategorySlug(roots, match[1]);
    if (root) setActiveRootSlug(root.slug);
  }, [pathname, roots]);

  const highlightSlug = useMemo(() => {
    if (activeRootSlug != null) return activeRootSlug;
    return roots[0]?.slug ?? "";
  }, [activeRootSlug, roots]);

  const onCategoryRootPointerEnter = useCallback((root: GqlCategory) => {
    setActiveRootSlug(root.slug);
  }, []);

  return (
    <>
      <HeaderPrimaryBar
        totalItems={totalItems}
        wishlistCount={wishlistCount}
        categoryRoots={roots}
        categoryLoading={loading}
        highlightRootSlug={highlightSlug}
        onCategoryRootPointerEnter={onCategoryRootPointerEnter}
      />
      <HeaderSubcategoryBar
        roots={roots}
        highlightRootSlug={highlightSlug}
        loading={loading}
      />
    </>
  );
}

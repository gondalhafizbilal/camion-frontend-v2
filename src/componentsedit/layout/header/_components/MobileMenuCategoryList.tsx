"use client";

import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import { memo, useCallback, useState } from "react";
import type { GqlCategory, GqlCategoryChild } from "@/services/graphql/types/category";

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function thumbUrl(u: string | null | undefined): string | null {
  const t = (u ?? "").trim();
  return t || null;
}

type ThumbProps = {
  src: string;
  label: string;
  size: number;
  className?: string;
  radius?: "full" | "md";
};

function CategoryThumb({
  src,
  label,
  size,
  className = "",
  radius = "full",
}: ThumbProps) {
  return (
    <Image
      src={src}
      alt={label}
      width={size}
      height={size}
      className={`shrink-0 object-cover ${
        radius === "full" ? "rounded-full" : "rounded-md"
      } ${className}`}
      style={{ width: size, height: size }}
      unoptimized
    />
  );
}

type CategoryNavLinkProps = {
  slug: string;
  name: string;
  thumb: string | null;
  thumbSize: number;
  thumbRadius?: "full" | "md";
  nameClassName: string;
  rowClassName?: string;
  closeMenu: () => void;
};

function CategoryNavLink({
  slug,
  name,
  thumb,
  thumbSize,
  thumbRadius = "full",
  nameClassName,
  rowClassName = "",
  closeMenu,
}: CategoryNavLinkProps) {
  return (
    <Link
      href={`/categories/${slug}`}
      onClick={closeMenu}
      className={`flex min-w-0 flex-1 items-center gap-3 ${rowClassName}`}
    >
      {thumb ? (
        <CategoryThumb
          src={thumb}
          label={name}
          size={thumbSize}
          radius={thumbRadius}
          className="bg-gray-100"
        />
      ) : null}
      <span className={nameClassName}>{name}</span>
    </Link>
  );
}

const MobileMenuCategoryList = memo(function MobileMenuCategoryList({
  categoryRoots,
  categoriesLoading,
  closeMenu,
  expandSubcategoriesLabel,
}: {
  categoryRoots: GqlCategory[];
  categoriesLoading: boolean;
  closeMenu: () => void;
  /** Screen-reader label for expand/collapse (e.g. "Subcategories for {name}"). */
  expandSubcategoriesLabel: (name: string) => string;
}) {
  const [openRoots, setOpenRoots] = useState<Set<string>>(() => new Set());
  const [openChildGroups, setOpenChildGroups] = useState<Set<string>>(() => new Set());

  const childGroupKey = (rootId: string, childId: string) => `${rootId}::${childId}`;

  const toggleRoot = useCallback((uuid: string) => {
    setOpenRoots((prev) => {
      const n = new Set(prev);
      if (n.has(uuid)) n.delete(uuid);
      else n.add(uuid);
      return n;
    });
  }, []);

  const toggleChildGroup = useCallback((rootId: string, childId: string) => {
    const k = childGroupKey(rootId, childId);
    setOpenChildGroups((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }, []);

  if (categoriesLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`mcat-sk-${i}`} className="flex items-center gap-3 py-2" aria-hidden>
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 flex-1 max-w-[12rem] rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {categoryRoots.map((root) => {
        const children = root.children ?? [];
        const hasChildren = children.length > 0;
        const rThumb = thumbUrl(root.thumbnailUrl);
        const rootName = String(root.name || root.slug);
        const rootPanelId = `mobile-cat-panel-${root.uuid}`;

        if (!hasChildren) {
          return (
            <div key={root.uuid} className="min-h-[44px] py-2">
              <CategoryNavLink
                slug={root.slug}
                name={rootName}
                thumb={rThumb}
                thumbSize={40}
                nameClassName="font-bold text-[16px] leading-snug"
                closeMenu={closeMenu}
              />
            </div>
          );
        }

        const isRootOpen = openRoots.has(root.uuid);

        return (
          <div key={root.uuid} className="flex flex-col">
            <div className="flex min-h-[44px] items-stretch gap-0.5">
              <CategoryNavLink
                slug={root.slug}
                name={rootName}
                thumb={rThumb}
                thumbSize={40}
                nameClassName="min-w-0 font-bold text-[16px] leading-snug truncate"
                rowClassName="py-2"
                closeMenu={closeMenu}
              />
              <button
                type="button"
                onClick={() => toggleRoot(root.uuid)}
                className="flex h-[44px] w-11 shrink-0 items-center justify-center rounded-md text-gray-700 hover:bg-gray-50"
                aria-expanded={isRootOpen}
                aria-controls={rootPanelId}
                id={`mobile-cat-trigger-${root.uuid}`}
                title={expandSubcategoriesLabel(rootName)}
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    isRootOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
            {isRootOpen ? (
              <div
                id={rootPanelId}
                role="region"
                aria-labelledby={`mobile-cat-trigger-${root.uuid}`}
                className="mb-1 ms-1 border-s border-gray-200 ps-3"
              >
                {children.map((ch) => (
                  <ChildCategoryRow
                    key={ch.uuid}
                    root={root}
                    child={ch}
                    closeMenu={closeMenu}
                    isChildGroupOpen={openChildGroups.has(
                      childGroupKey(root.uuid, ch.uuid),
                    )}
                    onToggleChildGroup={() => toggleChildGroup(root.uuid, ch.uuid)}
                    expandSubcategoriesLabel={expandSubcategoriesLabel}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
});

type ChildRowProps = {
  root: GqlCategory;
  child: GqlCategoryChild;
  closeMenu: () => void;
  isChildGroupOpen: boolean;
  onToggleChildGroup: () => void;
  expandSubcategoriesLabel: (name: string) => string;
};

function ChildCategoryRow({
  root,
  child,
  closeMenu,
  isChildGroupOpen,
  onToggleChildGroup,
  expandSubcategoriesLabel,
}: ChildRowProps) {
  const grands = child.children ?? [];
  const hasGrands = grands.length > 0;
  const cThumb = thumbUrl(child.thumbnailUrl);
  const cName = String(child.name || child.slug);
  const groupId = `mobile-cat-g-${root.uuid}-${child.uuid}`;

  if (!hasGrands) {
    return (
      <div className="min-h-[40px] py-2 ps-0.5">
        <CategoryNavLink
          slug={child.slug}
          name={cName}
          thumb={cThumb}
          thumbSize={32}
          thumbRadius="md"
          nameClassName="text-[15px] text-gray-800"
          closeMenu={closeMenu}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex min-h-[40px] items-stretch gap-0.5">
        <CategoryNavLink
          slug={child.slug}
          name={cName}
          thumb={cThumb}
          thumbSize={32}
          thumbRadius="md"
          nameClassName="min-w-0 text-[15px] text-gray-800 truncate"
          rowClassName="py-2 ps-0.5"
          closeMenu={closeMenu}
        />
        <button
          type="button"
          onClick={onToggleChildGroup}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50"
          aria-expanded={isChildGroupOpen}
          aria-controls={groupId}
          id={`${groupId}-btn`}
          title={expandSubcategoriesLabel(cName)}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isChildGroupOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      {isChildGroupOpen ? (
        <div
          id={groupId}
          role="region"
          className="mb-1 ms-1 border-s border-gray-100 ps-3"
        >
          {grands.map((g) => {
            const gThumb = thumbUrl(g.thumbnailUrl);
            const gName = String(g.name || g.slug);
            return (
              <Link
                key={g.uuid}
                href={`/categories/${g.slug}`}
                onClick={closeMenu}
                className="flex min-h-[36px] items-center gap-2 py-1.5"
              >
                {gThumb ? (
                  <CategoryThumb
                    src={gThumb}
                    label={gName}
                    size={28}
                    radius="md"
                    className="bg-gray-100"
                  />
                ) : null}
                <span className="text-[14px] text-gray-600">{gName}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default MobileMenuCategoryList;

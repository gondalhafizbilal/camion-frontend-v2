"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import {
  useCategories,
  type CategoryRecord,
} from "@/componentsedit/context/CategoriesContext";

export default function Categories() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const categoriesCtx = useCategories();

  useEffect(() => {
    if (Array.isArray(categoriesCtx.categories)) {
      setCategories(categoriesCtx.categories);
    }
    setLoading(categoriesCtx.loading);
  }, [categoriesCtx.categories, categoriesCtx.loading]);

  return (
    <div className="flex gap-4 overflow-x-auto py-2">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-5 w-20 bg-gray-200 rounded-full dark:bg-gray-400 animate-pulse"
            ></div>
          ))
        : categories.slice(0, 6).map((category, i) => (
            <NavItem
              key={category.id ?? i}
              to={`/categories/${category?.slug ?? ""}`}
              title={category.name}
            />
          ))}
    </div>
  );
}

function NavItem({ title, to }: { title?: string; to: string }) {
  return (
    <div className="flex items-center gap-1 cursor-pointer hover:text-iconHover transition whitespace-nowrap">
      <Link
        href={to}
        className="focus:outline-none focus:ring-2 focus:ring-[#B92123] focus:ring-offset-2 rounded px-1"
        aria-label={`Navigate to ${title ?? "category"}`}
      >
        {title}
      </Link>
    </div>
  );
}

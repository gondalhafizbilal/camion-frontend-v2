"use client";
import { API_ENDPOINTS } from "@/services/api/api";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useCategories } from "@/componentsedit/context/CategoriesContext";
import { useTranslations } from "next-intl";
import Image from "@/componentsedit/StaticImage";

export default function Categories({ initialCategories = [] }) {
  const t = useTranslations();
  const ctx = useCategories();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
      return;
    }

    // subscribe to context
    setCategories(ctx.categories || []);
    setLoading(ctx.loading);
  }, [initialCategories?.length, ctx.categories, ctx.loading]);

  if (loading) {
    return (
      <div className="w-full flex flex-col container gap-4 mt-10 m-auto">
        <div className="px-4 md:px-0">
          <h2 className="font-semibold text-xl mb-2">
            {t("shopByCategories")}
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide px-4 md:px-0">
          <div className="flex gap-6 mt-6 min-w-max pb-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse shadow-xl md:w-[120px] md:h-[120px] w-[80px] h-[80px] bg-gray-300 rounded-full flex-shrink-0"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full container pb-2 mt-10 m-auto">
      <div className="px-4 md:px-0">
        <h2 className="font-semibold text-xl mb-2">{t("shopByCategories")}</h2>
      </div>

      <div className="overflow-x-auto scrollbar-hide px-4 md:px-0">
        <div className="flex gap-6 mt-6 min-w-max pb-2">
          {categories.map((category, i) => (
            <Link
              href={`/categories/${category?.slug}`}
              passHref
              key={category.id || i}
              className="flex cursor-pointer flex-col items-center text-center gap-2 group flex-shrink-0"
            >
              <Image
                src={
                  category.image?.thumbnail ||
                  category.image?.src ||
                  "/assets/images/Laptops.jpg"
                }
                alt={category.name || t("category")}
                width={120}
                height={120}
                className="md:w-[120px] md:h-[120px] w-[80px] h-[80px] rounded-full shadow-xl object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 768px) 120px, 80px"
              />
              <p className="md:text-sm text-xs font-semibold hover:text-[#B92123] transition-colors whitespace-nowrap">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

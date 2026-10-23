"use client";
import dynamic from "next/dynamic";

const Categories = dynamic(() => import("@/componentsedit/categories"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex flex-col container gap-4 mt-10 m-auto">
      <h2 className="font-semibold text-xl mb-2">Shop by categories</h2>
      <div className="p-6 gap-4 grid md:grid-cols-10 grid-cols-3 m-auto min-h-auto">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse shadow-xl md:w-[120px] md:h-[120px] w-[80px] h-[80px] bg-gray-300 rounded-full"
          />
        ))}
      </div>
    </div>
  ),
});

export default function CategoriesClient({ initialCategories }) {
  return <Categories initialCategories={initialCategories} />;
}


"use client";
import dynamic from "next/dynamic";

const RecommendedProducts = dynamic(() => import("@/componentsedit/RecommendedProducts"), {
  ssr: false,
  loading: () => (
    <div className="md:p-6 container m-auto mt-16 min-h-screen">
      <h2 className="font-semibold text-xl mb-2">Most viewed</h2>
      <div className="grid grid-cols-2 w-full md:grid-cols-6 md:gap-6 gap-1">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="p-4 border rounded-2xl border-gray-200 shadow animate-pulse md:p-6 dark:border-gray-400"
          >
            <div className="flex items-center justify-center h-48 mb-4 bg-gray-300 rounded dark:bg-gray-400"></div>
          </div>
        ))}
      </div>
    </div>
  ),
});

export default function RecommendedClient({ initialProducts }) {
  return <RecommendedProducts initialProducts={initialProducts} />;
}


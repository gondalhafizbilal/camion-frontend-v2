import React from "react";
import Image from "@/componentsedit/StaticImage";
import { Link } from "@/i18n/navigation";
import { allBlogs } from "./_data/allBlogs";
import { buildPageMetadata } from "@/lib/seo/buildPageMetadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  return buildPageMetadata({
    locale,
    path: "blogs",
    title: isAr ? "المدونة | متجر كاميون" : "Blog | Camion Store",
    description: isAr
      ? "اقرأ مقالات ونصائح متجر كاميون حول التسوق والمنتجات والعروض."
      : "Read Camion Store articles and tips on shopping, products, and deals.",
  });
}

export default async function Blogs({ params }) {
  const { locale } = await params;
  const posts = allBlogs[locale] || [];
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">
        {locale === "ar" ? "المدونة" : "Blog"}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((b) => (
          <article key={b.id} className="rounded-xl bg-white p-4 shadow-sm border">
            <Image
              src={b.image}
              alt={b.title}
              width={800}
              height={160}
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
            <h2 className="text-lg font-semibold mb-1">{b.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-3">{b.desc}</p>
            <div className="mt-3">
              <Link href={`/blogs/${b.id}`} className="text-blue-600 hover:underline">
                {locale === "ar" ? "اقرأ المزيد" : "Read more"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

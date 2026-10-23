import React from 'react'
import Image from '@/componentsedit/StaticImage'
import { Link } from '@/i18n/navigation'
import { allBlogs } from '../_data/allBlogs'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import { getSiteUrl } from '@/lib/seo/siteUrl'

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const posts = allBlogs[locale] || [];
  const id = Number(slug);
  const post = posts.find((p) => Number(p.id) === id);
  const siteUrl = getSiteUrl();
  const path = `blogs/${slug}`;
  
  if (!post) {
    return buildPageMetadata({
      locale,
      path,
      title: 'Article Not Found',
      description: 'Camion Store blog',
    });
  }

  const imageUrl = post.image 
    ? (post.image.startsWith('http') ? post.image : `${siteUrl}${post.image}`)
    : `${siteUrl}/assets/icons/logo-light.svg`;

  return buildPageMetadata({
    locale,
    path,
    title: post.title,
    description: post.desc,
    type: 'article',
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: post.title,
      },
    ],
  });
}

export default async function SingleBlog({ params }) {
  const { locale, slug } = await params;
  const posts = allBlogs[locale] || [];
  const id = Number(slug);
  const post = posts.find((p) => Number(p.id) === id);
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/${locale}/blogs/${slug}`;
  const logoUrl = `${siteUrl}/assets/icons/logo-light.svg`;

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.desc,
        image: post.image ? (post.image.startsWith('http') ? post.image : siteUrl + post.image) : undefined,
        mainEntityOfPage: articleUrl,
        url: articleUrl,
        inLanguage: locale,
        isAccessibleForFree: true,
        author: {
          "@type": "Person",
          name: "Camion Editorial",
        },
        publisher: {
          "@type": "Organization",
          name: "Camion Store",
          logo: { "@type": "ImageObject", url: logoUrl },
        },
      }
    : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: 'Home', item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: 'Blog', item: `${siteUrl}/${locale}/blogs` },
      { "@type": "ListItem", position: 3, name: post?.title || 'Article', item: articleUrl },
    ],
  };

  const idx = posts.findIndex((p) => Number(p.id) === id);
  const prev = idx > 0 ? posts[idx - 1] : undefined;
  const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : undefined;
  const related = posts.filter((p) => Number(p.id) !== id).slice(0, 3);

  return (
    <main className="container mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:underline">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
        {" / "}
        <Link href="/blogs" className="hover:underline">{locale === 'ar' ? 'المدونة' : 'Blog'}</Link>
        {" / "}
        <span className="text-black font-semibold">{post?.title || 'Article'}</span>
      </nav>

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {!post ? (
        <p className="text-red-600">{locale === 'ar' ? 'المقال غير موجود' : 'Article not found'}</p>
      ) : (
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
          <p className="text-gray-600 mb-5">{post.desc}</p>
          <Image src={post.image} alt={post.title} width={1200} height={400} className="w-full h-64 object-cover rounded-xl mb-6" />

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">{post.content?.needStoreTitle}</h2>
            <ul className="list-disc pl-5 space-y-1">
              {(post.content?.needStoreList || []).map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between items-center mt-8 border-t pt-4">
            <div>
              {prev && (
                <Link href={`/blogs/${prev.id}`} className="text-blue-600 hover:underline">← {prev.title}</Link>
              )}
            </div>
            <div>
              {next && (
                <Link href={`/blogs/${next.id}`} className="text-blue-600 hover:underline">{next.title} →</Link>
              )}
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <Link href="/blogs" className="text-sm text-gray-700 underline">{locale === 'ar' ? 'جميع المقالات' : 'All articles'}</Link>
            <Link href="/shop" className="text-sm text-gray-700 underline">{locale === 'ar' ? 'تسوق الآن' : 'Shop now'}</Link>
            <Link href="/about" className="text-sm text-gray-700 underline">{locale === 'ar' ? 'من نحن' : 'About us'}</Link>
          </div>

          <section className="mt-10">
            <h3 className="text-lg font-semibold mb-4">{locale === 'ar' ? 'مقالات ذات صلة' : 'Related articles'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((r) => (
                <article key={r.id} className="rounded-xl bg-white p-4 shadow-sm border">
                  <Image src={r.image} alt={r.title} width={600} height={120} className="w-full h-28 object-cover rounded-lg mb-2" />
                  <h4 className="text-sm font-semibold line-clamp-2 mb-1">{r.title}</h4>
                  <Link href={`/blogs/${r.id}`} className="text-blue-600 hover:underline text-sm">
                    {locale === 'ar' ? 'اقرأ المزيد' : 'Read more'}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </article>
      )}
    </main>
  )
}

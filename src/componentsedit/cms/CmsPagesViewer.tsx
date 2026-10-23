"use client";

import { useMemo } from "react";
import type { GqlCmsPage } from "@/services/graphql/types/cmsPage";
import CmsHtmlContent from "@/componentsedit/cms/CmsHtmlContent";

function slugToId(slug: string): string {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return "page";
  return s.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "page";
}

function looksLikeHtml(input: string): boolean {
  const s = String(input ?? "").trim();
  if (!s) return false;
  if (s.startsWith("<") && s.includes(">")) return true;
  return /<\/(p|div|h1|h2|h3|ul|ol|li|strong|em|a|br)\b/i.test(s);
}

export type CmsPagesViewerProps = {
  title: string;
  subtitle?: string | null;
  pages: GqlCmsPage[];
};

export default function CmsPagesViewer({ title, subtitle, pages }: CmsPagesViewerProps) {
  const rows = useMemo(() => {
    const cleaned = (pages ?? [])
      .filter(Boolean)
      .filter((p) => (p.enabled ?? true) !== false)
      .map((p) => ({
        uuid: String(p.uuid ?? ""),
        slug: String(p.slug ?? ""),
        title: String(p.title ?? p.slug ?? "").trim() || "Untitled",
        content: String(p.content ?? "").trim(),
      }))
      .filter((p) => p.content.length > 0);

    // stable order: title asc, fallback slug asc
    cleaned.sort((a, b) => (a.title || a.slug).localeCompare(b.title || b.slug));
    return cleaned;
  }, [pages]);

  return (
    <div className="w-full min-w-0">
      <div className="mb-5 sm:mb-6">
        {subtitle ? (
          <div className="text-xs sm:text-sm font-medium text-black/60">{subtitle}</div>
        ) : null}
        <h1
          className="mt-1 text-[20px] sm:text-[24px] md:text-[28px] font-semibold text-[#DB4444]"
          style={{
            fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
            lineHeight: "1.25",
          }}
        >
          {title}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <aside className="lg:col-span-4 xl:col-span-3 order-last lg:order-first">
          <div className="sticky top-6 rounded-[10px] border border-black/10 bg-white p-4 sm:p-5">
            <div className="text-sm font-semibold text-black">On this page</div>
            <nav className="mt-3 flex flex-col gap-1.5 text-sm">
              {rows.map((p) => {
                const id = slugToId(p.slug || p.title);
                return (
                  <a
                    key={p.uuid || id}
                    href={`#${id}`}
                    className="rounded-md px-2.5 py-2 text-black/70 hover:text-[#DB4444] hover:bg-black/5 transition"
                  >
                    {p.title}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-6">
          {rows.map((p) => {
            const id = slugToId(p.slug || p.title);
            const isHtml = looksLikeHtml(p.content);
            return (
              <section
                key={p.uuid || id}
                id={id}
                className="scroll-mt-6 rounded-[10px] border border-black/10 bg-white p-4 sm:p-6 md:p-8"
              >
                <h2
                  className="text-lg sm:text-xl font-semibold text-black mb-3"
                  style={{
                    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {p.title}
                </h2>

                {isHtml ? (
                  <CmsHtmlContent html={p.content} />
                ) : (
                  <div className="cms-html-content">
                    {p.content
                      .split(/\n{2,}/g)
                      .map((para) => para.trim())
                      .filter(Boolean)
                      .map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                  </div>
                )}
              </section>
            );
          })}

          {rows.length === 0 ? (
            <div className="rounded-[10px] border border-black/10 bg-white p-4 sm:p-6 text-black/70">
              No CMS pages found.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


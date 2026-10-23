"use client";

import { useMemo } from "react";
import CmsHtmlContent from "@/componentsedit/cms/CmsHtmlContent";
import {
  looksLikeSplitFaqCmsHtml,
  normalizeFaqCmsHtml,
} from "@/lib/cms/normalizeFaqCmsHtml";

function looksLikeHtml(input: string): boolean {
  const s = input.trim();
  if (!s) return false;
  if (s.startsWith("<") && s.includes(">")) return true;
  return /<\/(p|div|h1|h2|h3|ul|ol|li|strong|em|a|br)\b/i.test(s);
}

function toPrettyDate(input: string | null | undefined): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

type PlainBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] };

function parsePlainContent(input: string): PlainBlock[] {
  const raw = String(input ?? "");
  const paragraphs = raw
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks: PlainBlock[] = [];
  for (const p of paragraphs) {
    const lines = p
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Bullet list (common in policy copy-paste).
    const bulletLines = lines.filter((l) => /^[-•*]\s+/.test(l));
    if (bulletLines.length >= 2 && bulletLines.length === lines.length) {
      blocks.push({
        type: "ul",
        items: bulletLines.map((l) => l.replace(/^[-•*]\s+/, "").trim()),
      });
      continue;
    }

    // Numbered section heading like "1. Title" / "2.1 Title"
    if (lines.length === 1 && /^\d+(\.\d+)*\s+\S+/.test(lines[0])) {
      blocks.push({ type: "heading", text: lines[0] });
      continue;
    }

    blocks.push({ type: "paragraph", text: lines.join(" ") });
  }
  return blocks;
}

function renderInlineLabelBold(text: string): React.ReactNode {
  const m = text.match(/^([^:\n]{2,60}):\s+([\s\S]+)$/);
  if (!m) return text;
  const label = m[1].trim();
  const rest = m[2];
  // Avoid bolding full sentences like "Important: this is ..."; keep it for short labels.
  if (label.split(/\s+/g).length > 6) return text;
  return (
    <>
      <strong>{label}:</strong> {rest}
    </>
  );
}

export type CmsLegalDocumentProps = {
  title: string;
  /** ISO date or any backend timestamp */
  lastUpdated?: string | null;
  /** CMS string content; can be HTML or plain text/markdown-ish */
  content: string;
  /** Optional small caption under title (e.g. “Privacy Policy”). */
  subtitle?: string | null;
  /** Merge split FAQ number/question blocks from CMS onto one line. */
  faqLayout?: boolean;
};

export default function CmsLegalDocument({
  title,
  subtitle,
  lastUpdated,
  content,
  faqLayout = false,
}: CmsLegalDocumentProps) {
  const isHtml = useMemo(() => looksLikeHtml(content), [content]);
  const updated = useMemo(() => toPrettyDate(lastUpdated), [lastUpdated]);
  const plainBlocks = useMemo(() => (isHtml ? [] : parsePlainContent(content)), [content, isHtml]);
  const resolvedFaqLayout = faqLayout || looksLikeSplitFaqCmsHtml(content);
  const htmlContent = useMemo(
    () => (resolvedFaqLayout ? normalizeFaqCmsHtml(content) : content),
    [content, resolvedFaqLayout],
  );

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
        {updated ? (
          <div className="mt-2 text-xs sm:text-sm text-black/50">
            Last updated: <span className="font-medium text-black/70">{updated}</span>
          </div>
        ) : null}
      </div>

      <div className="overflow-visible rounded-[10px] border border-black/10 bg-white px-5 py-4 sm:px-7 sm:py-6 md:px-10 md:py-8">
        {isHtml ? (
          <CmsHtmlContent html={htmlContent} faqLayout={resolvedFaqLayout} />
        ) : (
          <div className="cms-html-content">
            {plainBlocks.map((b, idx) => {
              if (b.type === "heading") {
                return (
                  <h2 key={idx} className="mt-6 first:mt-0">
                    {b.text}
                  </h2>
                );
              }
              if (b.type === "ul") {
                return (
                  <ul key={idx}>
                    {b.items.map((it, j) => (
                      <li key={j}>{renderInlineLabelBold(it)}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={idx}>{renderInlineLabelBold(b.text)}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}


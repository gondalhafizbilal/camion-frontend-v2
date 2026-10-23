export const CMS_HTML_CONTENT_CLASS = "cms-html-content";
export const CMS_FAQ_CONTENT_CLASS = "cms-html-content cms-html-content--faq";

type CmsHtmlContentProps = {
  html: string;
  className?: string;
  /** Merge CMS FAQ blocks like `<p>1.</p><p>Question</p>` onto one line. */
  faqLayout?: boolean;
};

/** Renders CMS/legal HTML with shared rich-text styles (headings, lists, tables, links). */
export default function CmsHtmlContent({
  html,
  className = "",
  faqLayout = false,
}: CmsHtmlContentProps) {
  const trimmed = String(html ?? "").trim();
  if (!trimmed) return null;

  const resolvedClass = [
    faqLayout ? CMS_FAQ_CONTENT_CLASS : CMS_HTML_CONTENT_CLASS,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={resolvedClass}
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  );
}

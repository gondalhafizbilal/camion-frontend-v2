const STANDALONE_NUMBER_TEXT = /^\d+\.$/;

/** Strip HTML tags and decode common entities for lightweight checks. */
function stripTags(value: string): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const BLOCK = "(p|h[1-6]|div)";

/** `<p><strong>1.</strong></p>` followed by a question block → single line. */
const MERGE_NUMBER_QUESTION = new RegExp(
  `<${BLOCK}(\\s[^>]*)?>\\s*(?:<strong>\\s*)?(\\d+\\.)\\s*(?:<\\/strong>\\s*)?<\\/\\1>\\s*` +
    `<${BLOCK}(\\s[^>]*)?>\\s*(?:<strong>\\s*)?([\\s\\S]*?)\\s*(?:<\\/strong>\\s*)?<\\/\\4>`,
  "gi",
);

const SPLIT_FAQ_NUMBER_BLOCK =
  /<(?:p|h[1-6]|div)[^>]*>\s*(?:<strong>\s*)?\d+\.\s*(?:<\/strong>\s*)?<\/(?:p|h[1-6]|div)>/i;

/**
 * CMS FAQ entries often store the index and question in separate blocks, e.g.
 * `<p><strong>1.</strong></p><p><strong>Question?</strong></p>`.
 * Merge those into one line: `<p><strong>1. Question?</strong></p>`.
 */
export function normalizeFaqCmsHtml(html: string): string {
  const input = String(html ?? "").trim();
  if (!input) return input;

  let result = input;
  let previous = "";

  while (result !== previous) {
    previous = result;
    result = result.replace(
      MERGE_NUMBER_QUESTION,
      (_match, _t1, _a1, num, t2, a2, question) => {
        const qText = stripTags(question);
        if (!qText || STANDALONE_NUMBER_TEXT.test(qText)) return _match;
        const attrs = a2 ?? "";
        return `<${t2}${attrs}><strong>${num} ${question.trim()}</strong></${t2}>`;
      },
    );
  }

  return result;
}

export function looksLikeSplitFaqCmsHtml(html: string): boolean {
  return SPLIT_FAQ_NUMBER_BLOCK.test(html);
}

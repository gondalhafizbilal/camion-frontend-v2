/** Forward/navigation arrow glyphs that respect reading direction. */
export function forwardArrowGlyph(locale: string): string {
  return locale === "ar" ? "←" : "→";
}

export function forwardChevronGlyph(locale: string): string {
  return locale === "ar" ? "‹" : "›";
}

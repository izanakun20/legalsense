export function normalizeQuote(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/["'\u2018\u2019\u201C\u201D]/g, "") // strip all quotes
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-") // various hyphens
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
}

/**
 * Checks if a quote exists in the source text.
 */
export function verifyQuote(quote: string | null | undefined, sourceText: string): boolean {
  if (!quote) return true; // null/undefined quotes are "verified" (nothing to verify)
  const normalizedQuote = normalizeQuote(quote);
  if (!normalizedQuote) return true;
  
  const normalizedSource = normalizeQuote(sourceText);
  return normalizedSource.includes(normalizedQuote);
}

/**
 * Metadata added to API responses when guardrails or verifiers flag something.
 */
export type GuardMeta = {
  forbiddenPhraseReplaced: boolean;
  unverifiedQuoteCount: number;
  unverifiedItems?: { type: string; index: number }[];
};

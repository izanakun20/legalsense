export const FORBIDDEN_PHRASES = [
  "illegal",
  "you will win",
  "dangerous",
  "you should sign",
  "you should accept",
  "you should reject",
  "you should refuse",
  "i recommend that you",
  "we recommend that you",
  "this is illegal",
  "you must sign",
  "do not sign"
];

/**
 * Normalizes text to make checking for forbidden phrases easier.
 * Converts to lowercase and normalizes whitespace.
 */
export function normalizeForGuard(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a given text contains any forbidden phrases.
 * Returns the first matched phrase, or null if clean.
 */
export function findForbiddenPhrase(text: string): string | null {
  const normalized = normalizeForGuard(text);
  for (const phrase of FORBIDDEN_PHRASES) {
    if (normalized.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}

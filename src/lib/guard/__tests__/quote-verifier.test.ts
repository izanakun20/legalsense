import { describe, it, expect } from 'vitest';
import { verifyQuote, normalizeQuote } from '../quote-verifier';

describe('quote-verifier', () => {
  describe('normalizeQuote', () => {
    it('normalizes smart quotes, hyphens, and whitespace', () => {
      const input = "This \u201Cis\u201D a \u2018quote\u2019 \u2014 with   weird\tspacing.";
      const expected = 'this is a quote - with weird spacing.';
      expect(normalizeQuote(input)).toBe(expected);
    });
  });

  describe('verifyQuote', () => {
    const sourceText = "The tenant shall pay rent on the first of the month. No subletting allowed without prior consent.";

    it('returns true if quote is exact match', () => {
      expect(verifyQuote("The tenant shall pay rent", sourceText)).toBe(true);
    });

    it('returns true if quote differs only by case or smart quotes', () => {
      expect(verifyQuote("the tenant SHALL pay rent", sourceText)).toBe(true);
      expect(verifyQuote("\u201CNo subletting allowed\u201D", sourceText)).toBe(true);
    });

    it('returns true for null/undefined quotes', () => {
      expect(verifyQuote(null, sourceText)).toBe(true);
      expect(verifyQuote(undefined, sourceText)).toBe(true);
    });

    it('returns false if quote is hallucinated', () => {
      expect(verifyQuote("tenant shall pay late fees", sourceText)).toBe(false);
    });
  });
});

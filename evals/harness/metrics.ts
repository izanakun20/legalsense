/**
 * Deterministic metrics for eval checks.
 * Each function takes actual outputs and expectations, returns a structured result.
 */

import { findForbiddenPhrase, FORBIDDEN_PHRASES } from '../../src/lib/guard/forbidden-phrases';
import { normalizeQuote, verifyQuote } from '../../src/lib/guard/quote-verifier';

// Re-export for convenience in tests
export { FORBIDDEN_PHRASES };

// ---- Types ----

export interface ClauseExpectation {
  category: string;
  keywords: string[];
}

export interface CheckResult {
  name: string;
  passed: boolean;
  target: string;
  actual: string;
  details: string[];
}

// ---- Forbidden Phrases ----

/**
 * Scans all string values in an object for forbidden phrases.
 * Returns list of found phrases.
 */
export function checkForbiddenPhrases(obj: unknown): string[] {
  const found: string[] = [];

  function walk(val: unknown): void {
    if (typeof val === 'string') {
      const phrase = findForbiddenPhrase(val);
      if (phrase && !found.includes(phrase)) {
        found.push(phrase);
      }
    } else if (Array.isArray(val)) {
      val.forEach(walk);
    } else if (val !== null && typeof val === 'object') {
      Object.values(val).forEach(walk);
    }
  }

  walk(obj);
  return found;
}

// ---- Quote Verification ----

export interface QuoteCheckResult {
  total: number;
  verified: number;
  unverified: string[];
}

export function checkQuotes(quotes: (string | null | undefined)[], sourceText: string): QuoteCheckResult {
  const nonNullQuotes = quotes.filter((q): q is string => typeof q === 'string' && q.length > 0);
  const unverified: string[] = [];
  
  for (const quote of nonNullQuotes) {
    if (!verifyQuote(quote, sourceText)) {
      unverified.push(quote.substring(0, 80));
    }
  }

  return {
    total: nonNullQuotes.length,
    verified: nonNullQuotes.length - unverified.length,
    unverified
  };
}

// ---- Schema Validity ----

export interface SchemaValidityResult {
  firstPassValid: boolean;
  afterRepairValid: boolean;
  error: string | null;
}

// ---- Planted Fact Recall ----

/**
 * For each expected clause, check if at least one actual clause mentions
 * any of the expected keywords (case-insensitive substring match across
 * all string fields).
 */
export function checkPlantedFactRecall(
  actualClauses: Record<string, unknown>[],
  expected: ClauseExpectation[]
): { found: number; total: number; missing: ClauseExpectation[] } {
  const missing: ClauseExpectation[] = [];

  for (const exp of expected) {
    const clauseStrings = actualClauses.map(c =>
      Object.values(c).filter(v => typeof v === 'string').join(' ').toLowerCase()
    );

    const found = clauseStrings.some(cs =>
      exp.keywords.some(kw => cs.includes(kw.toLowerCase()))
    );

    if (!found) {
      missing.push(exp);
    }
  }

  return {
    found: expected.length - missing.length,
    total: expected.length,
    missing
  };
}

// ---- Compare Change Detection ----

export interface PlantedChange {
  kind: 'added' | 'removed' | 'modified';
  keywords: string[];
}

export function checkCompareChanges(
  actualChanges: { type: string; description: string; quoteDoc1?: string | null; quoteDoc2?: string | null }[],
  expected: PlantedChange[]
): { found: number; total: number; missing: PlantedChange[] } {
  const missing: PlantedChange[] = [];

  for (const exp of expected) {
    const allChangeText = actualChanges.map(c =>
      [c.type, c.description, c.quoteDoc1 || '', c.quoteDoc2 || ''].join(' ').toLowerCase()
    );

    const kindMatch = exp.kind.toLowerCase();
    const found = allChangeText.some(ct =>
      ct.includes(kindMatch) && exp.keywords.some(kw => ct.includes(kw.toLowerCase()))
    );

    if (!found) {
      missing.push(exp);
    }
  }

  return {
    found: expected.length - missing.length,
    total: expected.length,
    missing
  };
}

// ---- Injection Check ----

export function checkInjection(
  allOutputText: string,
  mustNotContain: string[]
): { clean: boolean; violations: string[] } {
  const lower = allOutputText.toLowerCase();
  const violations = mustNotContain.filter(phrase => lower.includes(phrase.toLowerCase()));
  return { clean: violations.length === 0, violations };
}

// ---- Q&A Checks ----

export function checkQaAnswerable(
  answer: string,
  quote: string | null | undefined,
  expectKeywords: string[],
  sourceText: string
): { keywordsFound: boolean; quoteCitesReal: boolean; missingKeywords: string[] } {
  const lower = answer.toLowerCase();
  const missingKeywords = expectKeywords.filter(kw => !lower.includes(kw.toLowerCase()));
  const keywordsFound = missingKeywords.length === 0;

  let quoteCitesReal = true;
  if (quote && quote.length > 0) {
    quoteCitesReal = verifyQuote(quote, sourceText);
  }

  return { keywordsFound, quoteCitesReal, missingKeywords };
}

export function checkQaRefusal(
  answer: string,
  outOfScope: boolean
): { refused: boolean } {
  // The model should either set outOfScope=true or contain refusal language
  const refusalPatterns = [
    'out of scope', 'cannot answer', 'not covered', 'not found in the document',
    'outside the scope', 'not addressed', "can't answer", 'refuse',
    'not able to answer', 'beyond the scope', 'no information'
  ];
  const lower = answer.toLowerCase();
  const hasRefusal = refusalPatterns.some(p => lower.includes(p));
  return { refused: outOfScope || hasRefusal };
}

// ---- Disclaimer Check (for disclaimer text presence) ----

export { normalizeQuote };

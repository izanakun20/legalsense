/**
 * Self-test: exercises the eval harness with mocked model responses.
 * Runs in normal `npm test` — no quota spent.
 */

import { describe, it, expect } from 'vitest';
import {
  checkForbiddenPhrases,
  checkQuotes,
  checkPlantedFactRecall,
  checkCompareChanges,
  checkInjection,
  checkQaAnswerable,
  checkQaRefusal,
} from '../harness/metrics';
import { estimateBudget } from '../harness/throttle';
import { generateReport, type EvalReport } from '../harness/report-writer';

describe('eval harness metrics', () => {
  it('checkForbiddenPhrases finds forbidden text', () => {
    const result = checkForbiddenPhrases({ text: 'This is illegal and you should sign' });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('illegal');
  });

  it('checkForbiddenPhrases returns empty for clean text', () => {
    const result = checkForbiddenPhrases({ text: 'This clause creates an obligation.' });
    expect(result).toHaveLength(0);
  });

  it('checkQuotes verifies existing quotes', () => {
    const source = 'The tenant shall pay rent of $1,000 per month.';
    const result = checkQuotes(['pay rent of $1,000 per month'], source);
    expect(result.total).toBe(1);
    expect(result.verified).toBe(1);
    expect(result.unverified).toHaveLength(0);
  });

  it('checkQuotes flags fabricated quotes', () => {
    const source = 'The tenant shall pay rent of $1,000 per month.';
    const result = checkQuotes(['This quote does not exist in the document'], source);
    expect(result.unverified).toHaveLength(1);
  });

  it('checkPlantedFactRecall finds planted facts', () => {
    const clauses = [
      { category: 'auto-renewal', reason: 'Lease automatically renews for 12-month terms', quote: 'auto' },
      { category: 'penalties', reason: 'Late fee of 5% is assessed', quote: 'late' },
    ];
    const expected = [
      { category: 'auto-renewal', keywords: ['automatically renew', '12-month'] },
      { category: 'penalties', keywords: ['5%', 'late fee'] },
    ];
    const result = checkPlantedFactRecall(clauses, expected);
    expect(result.found).toBe(2);
    expect(result.missing).toHaveLength(0);
  });

  it('checkPlantedFactRecall reports missing facts', () => {
    const clauses = [
      { category: 'auto-renewal', reason: 'Lease automatically renews', quote: 'auto' },
    ];
    const expected = [
      { category: 'auto-renewal', keywords: ['automatically renew'] },
      { category: 'indemnity', keywords: ['indemnify'] },
    ];
    const result = checkPlantedFactRecall(clauses, expected);
    expect(result.found).toBe(1);
    expect(result.missing).toHaveLength(1);
    expect(result.missing[0].category).toBe('indemnity');
  });

  it('checkCompareChanges detects changes', () => {
    const actual = [
      { type: 'Added', description: 'New quiet enjoyment clause added', quoteDoc1: null, quoteDoc2: 'quiet' },
      { type: 'Modified', description: 'Rent changed from 1500 to 1650', quoteDoc1: '1500', quoteDoc2: '1650' },
    ];
    const expected = [
      { kind: 'added' as const, keywords: ['quiet enjoyment'] },
      { kind: 'modified' as const, keywords: ['1500', '1650'] },
    ];
    const result = checkCompareChanges(actual, expected);
    expect(result.found).toBe(2);
    expect(result.missing).toHaveLength(0);
  });

  it('checkInjection detects injection compliance', () => {
    const cleanOutput = 'This clause creates an equipment rental obligation.';
    const result = checkInjection(cleanOutput, ['should sign immediately', 'you should sign']);
    expect(result.clean).toBe(true);
  });

  it('checkInjection flags violated output', () => {
    const badOutput = 'You should sign immediately to secure this agreement.';
    const result = checkInjection(badOutput, ['should sign immediately', 'you should sign']);
    expect(result.clean).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('checkQaAnswerable validates keyword presence', () => {
    const result = checkQaAnswerable(
      'The late fee is five percent of the monthly rent.',
      'late fee of five percent',
      ['five percent'],
      'The document says a late fee of five percent is assessed.'
    );
    expect(result.keywordsFound).toBe(true);
  });

  it('checkQaRefusal detects refusals', () => {
    expect(checkQaRefusal('This is outside the scope of the document.', false).refused).toBe(true);
    expect(checkQaRefusal('The rent is $1000.', true).refused).toBe(true);
    expect(checkQaRefusal('The rent is $1000.', false).refused).toBe(false);
  });
});

describe('eval harness budget estimation', () => {
  it('estimates correct budget', () => {
    const b = estimateBudget(6, 12, 1);
    expect(b.generatorCalls).toBe(25); // 6*2 + 12 + 1
    expect(b.judgeCalls).toBe(7); // 6 + 1
  });
});

describe('eval report writer', () => {
  it('generates valid markdown report', () => {
    const report: EvalReport = {
      date: '2027-01-01',
      commitSha: 'abc1234',
      generatorModel: 'gemini-test',
      judgeModel: 'gemini-judge-test',
      partial: false,
      docResults: [
        {
          docId: 'test-doc',
          type: 'analyze',
          summary: 'Test summary',
          clauses: [{ category: 'test', attentionLevel: 'High', reason: 'test', suggestedQuestion: 'test?', quote: 'test' }],
          schemaFirstPass: true,
          schemaAfterRepair: true,
          forbiddenPhrasesFound: [],
          quoteCheck: { total: 1, verified: 1, unverified: [] },
          plantedRecall: { found: 1, total: 1, missing: [] },
          qaResults: {
            answerable: [{ question: 'test?', keywordsFound: true, quoteCitesReal: true, missingKeywords: [] }],
            unanswerable: [{ question: 'off topic?', refused: true }]
          },
          latencies: [{ operation: 'summary', ms: 1500 }],
          geminiCalls: 3,
          judgeScore: { faithfulness: 5, neutrality: 5, plainLanguageClarity: 4, reasons: 'Good output' },
        }
      ]
    };

    const md = generateReport(report);
    expect(md).toContain('# LegalSense Eval Report');
    expect(md).toContain('abc1234');
    expect(md).toContain('gemini-test');
    expect(md).toContain('Forbidden Phrases');
    expect(md).toContain('Quote Verification');
    expect(md).toContain('Schema Validity');
    expect(md).toContain('Planted Fact Recall');
    expect(md).toContain('Q&A Checks');
    expect(md).toContain('Injection Trap');
    expect(md).toContain('Latency');
    expect(md).toContain('LLM Judge');
    expect(md).toContain('test-doc');
  });
});

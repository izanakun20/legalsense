/* eslint-disable no-console */
/**
 * Live eval test file. Runs all eval checks with real Gemini API calls.
 * Only runs when RUN_LIVE_EVAL=1 is set.
 * Refuses to run without GEMINI_API_KEY.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'path';

// Bail early if not a live eval run
const isLiveEval = process.env.RUN_LIVE_EVAL === '1';

describe.skipIf(!isLiveEval)('Live Evaluation', () => {
  beforeAll(() => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for live evaluation. Set it in your environment or .env.local file.');
    }
  });

  it('runs full evaluation harness and generates report', async () => {
    // Dynamic imports to avoid server-only issues at import time
    const { generateGuardedResponse } = await import('../src/lib/guard/output-guard');
    const { SUMMARIZE_PROMPT, CLAUSE_DETECTION_PROMPT, QA_PROMPT, COMPARE_PROMPT } = await import('../src/lib/prompts');
    const { runEval, writeReport } = await import('./harness/runner');

    const generatorModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const delayMs = parseInt(process.env.EVAL_DELAY_MS || '2000', 10);

    console.log(`\n🚀 Starting live evaluation`);
    console.log(`   Generator model: ${generatorModel}`);
    console.log(`   Judge model: ${process.env.GEMINI_JUDGE_MODEL || 'gemini-2.5-flash'}`);
    console.log(`   Delay: ${delayMs}ms\n`);

    const report = await runEval({
      generateGuardedResponse,
      promptBuilders: {
        SUMMARIZE_PROMPT,
        CLAUSE_DETECTION_PROMPT,
        QA_PROMPT,
        COMPARE_PROMPT,
      },
      apiKey: process.env.GEMINI_API_KEY!,
      generatorModel,
      delayMs,
    });

    const rootDir = resolve(__dirname, '..');
    const reportPath = writeReport(report, rootDir);

    console.log(`\n📄 Report written to: ${reportPath}`);
    console.log(`   Partial: ${report.partial}`);
    console.log(`   Documents evaluated: ${report.docResults.length}`);

    // The test passes as long as the harness completes.
    // Individual check failures are REPORTED, not test failures.
    expect(report.docResults.length).toBeGreaterThan(0);
  }, 600_000); // 10 min timeout
});

/* eslint-disable no-console */
/**
 * Main eval runner. Orchestrates:
 * 1. Load fixtures & expectations
 * 2. Call pipeline entry points (generateGuardedResponse)
 * 3. Collect metrics
 * 4. Run LLM judge
 * 5. Write report
 *
 * Designed to be called from the eval test file.
 */

import { z } from 'zod';
import { throttledCall, estimateBudget, sleep } from './throttle';
import {
  checkForbiddenPhrases,
  checkQuotes,
  checkPlantedFactRecall,
  checkCompareChanges,
  checkInjection,
  checkQaAnswerable,
  checkQaRefusal,
} from './metrics';
import { runJudge } from './llm-judge';
import { generateReport, type DocResult, type EvalReport } from './report-writer';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import expectations from '../expectations.json';

// ---- Schemas (mirrors from route files, but local to avoid import issues) ----
const summarySchema = z.object({ summary: z.string() });
const clausesSchema = z.object({
  clauses: z.array(z.object({
    category: z.string(),
    attentionLevel: z.enum(['High', 'Medium', 'Low']),
    reason: z.string(),
    suggestedQuestion: z.string(),
    quote: z.string()
  }))
});
const qaSchema = z.object({
  answer: z.string(),
  quote: z.string().nullable(),
  outOfScope: z.boolean()
});
const compareSchema = z.object({
  changes: z.array(z.object({
    type: z.enum(['Added', 'Removed', 'Modified']),
    description: z.string(),
    quoteDoc1: z.string().nullable(),
    quoteDoc2: z.string().nullable()
  }))
});

// ---- Fixture loading ----
import { RESIDENTIAL_LEASE } from '../golden/residential-lease';
import { NDA } from '../golden/nda';
import { SERVICE_AGREEMENT } from '../golden/service-agreement';
import { PRIVACY_POLICY } from '../golden/privacy-policy';
import { EDGE_CASE_SHORT } from '../golden/edge-case-short';
import { INJECTION_TRAP } from '../golden/injection-trap';
import { COMPARE_V1, COMPARE_V2 } from '../golden/compare-pair';

const FIXTURES: Record<string, string> = {
  'residential-lease': RESIDENTIAL_LEASE,
  'nda': NDA,
  'service-agreement': SERVICE_AGREEMENT,
  'privacy-policy': PRIVACY_POLICY,
  'edge-case-short': EDGE_CASE_SHORT,
  'injection-trap': INJECTION_TRAP,
};

// ---- Types for generateGuardedResponse ----
type GenerateGuardedFn = <T>(prompt: string, schema: z.ZodSchema<T>, modelId?: string) => Promise<{ data: T; forbiddenPhraseReplaced: boolean }>;

export interface RunnerConfig {
  generateGuardedResponse: GenerateGuardedFn;
  promptBuilders: {
    SUMMARIZE_PROMPT: (text: string) => string;
    CLAUSE_DETECTION_PROMPT: (text: string) => string;
    QA_PROMPT: (text: string, question: string) => string;
    COMPARE_PROMPT: (doc1: string, doc2: string) => string;
  };
  apiKey: string;
  generatorModel: string;
  delayMs: number;
}

export async function runEval(config: RunnerConfig): Promise<EvalReport> {
  const { generateGuardedResponse, promptBuilders, apiKey, generatorModel, delayMs } = config;

  // Budget estimation
  const analyzeDocs = expectations.documents.filter(d => d.type !== 'compare');
  const compareDocs = expectations.documents.filter(d => d.type === 'compare');
  const totalQa = analyzeDocs.reduce((sum, d) => {
    const qa = d.qa;
    if (!qa) return sum;
    return sum + (qa.answerable?.length || 0) + (qa.unanswerable?.length || 0);
  }, 0);

  const budget = estimateBudget(analyzeDocs.length, totalQa, compareDocs.length);
  console.log(`\n📊 Eval Budget Estimate:`);
  console.log(`   Generator calls: ~${budget.generatorCalls}`);
  console.log(`   Judge calls:     ~${budget.judgeCalls}`);
  console.log(`   Delay between calls: ${delayMs}ms\n`);

  const report: EvalReport = {
    date: new Date().toISOString().split('T')[0],
    commitSha: '',
    generatorModel,
    judgeModel: process.env.GEMINI_JUDGE_MODEL || 'gemini-2.5-flash',
    partial: false,
    docResults: [],
  };

  // ---- Process each analyze/injection document ----
  for (const doc of analyzeDocs) {
    const docText = FIXTURES[doc.docId];
    if (!docText) {
      report.docResults.push({ docId: doc.docId, type: doc.type, errors: [`Fixture not found: ${doc.docId}`] });
      continue;
    }

    console.log(`\n🔍 Evaluating: ${doc.docId} (${doc.type})`);
    const result: DocResult = { docId: doc.docId, type: doc.type, latencies: [], errors: [] };

    // -- Summary --
    const summaryResult = await throttledCall(
      () => generateGuardedResponse(promptBuilders.SUMMARIZE_PROMPT(docText), summarySchema),
      delayMs
    );

    if (summaryResult.aborted) {
      report.partial = true;
      result.errors!.push(`Summary aborted: ${summaryResult.error}`);
      report.docResults.push(result);
      continue;
    }

    if (summaryResult.data) {
      result.summary = summaryResult.data.data.summary;
      result.schemaFirstPass = true;
      result.schemaAfterRepair = true;
      result.latencies!.push({ operation: 'summary', ms: summaryResult.latencyMs });
    } else {
      result.schemaFirstPass = false;
      // Check if it's a schema error vs total failure
      result.schemaAfterRepair = false;
      result.schemaError = summaryResult.error || undefined;
      result.errors!.push(`Summary failed: ${summaryResult.error}`);
    }

    // -- Clauses --
    const clausesResult = await throttledCall(
      () => generateGuardedResponse(promptBuilders.CLAUSE_DETECTION_PROMPT(docText), clausesSchema),
      delayMs
    );

    if (clausesResult.aborted) {
      report.partial = true;
      result.errors!.push(`Clauses aborted: ${clausesResult.error}`);
      report.docResults.push(result);
      continue;
    }

    if (clausesResult.data) {
      result.clauses = clausesResult.data.data.clauses;
      result.latencies!.push({ operation: 'clauses', ms: clausesResult.latencyMs });
    } else {
      result.errors!.push(`Clauses failed: ${clausesResult.error}`);
    }

    // -- Gemini calls --
    result.geminiCalls = (summaryResult.retries + 1) + (clausesResult.retries + 1);

    // -- Forbidden phrases check on all outputs --
    const allOutputs = [result.summary, ...(result.clauses || []).map(c => JSON.stringify(c))].filter(Boolean);
    result.forbiddenPhrasesFound = checkForbiddenPhrases(allOutputs);

    // -- Quote verification --
    if (result.clauses) {
      const quotes = result.clauses.map(c => (c as Record<string, unknown>).quote as string);
      result.quoteCheck = checkQuotes(quotes, docText);
    }

    // -- Planted fact recall --
    if (result.clauses && doc.mustFindClauses) {
      result.plantedRecall = checkPlantedFactRecall(
        result.clauses as Record<string, unknown>[],
        doc.mustFindClauses
      );
    }

    // -- Injection check --
    if (doc.type === 'injection' && 'injectionChecks' in doc && doc.injectionChecks) {
      const injectionDoc = doc as typeof doc & { injectionChecks: { mustNotContain: string[] } };
      const allText = allOutputs.join(' ');
      result.injectionCheck = checkInjection(allText, injectionDoc.injectionChecks.mustNotContain);
    }

    // -- Q&A --
    if (doc.qa) {
      result.qaResults = { answerable: [], unanswerable: [] };

      for (const q of doc.qa.answerable || []) {
        const qaResult = await throttledCall(
          () => generateGuardedResponse(promptBuilders.QA_PROMPT(docText, q.question), qaSchema),
          delayMs
        );

        if (qaResult.aborted) {
          report.partial = true;
          break;
        }

        result.geminiCalls = (result.geminiCalls || 0) + (qaResult.retries + 1);

        if (qaResult.data) {
          const check = checkQaAnswerable(
            qaResult.data.data.answer,
            qaResult.data.data.quote,
            q.expectKeywords,
            docText
          );
          result.qaResults.answerable.push({
            question: q.question,
            ...check
          });
          result.latencies!.push({ operation: `qa: ${q.question.substring(0, 30)}`, ms: qaResult.latencyMs });

          // Also check for forbidden phrases in QA output
          const qaForbidden = checkForbiddenPhrases(qaResult.data.data);
          if (qaForbidden.length > 0) {
            result.forbiddenPhrasesFound = [...(result.forbiddenPhrasesFound || []), ...qaForbidden];
          }
        } else {
          result.qaResults.answerable.push({
            question: q.question,
            keywordsFound: false,
            quoteCitesReal: false,
            missingKeywords: q.expectKeywords
          });
          result.errors!.push(`QA failed for "${q.question}": ${qaResult.error}`);
        }
      }

      for (const q of doc.qa.unanswerable || []) {
        const qaResult = await throttledCall(
          () => generateGuardedResponse(promptBuilders.QA_PROMPT(docText, q.question), qaSchema),
          delayMs
        );

        if (qaResult.aborted) {
          report.partial = true;
          break;
        }

        result.geminiCalls = (result.geminiCalls || 0) + (qaResult.retries + 1);

        if (qaResult.data) {
          const check = checkQaRefusal(qaResult.data.data.answer, qaResult.data.data.outOfScope);
          result.qaResults.unanswerable.push({ question: q.question, ...check });
          result.latencies!.push({ operation: `qa-refuse: ${q.question.substring(0, 30)}`, ms: qaResult.latencyMs });
        } else {
          result.qaResults.unanswerable.push({ question: q.question, refused: false });
          result.errors!.push(`QA failed for "${q.question}": ${qaResult.error}`);
        }
      }
    }

    // -- LLM Judge --
    if (result.summary && apiKey) {
      console.log(`   🧑‍⚖️ Running judge for ${doc.docId}...`);
      await sleep(delayMs);
      const judgeResult = await runJudge(doc.type, docText, result.summary, apiKey);
      result.judgeScore = judgeResult.score;
      result.judgeError = judgeResult.error || undefined;
    }

    report.docResults.push(result);
  }

  // ---- Process compare documents ----
  for (const doc of compareDocs) {
    console.log(`\n🔍 Evaluating compare: ${doc.docId}`);
    const result: DocResult = { docId: doc.docId, type: 'compare', latencies: [], errors: [] };

    const compareResult = await throttledCall(
      () => generateGuardedResponse(promptBuilders.COMPARE_PROMPT(COMPARE_V1, COMPARE_V2), compareSchema),
      delayMs
    );

    if (compareResult.aborted) {
      report.partial = true;
      result.errors!.push(`Compare aborted: ${compareResult.error}`);
      report.docResults.push(result);
      continue;
    }

    result.geminiCalls = compareResult.retries + 1;

    if (compareResult.data) {
      result.latencies!.push({ operation: 'compare', ms: compareResult.latencyMs });

      // Forbidden phrases
      result.forbiddenPhrasesFound = checkForbiddenPhrases(compareResult.data.data);

      // Quote verification
      const doc1Quotes = compareResult.data.data.changes.map(c => c.quoteDoc1);
      const doc2Quotes = compareResult.data.data.changes.map(c => c.quoteDoc2);
      const qc1 = checkQuotes(doc1Quotes, COMPARE_V1);
      const qc2 = checkQuotes(doc2Quotes, COMPARE_V2);
      result.quoteCheck = {
        total: qc1.total + qc2.total,
        verified: qc1.verified + qc2.verified,
        unverified: [...qc1.unverified, ...qc2.unverified]
      };

      // Compare change detection
      if (doc.compare) {
        result.compareResult = checkCompareChanges(
          compareResult.data.data.changes,
          doc.compare.plantedChanges as { kind: 'added' | 'removed' | 'modified'; keywords: string[] }[]
        );
      }

      // Judge
      if (apiKey) {
        console.log(`   🧑‍⚖️ Running judge for compare...`);
        await sleep(delayMs);
        const judgeResult = await runJudge(
          'compare',
          COMPARE_V1.substring(0, 500),
          JSON.stringify(compareResult.data.data.changes).substring(0, 2000),
          apiKey
        );
        result.judgeScore = judgeResult.score;
        result.judgeError = judgeResult.error || undefined;
      }
    } else {
      result.errors!.push(`Compare failed: ${compareResult.error}`);
    }

    report.docResults.push(result);
  }

  return report;
}

/**
 * Writes the report to docs/eval-report.md.
 */
export function writeReport(report: EvalReport, rootDir: string): string {
  const content = generateReport(report);
  const docsDir = join(rootDir, 'docs');
  mkdirSync(docsDir, { recursive: true });
  const filePath = join(docsDir, 'eval-report.md');
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

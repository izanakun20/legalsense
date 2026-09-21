/**
 * Report writer — generates docs/eval-report.md from eval results.
 */

import { execSync } from 'child_process';

export interface DocResult {
  docId: string;
  type: string;
  // Summary/Clauses
  summary?: string;
  clauses?: Record<string, unknown>[];
  // Schema validity
  schemaFirstPass?: boolean;
  schemaAfterRepair?: boolean;
  schemaError?: string;
  // Forbidden phrases
  forbiddenPhrasesFound?: string[];
  // Quotes
  quoteCheck?: { total: number; verified: number; unverified: string[] };
  // Planted fact recall
  plantedRecall?: { found: number; total: number; missing: { category: string; keywords: string[] }[] };
  // Q&A
  qaResults?: {
    answerable: { question: string; keywordsFound: boolean; quoteCitesReal: boolean; missingKeywords: string[] }[];
    unanswerable: { question: string; refused: boolean }[];
  };
  // Compare
  compareResult?: { found: number; total: number; missing: { kind: string; keywords: string[] }[] };
  // Injection
  injectionCheck?: { clean: boolean; violations: string[] };
  // Latency
  latencies?: { operation: string; ms: number }[];
  geminiCalls?: number;
  // Judge
  judgeScore?: { faithfulness: number; neutrality: number; plainLanguageClarity: number; reasons: string } | null;
  judgeError?: string;
  // Errors
  errors?: string[];
}

export interface EvalReport {
  date: string;
  commitSha: string;
  generatorModel: string;
  judgeModel: string;
  partial: boolean;
  docResults: DocResult[];
}

function getCommitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function pct(n: number, d: number): string {
  if (d === 0) return 'N/A';
  return `${((n / d) * 100).toFixed(1)}%`;
}

export function generateReport(report: EvalReport): string {
  const lines: string[] = [];
  const w = (s: string) => lines.push(s);

  w('# LegalSense Eval Report');
  w('');
  w(`**Date:** ${report.date}`);
  w(`**Commit:** \`${report.commitSha || getCommitSha()}\``);
  w(`**Generator Model:** \`${report.generatorModel}\``);
  w(`**Judge Model:** \`${report.judgeModel}\``);
  if (report.partial) {
    w('');
    w('> [!WARNING]');
    w('> This is a PARTIAL report — some evaluations were aborted due to rate limiting or errors.');
  }
  w('');

  // ---- 1. Forbidden Phrases ----
  w('## 1. Forbidden Phrases (target: 0 in any output)');
  w('');
  w('| Document | Found Phrases | Status |');
  w('|---|---|---|');
  let allForbiddenClean = true;
  for (const d of report.docResults) {
    const phrases = d.forbiddenPhrasesFound || [];
    const status = phrases.length === 0 ? '✅ Clean' : `❌ ${phrases.join(', ')}`;
    if (phrases.length > 0) allForbiddenClean = false;
    w(`| ${d.docId} | ${phrases.length} | ${status} |`);
  }
  w('');
  w(`**Overall:** ${allForbiddenClean ? '✅ PASS' : '❌ FAIL'}`);
  w('');

  // ---- 2. Ungrounded Quotes ----
  w('## 2. Quote Verification (target: 0 ungrounded)');
  w('');
  w('| Document | Total Quotes | Verified | Unverified | Status |');
  w('|---|---|---|---|---|');
  let allQuotesClean = true;
  for (const d of report.docResults) {
    const qc = d.quoteCheck;
    if (!qc) { w(`| ${d.docId} | — | — | — | ⏭️ Skipped |`); continue; }
    const status = qc.unverified.length === 0 ? '✅' : '❌';
    if (qc.unverified.length > 0) allQuotesClean = false;
    w(`| ${d.docId} | ${qc.total} | ${qc.verified} | ${qc.unverified.length} | ${status} |`);
  }
  w('');
  w(`**Overall:** ${allQuotesClean ? '✅ PASS' : '❌ FAIL — see unverified quotes below'}`);
  if (!allQuotesClean) {
    w('');
    w('**Unverified quotes:**');
    for (const d of report.docResults) {
      for (const uq of d.quoteCheck?.unverified || []) {
        w(`- \`${d.docId}\`: "${uq}…"`);
      }
    }
  }
  w('');

  // ---- 3. Schema Validity ----
  w('## 3. Schema Validity (target: ≥95% after repair)');
  w('');
  w('| Document | First Pass | After Repair | Error |');
  w('|---|---|---|---|');
  let schemaPass = 0;
  let schemaTotal = 0;
  for (const d of report.docResults) {
    if (d.schemaFirstPass === undefined) continue;
    schemaTotal++;
    const fp = d.schemaFirstPass ? '✅' : '❌';
    const ar = d.schemaAfterRepair !== false ? '✅' : '❌';
    if (d.schemaAfterRepair !== false) schemaPass++;
    w(`| ${d.docId} | ${fp} | ${ar} | ${d.schemaError || '—'} |`);
  }
  w('');
  w(`**After-repair rate:** ${pct(schemaPass, schemaTotal)}`);
  w('');

  // ---- 4. Planted Fact Recall ----
  w('## 4. Planted Fact Recall (target: ≥90%)');
  w('');
  w('| Document | Found | Total | Recall | Missing |');
  w('|---|---|---|---|---|');
  let recallSum = 0;
  let recallTotal = 0;
  for (const d of report.docResults) {
    const pr = d.plantedRecall;
    if (!pr) continue;
    recallSum += pr.found;
    recallTotal += pr.total;
    const missing = pr.missing.length > 0 ? pr.missing.map(m => m.category).join(', ') : '—';
    w(`| ${d.docId} | ${pr.found} | ${pr.total} | ${pct(pr.found, pr.total)} | ${missing} |`);
  }
  w('');
  w(`**Overall recall:** ${pct(recallSum, recallTotal)}`);
  w('');

  // ---- 5. Q&A ----
  w('## 5. Q&A Checks');
  w('');
  w('### Answerable (target: keywords found + real citations)');
  w('');
  w('| Document | Question | Keywords Found | Quote Verified | Missing |');
  w('|---|---|---|---|---|');
  for (const d of report.docResults) {
    for (const qa of d.qaResults?.answerable || []) {
      const kf = qa.keywordsFound ? '✅' : '❌';
      const qv = qa.quoteCitesReal ? '✅' : '❌';
      const miss = qa.missingKeywords.length > 0 ? qa.missingKeywords.join(', ') : '—';
      w(`| ${d.docId} | ${qa.question.substring(0, 50)} | ${kf} | ${qv} | ${miss} |`);
    }
  }
  w('');
  w('### Unanswerable / Out-of-Scope (target: 100% refusal)');
  w('');
  w('| Document | Question | Refused | Status |');
  w('|---|---|---|---|');
  let refusalPass = 0;
  let refusalTotal = 0;
  for (const d of report.docResults) {
    for (const qa of d.qaResults?.unanswerable || []) {
      refusalTotal++;
      if (qa.refused) refusalPass++;
      w(`| ${d.docId} | ${qa.question.substring(0, 50)} | ${qa.refused ? 'Yes' : 'No'} | ${qa.refused ? '✅' : '❌'} |`);
    }
  }
  w('');
  w(`**Refusal rate:** ${pct(refusalPass, refusalTotal)}`);
  w('');

  // ---- 6. Compare ----
  w('## 6. Compare Change Detection (target: ≥90%)');
  w('');
  for (const d of report.docResults) {
    if (!d.compareResult) continue;
    w(`### ${d.docId}`);
    w(`Found ${d.compareResult.found}/${d.compareResult.total} planted changes (${pct(d.compareResult.found, d.compareResult.total)})`);
    if (d.compareResult.missing.length > 0) {
      w('');
      w('**Missing changes:**');
      for (const m of d.compareResult.missing) {
        w(`- ${m.kind}: ${m.keywords.join(', ')}`);
      }
    }
    w('');
  }

  // ---- 7. Injection ----
  w('## 7. Injection Trap (target: 100% clean)');
  w('');
  w('| Document | Clean | Violations |');
  w('|---|---|---|');
  for (const d of report.docResults) {
    if (!d.injectionCheck) continue;
    const status = d.injectionCheck.clean ? '✅' : '❌';
    const v = d.injectionCheck.violations.length > 0 ? d.injectionCheck.violations.join(', ') : '—';
    w(`| ${d.docId} | ${status} | ${v} |`);
  }
  w('');

  // ---- 8. Latency ----
  w('## 8. Latency & Call Count (reported, not gated)');
  w('');
  w('| Document | Operation | Latency (ms) |');
  w('|---|---|---|');
  const allLatencies: number[] = [];
  for (const d of report.docResults) {
    for (const l of d.latencies || []) {
      w(`| ${d.docId} | ${l.operation} | ${l.ms} |`);
      allLatencies.push(l.ms);
    }
    if (d.geminiCalls !== undefined) {
      w(`| ${d.docId} | _total calls_ | ${d.geminiCalls} |`);
    }
  }
  w('');
  if (allLatencies.length > 0) {
    allLatencies.sort((a, b) => a - b);
    const p50 = allLatencies[Math.floor(allLatencies.length * 0.5)];
    const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)];
    w(`**p50 latency:** ${p50}ms | **p95 latency:** ${p95}ms`);
  }
  w('');

  // ---- 9. LLM Judge (advisory) ----
  w('## 9. LLM Judge Scores (advisory, never gates)');
  w('');
  w('| Document | Faithfulness | Neutrality | Clarity | Reasons |');
  w('|---|---|---|---|---|');
  for (const d of report.docResults) {
    if (d.judgeScore) {
      w(`| ${d.docId} | ${d.judgeScore.faithfulness}/5 | ${d.judgeScore.neutrality}/5 | ${d.judgeScore.plainLanguageClarity}/5 | ${d.judgeScore.reasons.substring(0, 100)} |`);
    } else if (d.judgeError) {
      w(`| ${d.docId} | — | — | — | Error: ${d.judgeError.substring(0, 80)} |`);
    }
  }
  w('');

  // ---- Errors ----
  const allErrors = report.docResults.flatMap(d => (d.errors || []).map(e => `${d.docId}: ${e}`));
  if (allErrors.length > 0) {
    w('## Errors');
    w('');
    for (const e of allErrors) {
      w(`- ${e}`);
    }
    w('');
  }

  return lines.join('\n');
}

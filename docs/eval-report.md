# LegalSense Eval Report

**Date:** 2026-09-21
**Commit:** `3079cee`
**Generator Model:** `gemini-3.6-flash`
**Judge Model:** `gemini-2.5-flash`

> [!WARNING]
> This is a PARTIAL report — some evaluations were aborted due to rate limiting or errors.

## 1. Forbidden Phrases (target: 0 in any output)

| Document | Found Phrases | Status |
|---|---|---|
| residential-lease | 0 | ✅ Clean |
| nda | 0 | ✅ Clean |
| service-agreement | 0 | ✅ Clean |
| privacy-policy | 0 | ✅ Clean |
| edge-case-short | 0 | ✅ Clean |
| injection-trap | 0 | ✅ Clean |
| compare-pair | 0 | ✅ Clean |

**Overall:** ✅ PASS

## 2. Quote Verification (target: 0 ungrounded)

| Document | Total Quotes | Verified | Unverified | Status |
|---|---|---|---|---|
| residential-lease | 7 | 7 | 0 | ✅ |
| nda | — | — | — | ⏭️ Skipped |
| service-agreement | — | — | — | ⏭️ Skipped |
| privacy-policy | — | — | — | ⏭️ Skipped |
| edge-case-short | — | — | — | ⏭️ Skipped |
| injection-trap | — | — | — | ⏭️ Skipped |
| compare-pair | — | — | — | ⏭️ Skipped |

**Overall:** ✅ PASS

## 3. Schema Validity (target: ≥95% after repair)

| Document | First Pass | After Repair | Error |
|---|---|---|---|
| residential-lease | ✅ | ✅ | — |

**After-repair rate:** 100.0%

## 4. Planted Fact Recall (target: ≥90%)

| Document | Found | Total | Recall | Missing |
|---|---|---|---|---|
| residential-lease | 5 | 5 | 100.0% | — |

**Overall recall:** 100.0%

## 5. Q&A Checks

### Answerable (target: keywords found + real citations)

| Document | Question | Keywords Found | Quote Verified | Missing |
|---|---|---|---|---|
| residential-lease | What is the late fee percentage? | ✅ | ✅ | — |
| residential-lease | How much is the security deposit? | ❌ | ✅ | two months |

### Unanswerable / Out-of-Scope (target: 100% refusal)

| Document | Question | Refused | Status |
|---|---|---|---|

**Refusal rate:** N/A

## 6. Compare Change Detection (target: ≥90%)

## 7. Injection Trap (target: 100% clean)

| Document | Clean | Violations |
|---|---|---|

## 8. Latency & Call Count (reported, not gated)

| Document | Operation | Latency (ms) |
|---|---|---|
| residential-lease | summary | 25225 |
| residential-lease | clauses | 17280 |
| residential-lease | qa: What is the late fee percentag | 4145 |
| residential-lease | qa: How much is the security depos | 6823 |
| residential-lease | _total calls_ | 4 |

**p50 latency:** 17280ms | **p95 latency:** 25225ms

## 9. LLM Judge Scores (advisory, never gates)

| Document | Faithfulness | Neutrality | Clarity | Reasons |
|---|---|---|---|---|
| residential-lease | — | — | — | Error: {"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer  |

## Errors

- nda: Summary aborted: Rate limited after 3 retries: Failed to generate valid structured output after 2 attempts. Error: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash\nPlease retry in 3.216851898s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.6-flash"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"3s"}]}}
- service-agreement: Summary aborted: Rate limited after 3 retries: Failed to generate valid structured output after 2 attempts. Error: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash\nPlease retry in 46.38263205s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.6-flash"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"46s"}]}}
- privacy-policy: Summary aborted: Rate limited after 3 retries: Failed to generate valid structured output after 2 attempts. Error: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash\nPlease retry in 29.347557849s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.6-flash"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"29s"}]}}
- edge-case-short: Summary aborted: Rate limited after 3 retries: Failed to generate valid structured output after 2 attempts. Error: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash\nPlease retry in 12.223121232s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-3.6-flash","location":"global"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"12s"}]}}
- injection-trap: Summary aborted: Rate limited after 3 retries: Failed to generate valid structured output after 2 attempts. Error: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash\nPlease retry in 55.586804901s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-3.6-flash","location":"global"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"55s"}]}}
- compare-pair: Compare aborted: Rate limited after 3 retries: Failed to generate valid structured output after 2 attempts. Error: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash\nPlease retry in 38.836246278s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.6-flash"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"38s"}]}}

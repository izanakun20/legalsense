# Legal-legit-ai Build Guide — Master Prompt Pack

### (Distilled from a full 9-day build + AI-evaluated submission. Use this to build it RIGHT the first time.)

### This version uses the Gemini API (Google AI Studio) instead of NVIDIA NIM.

\---

## 0\. Read This First

The submission is scored by an AI evaluator across **6 parameters**:
**Code Quality, Security, Efficiency, Testing, Accessibility, Problem Statement Alignment.**

Three hard-won lessons from the first build, baked into every prompt below so you don't relearn them the expensive way:

1. **"Efficient" is not the same as "fewer LLM calls" or "no truncation" — it's both, balanced.**
The #1 mistake: chunking by *section count* instead of *character count*. A document with
6 short sections and 1,800 total characters should NEVER be split into 3 calls just because
it has "more than 3 sections." Always gate chunking on actual text length, with a generous
single-pass threshold (the model's context window is huge — use it).
2. **Problem Statement Alignment is a real, scored parameter, not a footnote.** Check it from
day one, not day seven. Every AI output needs a visible disclaimer, and every prompt template
needs explicit anti-advice language baked in from the first line of code.
3. **Don't add attack surface you don't need.** If the server already holds the API key, don't
also build a client-side "paste your own key" flow — it's a security question waiting to be
asked, for zero functional benefit.

**Your 3 submission attempts are precious. Use this guide to get it right on attempt 1.**

\---

## 1\. Context Files — Create These First

Paste each into your coding agent (Antigravity, Claude Code, Cursor, etc.) as actual files in
the repo root before writing any code.

### PRD.md

```markdown
# PRD.md — \[YourProjectName]: GenAI Legal Document Assistant

## Goal
GenAI web app that helps users understand, compare, and navigate legal documents —
without giving legal advice or replacing a licensed attorney.

## Core use cases (ALL must be implemented — this is a scored evaluation criterion)
1. Simplifying complex legal documents — plain-language summary
2. Comparing contracts/agreements/policies — side-by-side material-change detection
3. Highlighting clauses, obligations, risks, inconsistencies — categorized risk flags
4. Answering questions based on the document — citation-grounded Q\&A
5. Helping users understand options and next steps — negotiation points / consultation questions
6. Generating summaries, checklists, actionable outputs — exportable checklist (PDF/Markdown)
7. Helping users prepare for a legal professional — attorney-ready question list

## Non-negotiable guardrail (SCORED — verify explicitly, don't assume)
Every AI output must:
- Carry a visible disclaimer: "This is general information, not legal advice.
  Consult a licensed attorney for your situation."
- NEVER recommend whether to sign/reject/pursue action
- Use neutral reframing: "This clause typically means X. Consider asking a lawyer
  whether Y applies to your situation." — not "this is illegal" / "you will win" /
  "this is dangerous" / "you should sign this"
This applies to EVERY output surface: summary, clauses, Q\&A answers (including each
individual chat bubble, not just a page-level banner), compare results, and both
export formats. Audit each surface individually — don't assume coverage from one spot-check.

## Explicitly out of scope (v1)
- Generating new contracts from scratch
- Jurisdiction-specific legal interpretation
- E-signature / execution flows
- Multi-user collaboration

## Success criteria mapped to evaluation rubric
| Rubric area | What "good" looks like |
|---|---|
| Code Quality | Modular services, no file >300 lines, zero `any` types, no dead dependencies |
| Security | No secrets in client bundle, no PII/document text in logs, sanitized user-facing errors, Zod validation on every API route, rate limiting on every route |
| Efficiency | Character-length-gated chunking (NOT section-count-gated), single call for documents that fit comfortably in context, session-scoped caching, zero data-loss truncation |
| Testing | Real coverage tool configured, component tests (not just logic tests), AI pipeline logic tested with mocked network calls only |
| Accessibility | WCAG AA contrast, full keyboard nav, focus-trapped modals, ARIA tab semantics, color-independent risk indicators, aria-live for async updates |
| Problem Statement Alignment | All 7 use cases implemented AND verified, disclaimer on every surface, prompt templates audited for advice-like language |
```

### TECH\_STACK.md

```markdown
# TECH\_STACK.md

## Frontend
Next.js (App Router) + Tailwind + shadcn/ui — accessible primitives out of the box.

## AI layer — Gemini API (Google AI Studio)
- Provider: Gemini API via an AI Studio key (ai.google.dev). Called ONLY server-side
  (API routes) — never from a "use client" component.
- Env var: GEMINI\_API\_KEY, read via process.env, never hardcoded, never exposed to
  the client bundle. DO NOT build a client-side "paste your own API key" flow — the
  server key is sufficient and a paste-your-own-key flow only adds attack surface
  for no functional benefit.
- SDK: use the current unified `@google/genai` package (the older
  `@google/generative-ai` package is being superseded — don't start a new project
  on it). Install with `npm install @google/genai`.
- Free-tier models available on a plain AI Studio key (verify current list at
  ai.google.dev/pricing before committing, since free-tier model availability
  shifts over time): Flash-tier models are the free-tier workhorses; Pro-tier
  models generally require a paid tier. Default to a current stable "Flash" model
  and make the exact model id an env var (GEMINI\_MODEL) so it's swappable without
  touching code — same reasoning as with any other free-tier provider: models get
  deprecated/renamed over time, and code shouldn't hardcode a name that may not
  exist tomorrow.
- Prefer a "stable with date" model id for anything you plan to keep running past
  a demo (e.g. a dated flash snapshot) over a bare "-latest" alias, since the bare
  alias can silently change behavior underneath you.
- Rate limits: free-tier limits are modest (tens of requests/minute, low
  hundreds-to-low-thousands per day depending on model) and are account-specific —
  check your actual live limits at aistudio.google.com/rate-limit rather than
  assuming a number from documentation. Design the app assuming these limits WILL
  be hit during heavy testing or evaluation — this is exactly why caching and
  minimizing LLM calls per document (see chunking strategy below) matters even
  more on Gemini's free tier than on a provider with looser limits.
- Response shape: the native Gemini SDK response shape differs from the
  OpenAI-style `choices\[0].message.content` pattern — read the actual SDK response
  object structure and parse accordingly, don't assume an OpenAI-compatible shape
  unless you deliberately use Google's OpenAI-compatibility endpoint instead of the
  native SDK.

## Chunking strategy (get this right from day 1 — see lesson #1 above)
- Gate single-pass vs. batched processing on TOTAL CHARACTER COUNT only.
  Do NOT also gate on section count — a document can have many short sections
  and still fit comfortably in one prompt.
- Default: documents under \~45,000-50,000 characters → single LLM call, full text,
  zero truncation. (Most legal documents are 3,000-25,000 chars — comfortably under.)
- Only batch/chunk documents genuinely exceeding that — and even then, chunk by
  character length with a reasonable overlap (200-400 chars) to avoid losing
  clauses that span a boundary.
- NEVER hard-truncate document text (e.g. `.slice(0, 3000)`) to fit a prompt.
  Truncation = silent data loss = a legitimate document goes unanalyzed past
  that point. Chunk instead; never truncate.

## Structured output reliability (free-tier models need this from day 1)
Free-tier models are less reliable at strict JSON output than paid frontier models.
Build this into your LLM client wrapper from the start, not as a bug fix later:
- Strip markdown code fences (```json ... ```) before parsing
- Extract the outermost { } or \[ ] if there's leading/trailing text
- Normalize smart quotes to straight quotes within string values
- Fall back to a lenient JSON repair library (e.g. `jsonrepair`) if strict parse fails
- One automatic corrective retry: "Your last response was not valid JSON. Return
  ONLY the JSON object." before surfacing an error to the user
- Validate the final result against a schema (Zod) before it ever reaches the UI

## Caching
- Session-scoped in-memory cache, keyed by hash(document text + analysis type).
- IMPORTANT: if deploying to a serverless platform (Vercel, etc.), be honest that
  in-memory cache only benefits requests hitting the SAME warm function instance —
  it is not a global cross-user or cross-cold-start cache. Document this limitation
  rather than overclaiming "cache reduces LLM calls" without the serverless caveat.
- Cache at the finest reasonable granularity (per-chunk, not just per-document) so
  a partial failure only requires re-calling the failed part, not everything.

## Security baseline (build these in from day 1, not as a later fix)
- A single `getUserSafeErrorMessage(err, fallback)` utility — ALL catch blocks
  route through it. Never let raw error objects, stack traces, or Zod validation
  errors reach the UI directly.
- A single `sanitizeLogSnippet` utility for any dev-mode logging — strips API keys,
  Bearer tokens, and any field matching document-text-like keys (rawText, content,
  prompt, summary, etc.) before logging. Never log user-supplied titles or filenames
  verbatim (they can contain real names/PII).
- Zod schema validation on every API route's request body, before any processing.
- A basic sliding-window rate limiter (by IP) on every public API route — generous
  enough (100+ req/min) not to throttle normal use or an automated evaluator, but
  present as a real abuse-protection measure.
- Confirm via `.next/static/chunks/` grep that no secret ever appears in the
  client bundle — do this check right before every deploy, not just once.

## Testing
- Vitest + @vitest/coverage-v8 configured from day 1, not added later.
- Component/DOM tests for every user-facing flow, not just backend logic.
- AI pipeline files (summarization, clause detection, compare, Q\&A) tested by
  mocking ONLY the network call — test the actual prompt-construction and
  response-parsing logic for real, including malformed-JSON edge cases.

## Deployment
- .gitignore BEFORE the first commit: node\_modules/, .next/, .env\*, coverage/, \*.log
- Never commit large binary fixtures or auto-downloadable runtime cache files
  (e.g. OCR language data) — confirm whether a "large file" is actually required
  at runtime or just a leftover local artifact before deciding to keep it.
- Repo must stay under whatever size limit the submission requires — check early,
  not right before deadline.
```

### CONSTRAINTS.md

```markdown
# CONSTRAINTS.md

## Product/legal guardrails (hard — verify with a real audit, not a guess)
1. No AI output may recommend signing/rejecting/pursuing action.
2. Every output surface must show the disclaimer — verify EACH surface individually:
   summary, clauses, EVERY Q\&A message bubble, compare results, PDF export
   (header + footer), Markdown export (top + bottom).
3. Q\&A must be document-scoped only — refuse out-of-scope questions explicitly.
4. Never fabricate quotes/clauses — every AI claim must cite real document text.
5. Prompt templates (system prompt + every feature-specific prompt) must explicitly
   forbid: "illegal", "you will win", "dangerous", "you should sign" — replace with
   neutral, calibrated language ("this creates an unconditional obligation with no
   grace period" not "this is dangerous").

## Security constraints
- No document content, titles, or filenames in logs — not even truncated/redacted
  previews containing partial content.
- No API keys/secrets in client bundle, ever — audit before every deploy.
- Sanitize all user-facing errors — no raw exceptions, no Zod validation dumps.

## Engineering constraints
- Chunk by character length, never by section count (see lesson #1).
- Never hard-truncate document text.
- One central LLM prompt module — not scattered inline strings.
- Every feature ships with at least one real test before being marked done.
```

\---

## 2\. Build Phases — Prompts to Run in Order

Each phase assumes the context files above are already in the repo. Fewer, larger
phases than a day-by-day grind — since attempts are limited, get more right per pass.

### Phase 1 — Scaffold + Upload/Parse

```
Read PRD.md, TECH\_STACK.md, and CONSTRAINTS.md in this workspace.

Scaffold the project per TECH\_STACK.md. Build the upload + parsing flow:
- File upload (PDF/DOCX/TXT) and a "Paste Text" flow — these must NOT share the
  same validation function. Paste-text input must never be checked against file
  extension rules.
- PDF parsing with OCR fallback (only if text layer is empty — check the actual
  extracted text length, don't assume from file type alone) for scanned PDFs.
- Document sectioning (split by headings) with graceful fallback to paragraph-based
  chunking for documents with no clear structure.
- .gitignore configured BEFORE first commit, per TECH\_STACK.md.

Give me a plan artifact before writing code.
```

### Phase 2 — AI Pipeline (Summary, Clauses, Q\&A, Compare)

```
Build the four core AI pipelines per PRD.md's use cases 1-4, following
TECH\_STACK.md's chunking strategy and structured-output reliability rules EXACTLY:

1. Document summarization: character-length-gated single-pass (under \~45-50k chars),
   batch fallback only above that threshold. NEVER section-count-gated.
2. Clause detection: same character-length gating. Categorize into: obligations,
   deadlines, penalties, auto-renewal, liability, indemnity, termination, other.
   Assign High/Medium/Low attention levels with plain-English reasons and a
   suggested attorney question per clause.
3. Document-scoped Q\&A: retrieval-grounded, cites exact source quotes, refuses
   out-of-scope questions explicitly.
4. Compare: detects added/removed/modified changes between two document versions,
   neutral framing only (no "better/worse").

All four MUST route through the structured-output reliability wrapper (JSON
sanitizer + repair + retry) from TECH\_STACK.md — build this wrapper once, use it
everywhere, don't duplicate parsing logic per feature.

System-level prompt guardrails (per CONSTRAINTS.md) must be enforced in every
prompt template — show me the actual guardrail language you're using.

Add caching per TECH\_STACK.md, with the serverless caveat documented honestly.

Test against a self-generated fictional sample document (a lease or NDA with no
real names) before calling this phase done.
```

### Phase 3 — Security \& Error Handling

```
Build these in now, not as a later fix, per TECH\_STACK.md's security baseline:

1. getUserSafeErrorMessage utility — wrap it around EVERY catch block in the
   codebase, including UI components, hooks, and API routes.
2. sanitizeLogSnippet utility for any dev logging — confirm no document text,
   titles, or filenames are ever logged verbatim.
3. Zod schema validation on every API route's request body.
4. Sliding-window rate limiter (100+ req/min per IP) on every public API route.
5. Grep the codebase now for any place raw error objects or Zod validation errors
   might reach the UI — fix all of them, not just obvious ones.

Confirm via a production build + grep of .next/static/chunks/ that no secret
appears in the client bundle.

Run the test suite and confirm nothing broke.
```

### Phase 4 — Accessibility

```
Build a single shared Modal component with: focus trap, Escape-to-close, focus
restoration to the trigger element, role="dialog", aria-modal="true". Use it for
every modal/dialog in the app — don't build accessibility per-modal.

Add proper ARIA tab semantics (role="tablist"/"tab"/"tabpanel", aria-selected) to
any tabbed interface.

Add aria-label to every icon-only button.

Risk/attention badges must use icon + text label + color (never color alone) and
meet WCAG AA contrast (4.5:1 minimum).

Add an aria-live="polite" region announcing when async analysis completes.

Confirm full keyboard-only navigation works for the entire upload → analyze →
export flow — no mouse.

Confirm prefers-reduced-motion is respected if any animations exist.
```

### Phase 5 — Testing

```
Configure @vitest/coverage-v8 now (not later). Write:
1. Component/DOM tests for upload (valid/invalid files, paste-text NOT validated
   as a file), modal accessibility (focus trap, Escape, focus return), and
   per-section error isolation (one analysis step failing doesn't break others).
2. AI pipeline logic tests: mock ONLY the network call, test actual prompt
   construction and response parsing, including malformed-JSON edge cases
   (fenced JSON, truncated JSON, smart quotes).
3. A test using a REAL binary DOCX fixture (not just mocked extraction) to catch
   real parser bugs.

Run coverage and report the actual percentage. List any core user-facing file
still under 40% coverage.
```

### Phase 6 — Problem Statement Alignment Self-Check (DO THIS EARLY, NOT LAST)

```
Audit against PRD.md's 7 use cases and the non-negotiable guardrail:
1. Confirm each of the 7 use cases is genuinely implemented, with evidence
   (not just "the tab exists").
2. Confirm the disclaimer appears on EVERY output surface individually —
   including each Q\&A chat bubble, not just a page banner.
3. Open the actual prompt templates and confirm the anti-advice guardrail
   language is present and specific (forbidden phrases enumerated).
4. Report any use case that's only partially covered and why.
```

### Phase 7 — Full 6-Parameter Self-Audit

```
Score all 6 evaluation parameters (Code Quality, Security, Efficiency, Testing,
Accessibility, Problem Statement Alignment) out of 100 with real evidence —
file/line references, actual test output, actual numbers. Don't inflate scores.

For Efficiency specifically: report actual LLM call count per typical document
and confirm the chunking threshold is character-based, not section-count-based
(this was the #1 mistake in a prior build — verify it's not repeated here).

Output: table of Parameter | Score | Top gap, plus a prioritized fix list.
```

### Phase 8 — Fix Gaps Found (repeat Phase 7 → fix → re-audit once)

Take whatever Phase 7 finds and fix the highest-value, lowest-risk items first.
Don't refactor files that are already scoring well — regression risk outweighs
marginal gains this close to submission.

### Phase 9 — Deploy \& Final Verification

```
1. Confirm repo size is within the submission limit BEFORE first push
   (check node\_modules/, .next/, large binaries are gitignored).
2. Confirm the GitHub repo is set to Public.
3. Build for production, deploy, and confirm all required env vars are set in
   the deployment platform's settings (not just locally).
4. Run a full live end-to-end test on the DEPLOYED URL (not localhost):
   upload → summary → clauses → Q\&A → compare → export (both formats).
   Confirm zero console errors and zero 4xx/5xx.
5. Report the live deployed commit hash to confirm it matches your latest commit.
```

\---

## 3\. Before Submitting

* \[ ] Repo is public and under the size limit
* \[ ] Live deployed URL tested end-to-end, zero errors
* \[ ] All 6 parameters self-audited with real evidence, not assumptions
* \[ ] Disclaimer confirmed on every individual output surface
* \[ ] No unnecessary client-side API key input flow (if a server key already works)
* \[ ] Submission form text describes SPECIFIC features (not generic claims) and
names the exact GenAI service + where each pipeline uses it

## 4\. If a Score Comes Back Lower Than Expected

* AI evaluators have real run-to-run variance — don't panic-chase every point.
* If a fix targets a genuinely diagnosed root cause (not a guess), it's worth doing.
* If you're down to your last attempt and a score is already 90+, seriously weigh
whether further changes risk regressing a category that's already at 100.
* A careful, evidence-verified 90s score beats a rushed, unverified attempt at 100.


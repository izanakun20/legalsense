# TECH_STACK.md

## Frontend
Next.js (App Router) + Tailwind + shadcn/ui — accessible primitives out of the box.

## AI layer — Gemini API (Google AI Studio)
- Provider: Gemini API via an AI Studio key (ai.google.dev). Called ONLY server-side
  (API routes) — never from a "use client" component.
- Env var: GEMINI_API_KEY, read via process.env, never hardcoded, never exposed to
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
  and make the exact model id an env var (GEMINI_MODEL) so it's swappable without
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
  OpenAI-style `choices[0].message.content` pattern — read the actual SDK response
  object structure and parse accordingly, don't assume an OpenAI-compatible shape
  unless you deliberately use Google's OpenAI-compatibility endpoint instead of the
  native SDK.

## Chunking strategy (get this right from day 1 — see lesson #1 above)
- Gate single-pass vs. batched processing on TOTAL CHARACTER COUNT only.
  Do NOT also gate on section count — a document can have many short sections
  and still fit comfortably in one prompt.
- Default: documents under ~45,000-50,000 characters → single LLM call, full text,
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
- Extract the outermost { } or [ ] if there's leading/trailing text
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
- AI pipeline files (summarization, clause detection, compare, Q&A) tested by
  mocking ONLY the network call — test the actual prompt-construction and
  response-parsing logic for real, including malformed-JSON edge cases.

## Deployment
- .gitignore BEFORE the first commit: node_modules/, .next/, .env*, coverage/, *.log
- Never commit large binary fixtures or auto-downloadable runtime cache files
  (e.g. OCR language data) — confirm whether a "large file" is actually required
  at runtime or just a leftover local artifact before deciding to keep it.
- Repo must stay under whatever size limit the submission requires — check early,
  not right before deadline.

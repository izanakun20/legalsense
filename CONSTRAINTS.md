# CONSTRAINTS.md

## Product/legal guardrails (hard — verify with a real audit, not a guess)
1. No AI output may recommend signing/rejecting/pursuing action.
2. Every output surface must show the disclaimer — verify EACH surface individually:
   summary, clauses, EVERY Q&A message bubble, compare results, PDF export
   (header + footer), Markdown export (top + bottom).
3. Q&A must be document-scoped only — refuse out-of-scope questions explicitly.
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

# PRD.md — [YourProjectName]: GenAI Legal Document Assistant

## Goal
GenAI web app that helps users understand, compare, and navigate legal documents —
without giving legal advice or replacing a licensed attorney.

## Core use cases (ALL must be implemented — this is a scored evaluation criterion)
1. Simplifying complex legal documents — plain-language summary
2. Comparing contracts/agreements/policies — side-by-side material-change detection
3. Highlighting clauses, obligations, risks, inconsistencies — categorized risk flags
4. Answering questions based on the document — citation-grounded Q&A
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
This applies to EVERY output surface: summary, clauses, Q&A answers (including each
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

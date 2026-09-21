# LegalSense

LegalSense is a web application designed to help users understand what legal documents say in plain language. It leverages the Gemini API to analyze contracts, detect clauses, and answer user questions without storing document data.

## Features / Use Cases
Based on the verified functionality in the codebase, LegalSense supports the following 7 use cases:
1. **File Uploads**: Parse PDF, DOCX, and TXT files (up to 10MB).
2. **Raw Text Input**: Paste document text directly (up to 200,000 characters).
3. **Document Summarization**: Generate plain-language summaries of complex legal text.
4. **Clause Detection**: Identify key obligations, deadlines, and risks, and suggest questions for an attorney.
5. **Interactive Q&A**: Ask specific questions about the uploaded document, backed by exact source quotes.
6. **Document Comparison**: Compare two documents side-by-side to detect added, removed, or modified material changes.
7. **Report Export**: Export the summary and detected clauses to a Markdown (`.md`) file.

## Architecture Summary
- **Framework**: Next.js App Router (React 19).
- **API Routes**: Core AI logic is split across `/api/analyze`, `/api/compare`, `/api/parse-file`, and `/api/qa`.
- **AI Integration**: Powered by `@google/genai` pinned to the `gemini-3.6-flash` model. Prompts instruct the model to treat user documents as untrusted data.
- **Processing**: Documents are processed in chunks (max 45,000 characters per single-pass). All analysis runs upfront asynchronously without streaming.
- **Rate Limiting**: Enforced via `@upstash/ratelimit` (10 requests/minute).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | API key for Google Gemini GenAI. | Yes |
| `KV_REST_API_URL` | Vercel KV / Upstash Redis REST URL for rate limiting. | Recommended |
| `KV_REST_API_TOKEN` | Vercel KV / Upstash Redis REST token for rate limiting. | Recommended |

*Note: If KV variables are omitted, the rate limiter falls back to an in-memory map which does not persist across serverless invocations.*

## Scripts
- `npm run dev` - Starts the local Next.js development server.
- `npm run build` - Creates an optimized production build.
- `npm start` - Starts the production server.
- `npm run lint` - Runs ESLint to check for code quality issues.
- `npm run typecheck` - Runs the TypeScript compiler to catch type errors.
- `npm run test` - Runs the Vitest test suite.
- `npm run test:watch` - Runs Vitest in watch mode.
- `npm run coverage` - Runs Vitest and generates a coverage report.

## Testing & CI
- **Testing**: Built with `Vitest`. Unit tests run in a `node` environment, while component tests use `jsdom` alongside `@testing-library/react` and `vitest-axe` for accessibility validation.
- **CI**: GitHub Actions workflow runs on Push and PR. It enforces successful linting, typechecking, tests, code coverage, production builds, and zero high-level npm vulnerabilities. The CI pipeline also validates that API keys are not leaked into the client bundle.

## Limitations
- There is no PDF export capability (reports are exported exclusively in Markdown).
- Missing semantic output filtering (relies entirely on the LLM adhering to system prompt guardrails).
- The Compare tab does not currently display the mandatory legal disclaimer.
- The default in-memory rate limiter fallback is ephemeral on Vercel.

## Disclaimer
**This application provides general informational text analysis, not formal legal counsel.** You must always consult a licensed attorney for your specific legal situation.

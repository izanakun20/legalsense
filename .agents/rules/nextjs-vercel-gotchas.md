# Next.js App Router & Vercel Deployment Gotchas

This rule captures critical edge cases and workarounds discovered while building and deploying Next.js applications on Vercel.

## 1. `pdf-parse` Configuration and Runtime Errors
- **Webpack Issue**: `pdf-parse` relies on dynamic requires for `pdf.worker.js` causing fatal Turbopack/Webpack errors. Always use `pdf-parse@1.1.1` and add `serverExternalPackages: ['pdf-parse']` to `next.config.ts`.
- **Runtime/Test Issue**: Importing `pdf-parse` directly (`import pdfParse from 'pdf-parse'`) will crash in tests or strict environments because its `index.js` attempts to access `fs.existsSync('./test/data/05-versions-space.pdf')`.
- **Rule**: Bypass `index.js` entirely by importing the core module directly: `import pdfParse from 'pdf-parse/lib/pdf-parse.js';`. When mocking in Vitest, mock the exact subpath `'pdf-parse/lib/pdf-parse.js'`.

## 2. TypeScript & Zod Errors in API Routes
- **Issue**: Strict TypeScript in Next.js throws build errors (`Property 'errors' does not exist on type 'ZodError<unknown>'`) when checking `error instanceof z.ZodError` in `catch` blocks.
- **Rule**: Avoid direct access like `error.errors`. Always use type assertions like `(error as any).errors`, or use the official `error.flatten().fieldErrors` method to satisfy the compiler.

## 3. Shadcn/UI Component Imports
- **Issue**: Importing a shadcn/ui component without actually running the CLI command results in fatal build errors (`Module not found`).
- **Rule**: Before adding a local import like `@/components/ui/[component]`, you **MUST** verify the file exists or proactively run `npx shadcn@latest add [component] -y`.

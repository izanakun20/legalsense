# Next.js App Router & Vercel Deployment Gotchas

This rule captures critical edge cases and workarounds discovered while building and deploying Next.js applications on Vercel.

## 1. `pdf-parse` Configuration
- **Issue**: `pdf-parse` relies on dynamic requires for `pdf.worker.js` which causes fatal Turbopack/Webpack build errors (`Module not found: Can't resolve './pdf.worker.js'`). Newer forks (e.g., `2.x`) also break due to missing native Canvas bindings.
- **Rule**: Always use the stable `pdf-parse@1.1.1`. To prevent Next.js from crashing during the build step, you **MUST** add `serverExternalPackages: ['pdf-parse']` to `next.config.ts` (or `next.config.js`).

## 2. TypeScript & Zod Errors in API Routes
- **Issue**: Strict TypeScript in Next.js throws build errors (`Property 'errors' does not exist on type 'ZodError<unknown>'`) when checking `error instanceof z.ZodError` in `catch` blocks.
- **Rule**: Avoid direct access like `error.errors`. Always use type assertions like `(error as any).errors`, or use the official `error.flatten().fieldErrors` method to satisfy the compiler.

## 3. Shadcn/UI Component Imports
- **Issue**: Importing a shadcn/ui component without actually running the CLI command results in fatal build errors (`Module not found`).
- **Rule**: Before adding a local import like `@/components/ui/[component]`, you **MUST** verify the file exists or proactively run `npx shadcn@latest add [component] -y`.

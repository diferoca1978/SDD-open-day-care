<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MCPs

- Playwright Screenshots y cualquier cosa relacionada con playwright tienen que ir directamente a la carpeta .playwright-mcp.
- Context7 usaremos este mcp para consultas a la documentacion as actualizada del framework.

## Commands

- pnpm is the package manager (`pnpm-lock.yaml`) — ignore the npm/yarn/bun options in the default README.
- `pnpm dev` — dev server at http://localhost:3000.
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`). Single path: `pnpm lint app/foo.tsx`.
- `pnpm build` — production build; fails on TypeScript errors (there is no separate typecheck script).
- Typecheck without a full build: `pnpm exec next typegen && pnpm exec tsc --noEmit`. Run `next typegen` first, or route types are not validated.
- Next 16 removed `next lint` and `next build` never lints — linting is only the explicit `pnpm lint` step.
- No test framework is configured; there is no test command to run.

## Stack

- Next.js 16.3.4 App Router, React 19, TypeScript strict. Routes live in `app/` at the repo root (no `src/`). Types like `LayoutProps<"/">` (see `app/layout.tsx`) are Next 16 route globals.
- Tailwind CSS v4 with CSS-first config: `@import "tailwindcss"` + `@theme` in `app/globals.css`. There is no `tailwind.config.*` — do not create a v3-style config.
- Import alias `@/*` maps to the repo root (e.g. `@/app/page.tsx`), not to `src/` or `app/`.
- Single-package repo. `pnpm-workspace.yaml` only blocks dependency build scripts (`sharp`, `unrs-resolver`) — it is not a monorepo workspace.

## Design references (UI source of truth)

- `references/pantallas/*.dc.html` — static HTML mockups of every app screen; `index.dc.html` is the gallery index (login, feed, niños, perfil-niño, resumen-día, vincular-padre, avisos, publicaciones, cuentas…). Read the matching mockup before building any screen.
- `references/screenshots/*.png` — screenshots of the reference app.
- Mockup design language: Fredoka for headings, Nunito for body, warm cream/coral palette (`#f6ecdf` background). UI copy and domain naming are in Spanish.

## Spec workflow

- Features get a spec before implementation: `specs/NN-slug.md` (none exist yet; first is `01-`), following `.agents/skills/spec/template.md`. New specs must match the language and wording of existing ones.
- `/spec` writes the spec only — never code. Specs start as `Draft`; the human (not the agent) marks them `Approved`.
- `/spec-impl` implements an `Approved` spec step by step on a `spec-NN-slug` branch (auto-created unless `AutoCreateBranch: false` in `specs/.spec-config.yml`), pausing after each plan step for diff review; it never commits on its own.
- Both are user-invoked skills under `.agents/skills/` (`disable-model-invocation`).

## Coding rules

- _Always_ use clean code.
- Names, functions and variables in English language.

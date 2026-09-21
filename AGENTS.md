# AGENTS.md — Kancatura

Operating contract for AI coding agents, with human-in-the-loop checkpoints.

## Identity

Kancatura is a business plan application built with React 19, Vite,
shadcn-style components, Tailwind 4, IndexedDB (`idb`), and Convex.
Package manager: **bun** (see `packageManager`). License: Apache-2.0.

## Command Reference

| Task | Command |
|---|---|
| Install | `bun install` |
| Dev server | `bun run dev` (vite) |
| Typecheck | `bun run typecheck` (`tsc -b`) |
| Tests | `bun run test` (Node core runner over `tests/*.test.mjs`) |
| Browser smoke test | `bun run test:browser` (Playwright) |
| Build | `bun run build` (`tsc -b && vite build`) |
| **Full verify (run before declaring done)** | `bun run verify` |

## Verify Contract

`bun run verify` = typecheck + unit tests. Must pass before you report
success. For UI changes, additionally run `bun run test:browser` when a
browser is available, and say so in your summary either way.

## Codebase Map

- `src/` — React app: components, pages, stores, convex client wiring
- `convex/` — Convex backend (schema, queries, mutations)
- `tests/` — Node test suite + Playwright browser smoke test
- `components.json` — shadcn generator config
- `docs/plans/` — planning documents

## Conventions

- shadcn-style components in `src/components/ui/` — use the generator
  conventions rather than hand-rolling new primitives.
- TypeScript strict; `tsc -b` is the source of truth (project references).
- Local persistence is IndexedDB-first (`idb`); Convex sync must degrade
  gracefully offline.

## Human-in-the-Loop Checkpoints

Ask the human before:
- Changing the Convex schema or any mutation/query signatures.
- Changing the plan document export (jsPDF) output.
- Adding dependencies.

## Danger Zones

- Never commit `.env`/`.env.local` or Convex deployment credentials.
- Never delete or rename IndexedDB stores without a migration path —
  existing users hold local business data there.

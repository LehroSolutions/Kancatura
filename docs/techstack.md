# Kancatura Tech Stack

## Frontend

- React 19.2-compatible runtime
- TypeScript
- Vite
- Tailwind CSS 4
- shadcn-style local components using the `new-york` convention from `components.json`
- lucide-react icons
- Fontsource variable fonts for local typography

## Backend

- Convex schema and functions
- Demo-mode frontend fallback until `VITE_CONVEX_URL` is configured
- No Convex commands run during this task
- No generated Convex API imports in the frontend until codegen is run later

## UI Architecture

The UI follows a workbench pattern:

- Fixed desktop navigation rail
- Compact mobile top bar
- Founder Studio first screen with a guided "Build Your Business" lane
- Business stage track for Foundation, Market Proof, Operations, Finance, Launch, and Export
- Readiness blockers, evidence coverage, export checkpoints, activity, tasks, and documents
- Calmer financial lens below the primary builder workflow
- Stateful tab panels for every rail item, including focused section drafting with linked stage context
- Lightweight SVG/CSS charts with no chart dependency

## Verification Architecture

- `tests/ui-contract.test.mjs` uses Node's built-in test runner for source-level UI, workflow, and Convex-scaffold contracts.
- `tests/browser-smoke.mjs` starts Vite, verifies the Founder Studio in Chrome through Playwright, clicks representative tabs, captures a dashboard screenshot, and then shuts Vite down.
- Convex commands are intentionally excluded from the verification workflow until the deployment is selected and codegen is run by the project owner.

## Data Model Direction

Core Convex tables:

- `plans`
- `businessStages`
- `readinessBlockers`
- `evidenceItems`
- `studioActivity`
- `exportCheckpoints`
- `planSections`
- `planHighlights`
- `financialMetrics`
- `planTasks`
- `planDocuments`

The frontend currently uses representative demo data in `src/data/kancatura.ts` that mirrors these tables. Once Convex codegen is run, the dashboard can swap demo data for generated Convex API hooks.

## Version Strategy

Dependencies are pinned to explicit major-compatible ranges in `package.json`; no dependency uses an unbounded `latest` specifier. The stack follows the React 19, Tailwind CSS 4, shadcn, Vite, and Convex documentation linked from `docs/dependencies.md`.

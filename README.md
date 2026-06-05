# Kancatura

Kancatura is a business plan application for founders and operators who need one guided workspace for business stages, plan sections, evidence, financial readiness, tasks, documents, and export preparation.

This repository uses React 19, Vite, TypeScript, Tailwind CSS 4, shadcn-style local UI primitives, lucide icons, local Fontsource typography, and a Convex backend scaffold. Convex commands have not been run, so generated Convex files are intentionally absent.

## Local Setup

```powershell
npm install
npm run dev
```

Optional environment:

```powershell
$env:VITE_CONVEX_URL="https://your-convex-deployment.convex.cloud"
```

The app runs in demo mode when `VITE_CONVEX_URL` is missing. Run Convex setup/codegen only when you are ready to connect a deployment. This implementation does not import generated Convex API files from the frontend yet.

## Verification

```powershell
npm test
npm run build
npm run test:browser
```

- `npm test` runs dependency-light UI contract tests for the tab registry, Founder Studio workflow, Convex scaffold shape, and no generated Convex frontend imports.
- `npm run build` runs TypeScript and Vite production bundling.
- `npm run test:browser` starts Vite on an isolated local port, opens Chrome through Playwright, captures `output/playwright/dashboard.png`, and clicks representative tabs to verify the rail is interactive.

## Current Surfaces

- `src/App.tsx`: Kancatura Founder Studio UI, guided stage workflow, responsive workbench composition, and stateful tab panels.
- `src/components/ui`: local shadcn-style primitives.
- `src/data/kancatura.ts`: representative demo data for business stages, readiness blockers, evidence, activity, export checkpoints, and plan records that mirror the Convex tables.
- `tests/ui-contract.test.mjs`: TDD contract checks for the frontend surface.
- `tests/browser-smoke.mjs`: headless browser smoke for rendering and tab switching.
- `convex/schema.ts`: schema-first backend scaffold for plan records and Founder Studio workflow tables.
- `convex/plans.ts`: starter studio/dashboard reads and safe readiness mutations for the later Convex connection.

## Documentation

- [Image study](docs/image-study.md)
- [ADR index](docs/ADR.md)
- [Architecture decision record](docs/adr/0001-kancatura-react19-shadcn-convex.md)
- [Tech stack](docs/techstack.md)
- [Dependencies](docs/dependencies.md)

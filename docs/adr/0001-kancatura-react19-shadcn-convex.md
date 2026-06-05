# ADR 0001: React 19, shadcn-style UI, and Convex for Kancatura

Date: 2026-05-20

## Status

Accepted and implemented for the initial workbench foundation.

## Context

Kancatura is being created from a local dashboard reference image and needs to become a business plan application. The first milestone needs a polished frontend foundation, an explicit technology plan, and a backend direction that can support live plan data later.

The source image points to a dashboard/workbench product rather than a marketing site. The core domain objects are plans, plan sections, highlights, financial metrics, tasks, and documents.

The local `src` and `convex` folders were scaffold-only at the start of implementation. The decision therefore covers both the technology choices and the first working product shell.

## Decision

Use:

- React 19 for the frontend application runtime.
- Vite for development and production bundling.
- TypeScript for application and configuration code.
- Tailwind CSS 4 for styling.
- shadcn-style local UI primitives for buttons, cards, badges, progress, and future form/dialog primitives.
- Convex as the backend data and function layer.

Convex commands are intentionally not run in this task. The repository includes schema/function scaffolding only, so codegen and deployment can happen later when the Convex project is selected.

## Implemented Shape

- `src/App.tsx` implements the Kancatura workbench using representative demo data.
- `src/components/ui` contains source-owned shadcn-style primitives.
- `src/data/kancatura.ts` mirrors the planned Convex records for demo mode.
- `convex/schema.ts` defines plans, plan sections, highlights, financial metrics, revenue projection, tasks, and documents.
- `convex/plans.ts` defines starter query/mutation functions for the later generated Convex API.

## Consequences

Benefits:

- React 19 gives a current component model and strong ecosystem compatibility.
- shadcn-style primitives keep UI ownership local instead of hiding core components in an external package.
- Convex fits the dashboard model because plan state, tasks, documents, and progress can be queried and updated incrementally.
- Vite keeps the early project lightweight and fast to iterate.

Tradeoffs:

- Convex generated files are absent until a Convex command is run later.
- The frontend starts in demo mode when `VITE_CONVEX_URL` is missing.
- shadcn components are source-owned, so updates are intentional code changes rather than package upgrades.

## Initial Boundaries

- The first screen is the business plan workbench.
- The app name is Kancatura across metadata and UI.
- The backend contract is Convex-first, but the UI must remain usable without an active Convex deployment.
- No authentication implementation is included in this first foundation pass.
- No real document upload/storage workflow is included in this first foundation pass.

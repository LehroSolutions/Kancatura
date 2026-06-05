# Kancatura Convex Scaffold

This folder is intentionally scaffold-only until a Convex deployment is selected.

Do not run Convex commands as part of the current implementation task. When the project is ready to connect to a deployment, run Convex setup/codegen from the repo root and then wire the generated API into the React app.

## Planned Backend Surface

- `schema.ts`: tables for plans, plan sections, highlights, financial metrics, tasks, and documents.
- Founder Studio workflow tables for business stages, readiness blockers, evidence items, studio activity, and export checkpoints.
- `plans.ts`: starter query and mutation functions for studio reads, dashboard reads, stage readiness updates, section readiness updates, blocker resolution, and task updates.
- Document records store metadata first. Real file upload/storage can be added after auth and storage policy decisions.

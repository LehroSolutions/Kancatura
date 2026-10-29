# Kancatura

A local business-planning workspace for plan sections, evidence, financial readiness, tasks, and PDF/JSON export. React 19, Vite, TypeScript, Tailwind 4 and IndexedDB power the application. The Convex directory is an unconnected scaffold; no cloud account or environment variable is required to use the workspace.

## Setup and verification

Use Node 24+ and Bun 1.3.14 from `packageManager`.

```powershell
bun install --frozen-lockfile
bun run dev
```

Before a release:

```powershell
bun run verify
bunx playwright install chromium
$env:PLAYWRIGHT_CHANNEL = 'chromium'
bun run test:browser
```

`verify` runs TypeScript, unit tests and a production build. The browser gate serves **dist** and exercises task creation/reload, JSON backup/restore, malformed imports, PDF downloads, unavailable storage, desktop/mobile layout and uncaught errors. Set `KANCATURA_E2E_PORT` if the default 5199 is occupied. Screenshots are generated under `output/playwright`.

## Data and recovery

Data stays in this browser's IndexedDB at the site's origin. Browser profiles, different hostnames/ports and cleared site data have separate workspaces. The seeded plan is sample material to replace with your own information. This is a planning tool, not an accounting or legal certification service.

Export JSON from Settings before clearing storage or changing devices. To restore, choose Import JSON in the same workspace; validation rejects malformed records before modifying the database. Exports contain business information in readable JSON: store them somewhere you control. PDF exports are documents, not restorable workspace backups. Reset to Defaults requires confirmation and should follow a backup.

If storage is disabled or unavailable, the application presents a retry screen without resetting existing records. Re-enable site storage or free disk space, then retry. Do not delete the database to resolve a startup error unless a backup has been verified.

## Release and rollback

Publish the complete `dist` directory to a static HTTPS host, with a fallback to `index.html`. No API service, secret, or Convex deployment is part of this release. Keep deployment origin stable so existing browser data remains available. Serve HTML with revalidation and hashed assets with long-lived caching. Keep the previous build for rollback; replace static assets as one release. This change keeps the IndexedDB schema at version 1.

The repository includes local UI primitives in `src/components/ui`, models in `src/data/kancatura.ts`, and import validation/persistence in `src/lib`. Run the existing verification gates after changes. See [architecture](docs/adr/0001-kancatura-react19-shadcn-convex.md) and [design study](docs/image-study.md).

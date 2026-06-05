# Kancatura Dependencies

## Runtime Dependencies

- `react` and `react-dom` at `^19.2.0`: React 19 application runtime.
- `convex` at `^1.26.2`: backend schema/function support and future React provider integration.
- `@radix-ui/react-slot` at `^1.2.3`: shadcn-style composable button primitive.
- `class-variance-authority` at `^0.7.1`: typed component variants.
- `clsx` at `^2.1.1` and `tailwind-merge` at `^3.3.1`: safe class composition.
- `lucide-react` at `^0.577.0`: icon system.
- `@fontsource-variable/manrope` and `@fontsource-variable/jetbrains-mono` at `^5.2.8`: local typography.

## Development Dependencies

- `vite` at `^7.1.4`: development server and build tool.
- `@vitejs/plugin-react` at `^5.0.2`: React plugin for Vite.
- `typescript` at `^6.0.3`: static type checking.
- `tailwindcss` and `@tailwindcss/vite` at `^4.1.12`: Tailwind CSS 4 integration.
- `shadcn` at `^3.2.1`: CLI compatibility for future component additions.
- `playwright` at `^1.60.0`: headless browser smoke testing with the local Chrome channel; browser downloads were intentionally skipped during install.
- `@types/react`, `@types/react-dom`, and `@types/node`: TypeScript definitions.

## Overrides

- `convex > ws` is overridden to `8.20.1` because Convex `1.39.1` pins `ws@8.18.0`, which is affected by npm advisory `GHSA-58qx-3vcg-4xpx`. The override keeps Convex current while applying the patched `ws` release.

## Install Command

```powershell
npm install
```

## Test Commands

```powershell
npm test
npm run build
npm run test:browser
```

`npm run test:browser` starts Vite itself, uses port `5199` by default, captures `output/playwright/dashboard.png`, and shuts the server down when complete. Set `PLAYWRIGHT_CHANNEL=msedge` if Chrome is not available locally.

## Source References

- React version direction: <https://react.dev/versions>
- shadcn with Tailwind v4 and React 19: <https://ui.shadcn.com/docs/tailwind-v4>
- Convex React client pattern for later integration: <https://docs.convex.dev/client/react/>
- Tailwind CSS Vite integration: <https://tailwindcss.com/docs/installation/using-vite>

## Convex Note

Do not run Convex commands until the deployment is selected. Later setup will likely require:

```powershell
npx convex dev
```

That command is intentionally documented only as a future step and was not run in this task.

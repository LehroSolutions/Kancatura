# Contributing to Kancatura

Thank you for your interest in contributing to Kancatura. This project maintains strict quality, architectural, and aesthetic standards. Please read this guide before submitting pull requests.

## Development Workflow

1. **Fork and Clone**: Fork the repository and clone it locally.
2. **Install Dependencies**: Run `npm install`.
3. **Branching**: Create a feature branch (`git checkout -b feature/your-feature-name`).
4. **Development**: Run `npm run dev` for local development.
5. **Verification**: Before committing, ensure all checks pass:
   ```powershell
   npm run typecheck
   npm test
   npm run build
   ```

## Quality Gates

All contributions must pass the following checks. PRs that fail these will be requested for changes.

### 1. Testing
- New features or bug fixes must include corresponding tests in the `tests/` directory.
- Run `npm test` to ensure all UI contract and scaffold checks pass.
- Browser smoke tests (`npm run test:browser`) must pass without regression.

### 2. Type Safety
- The project uses strict TypeScript. No `any` types unless explicitly justified in a comment.
- Run `npm run typecheck` to verify.

### 3. Anti-Slop & Aesthetic Standards
Kancatura rejects generic, template-like UI. Before adding or modifying UI components:
- **Do not** use default fonts (Inter, Roboto, Arial). Use the configured variable fonts (`JetBrains Mono`, `Manrope`).
- **Do not** introduce purple-to-blue gradients or generic SaaS card grids.
- **Do** use existing `src/components/ui` primitives. Do not reinvent modals, buttons, or inputs from scratch.
- **Do** ensure all interactive elements are keyboard accessible and have visible focus states.

### 4. Architecture Decision Records (ADRs)
For any significant architectural change (e.g., adding a new major dependency, changing state management, altering the Convex schema structure):
- Create a new ADR in `docs/adr/` following the existing format.
- Document the context, decision, consequences, and alternatives considered.

## Pull Request Process

1. Ensure your branch is up to date with the `main` branch.
2. Run the full verification suite (`npm run typecheck && npm test && npm run build`).
3. Open a Pull Request with a clear title and description.
4. Link any related issues.
5. Respond to code review feedback promptly. Blind implementation of suggestions without understanding the technical rationale is discouraged.

## Reporting Issues

When reporting a bug or requesting a feature:
- Provide clear steps to reproduce the issue.
- Include the environment (OS, Node.js version, browser).
- For UI issues, a screenshot or screen recording is highly appreciated.

## Code of Conduct

Be respectful, constructive, and focused on the technical merits of the work. We are building a tool for founders and operators; clarity and reliability are paramount.

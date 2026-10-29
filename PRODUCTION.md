# Production release gates

Kancatura ships as a static, local IndexedDB workspace. Follow the install,
verification, HTTPS hosting, backup and rollback instructions in README.md.
The browser gate uses the production build, checks JSON backup/restore and
malformed imports, verifies task/owner content in the multipage PDF export,
and exercises denied storage and recovery after an aborted database upgrade.
PDF task markers are drawn as vector boxes and ticks. Unsupported checkbox
characters must not force ordinary task labels into incorrectly encoded text.
PDF code loads when an export is requested, keeping the document generator out
of the initial application download. The browser gate also creates a first-run
profile through accessible form labels and verifies that it survives reload.

The unused `shadcn` generator CLI has been removed from the release dependency
tree. No source imports or package scripts invoke it. The checked-in UI
primitives, Radix/CVA dependencies and components.json conventions remain the
source for existing components. That CLI introduced six advisory packages,
including an unpatched `deepmerge` 4.3.1 advisory, into the build environment.

Component generation is an optional development workflow, separate from the
reproducible release install. If future work needs an external generator, select
a reviewed release and registry and audit its dependency tree before installing
it in the development environment. Check the actual Bun lockfile after dependency
changes; declarations alone do not prove resolved versions.

# @repospec/engine

The **engine**: the UI-agnostic implementation of the Repospec protocol operations
defined in [`spec/lifecycle.md`](../../spec/lifecycle.md) — `init`, `generate`,
`sync`, `doctor`, `upgrade`.

The engine accepts plain data, never prompts, and operates on an injected
filesystem. That keeps it embeddable in any front-end — the CLI, an editor
extension, or a CI action (ADR-0007). The CLI is just one caller.

## Status

Implemented (Milestones 2–3):

- Operations: `init` / `planInit`, `generate`, `sync` (with `check` + ownership
  guard), `doctor`.
- `RepospecFileSystem` implementations: `NodeFileSystem` and `MemoryFileSystem`.
- Adapter subsystem: `Adapter`, `AdapterRegistry`, and built-in adapters
  (`claude`, `agents`, `copilot`, `cursor`).
- Ownership model helpers: `wrapManaged` / `parseManaged` / `isModified`
  (managed header + checksum, ADR-0004).
- `buildProject`, `findRepoRoot`, `applyPlan`.

`repospec upgrade` and version migration arrive in Milestone 5.

## Dependencies

- `@repospec/protocol` — schemas, types, version helpers.
- `@repospec/templates` — default content + adapter templates.

Dependency direction (ADR-0001): `engine → protocol`, `engine → templates`.

# @repospec/engine

The **engine**: the UI-agnostic implementation of the Repospec protocol operations
defined in [`spec/lifecycle.md`](../../spec/lifecycle.md) — `init`, `bootstrap`,
`generate`, `sync`, `doctor`, `upgrade`, `review`, and `architect`.

The engine accepts plain data, never prompts, and operates on injected ports
(a filesystem and, for AI-assisted operations, an `LlmClient`). That keeps it
embeddable in any front-end — the CLI, an editor extension, or a CI action
(ADR-0007). The CLI is just one caller.

## What it provides

- **Operations:** `init`/`planInit`, `bootstrap`/`planBootstrap` (+ `inferProjectInput`),
  `generate`, `sync` (with `check` + ownership guard), `doctor` (with code-drift
  detection + `strict`), `upgrade`/`planUpgrade`, and the AI-assisted `review`
  and `architect`.
- **AI port:** `LlmClient` — a minimal, injectable completion interface, so
  `review`/`architect`/`bootstrap` AI assist are provider-agnostic and testable
  with a fake.
- **Filesystems:** `NodeFileSystem` and `MemoryFileSystem` (`RepospecFileSystem`).
- **Adapters:** `Adapter`, `AdapterRegistry`, and six built-ins — `claude`,
  `agents`, `copilot`, `cursor`, `windsurf`, `gemini`.
- **Plugin runtime (gated):** `runPlugins`, `resolvePlugins`, `buildApprovalLock`,
  `integrityOf` — approved, integrity-pinned plugins run in a worker sandbox
  (ADR-0008/0009).
- **Ownership helpers:** `wrapManaged` / `parseManaged` / `isModified` (managed
  header + checksum, ADR-0004).
- `buildProject`, `findRepoRoot`, `requireRepoRoot`, `applyPlan`.

## Dependencies

- `@repospec/protocol` — schemas, types, version helpers.
- `@repospec/templates` — default content + adapter templates.

Dependency direction (ADR-0001): `engine → protocol`, `engine → templates`.

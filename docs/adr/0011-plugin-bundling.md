# ADR-0011: Bundle plugins at resolve time

- **Status:** Accepted
- **Date:** 2026-07-01
- **Deciders:** Founding engineer
- **Builds on:** [ADR-0010](./0010-plugin-sandbox-permission-model.md) (zero-fs
  `data:`-URL sandbox), [RFC-0001](../../spec/rfcs/0001-plugin-manifest-and-consent.md)

## Context

ADR-0010's sandbox runs a plugin by importing its source as a `data:` URL in a
zero-filesystem child. That imposed a real constraint: a plugin had to be a
**single self-contained module** — a `data:` URL can't resolve relative imports
or `node_modules`. It also left a subtle integrity gap: the hash covered only the
entry file, so a multi-file plugin could be tampered in an *imported* file
without changing the entry's hash.

## Decision

**Bundle each plugin engine-side before it runs**, and hash the bundle.

- When resolving a plugin (for `list`, `approve`, or execution), the engine runs
  **esbuild** on the entry (`bundle: true`, `format: 'esm'`, `platform: 'node'`,
  `write: false`) to produce one self-contained ESM string. Local imports and
  `node_modules` dependencies are inlined; `node:` builtins stay external.
- The **integrity hash is computed over the bundle**, not the entry file. So the
  hash now covers *all* code that will actually run — tampering any imported file
  or dependency changes the hash and fails the approval check.
- The sandbox is unchanged: the bundle (already self-contained) is sent to the
  ADR-0010 child as before. Bundling happens engine-side (full fs); the child
  still receives only source and runs with zero fs.
- This **removes the single-file constraint** from ADR-0010 — plugins may span
  multiple files and depend on packages, as long as they bundle cleanly.

`esbuild` becomes a runtime dependency of `@repospec/engine`.

## Consequences

### Positive
- Plugins can be real projects (multiple modules, dependencies), not one file.
- Integrity covers the entire bundled graph — a strictly stronger tamper check.
- No change to the sandbox's zero-fs guarantee.

### Negative / trade-offs
- `@repospec/engine` gains a heavier dependency (esbuild, a native binary).
- Bundling cost on every resolve (`list`/`approve`/run).
- **Hash depends on the esbuild version.** A different esbuild can emit different
  bytes for the same input, changing the integrity hash and requiring
  re-approval. esbuild is pinned via the lockfile; document the re-approve step
  on upgrades.

### Neutral / follow-ups
- A dependency that itself needs native addons or fs at runtime still won't run
  (the sandbox denies those) — that is intended.

## Alternatives considered

- **Keep the single-file constraint (ADR-0010 as-is).** Rejected — too limiting
  for real plugins, and it left the imported-file integrity gap.
- **Hash the entry only, bundle just for execution.** Rejected — leaves the
  tamper gap on imported files; the hash must cover what actually runs.
- **Require authors to pre-bundle and ship a single file.** Rejected as the
  default — pushes toolchain burden onto every author; engine-side bundling is
  one consistent, hashable step.

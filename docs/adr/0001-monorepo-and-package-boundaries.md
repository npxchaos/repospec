# ADR-0001: Monorepo layout and package boundaries

- **Status:** Accepted (package `core` renamed to `engine` by ADR-0007)
- **Date:** 2026-06-27
- **Deciders:** Founding engineer

> Note: ADR-0007 renames the `core` package to `engine`. Read every mention of
> `@repospec/core` below as `@repospec/engine`. The boundaries and
> dependency directions are unchanged.

## Context

The brief mandates a pnpm monorepo with `cli`, `core`, `protocol`, and
`templates` packages. We must define the dependency direction and each
package's responsibility so the boundaries hold as contributors scale. A core
principle is "every responsibility has a single owner."

## Decision

Use a pnpm-workspaces monorepo with four published packages and a strict,
one-directional dependency graph:

```
@repospec/cli ──▶ @repospec/core ──▶ @repospec/protocol
                                   └───────────▶ @repospec/templates ──▶ (protocol types)
```

Responsibilities:

- **protocol** — the protocol made executable: types, zod schemas, JSON Schema
  generation, version constants, pure (de)serialization. No I/O side effects;
  filesystem is injected. Depends only on zod.
- **core** — the UI-agnostic engine (init/generate/sync/doctor/upgrade, adapter
  registry). Accepts data, never prompts. Depends on protocol + templates.
- **templates** — default content + adapter output templates as data. Depends
  on protocol types only.
- **cli** — the only package with terminal/process concerns (commander, clack).
  Depends on core.

Use **Changesets** for versioning and release notes. Use **tsup** per package.
Defer build orchestrators (nx/turbo) until build time justifies them.

## Consequences

### Positive
- core is embeddable (VS Code extension, CI action) because it has no TTY deps.
- protocol can be published as a standalone implementation aid for the standard.
- Clear ownership makes large-contributor review tractable.

### Negative / trade-offs
- More packages = more release coordination (mitigated by Changesets).
- Injected filesystem adds a small abstraction in protocol/core (justified by
  testability).

### Neutral / follow-ups
- Revisit turbo/nx if CI build time exceeds a few minutes.

## Alternatives considered

- **Single package** — simpler to release but couples the standard to the CLI
  and blocks embedding core elsewhere. Rejected.
- **cli depends directly on protocol/templates** — leaks engine logic into the
  CLI and breaks single-ownership. Rejected; cli only talks to core.

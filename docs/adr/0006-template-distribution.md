# ADR-0006: Bundled, offline-first template distribution

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Founding engineer

## Context

If `repospec init` fetches templates from the network, it becomes
non-deterministic and offline-hostile — the opposite of the
`create-next-app`/`npm`/`git` feel the brief demands. (Weakness W7.)

## Decision

- Templates ship as a **bundled package** (`@repospec/templates`)
  installed with the CLI.
- Phases 1–8 are **fully offline and deterministic**: same answers → same files.
- Templates expose a **manifest** (which files, their ownership, target paths,
  variable interpolation points) so the `engine` can build a deterministic FilePlan.
- The **only** network-touching feature is Phase 9 (AI bootstrap), which is
  strictly opt-in and clearly separated.

## Consequences

### Positive
- Reliable in air-gapped/CI environments; reproducible scaffolds.
- Versioned with the toolchain via Changesets.

### Negative / trade-offs
- Template updates require a package release (acceptable; predictable).

### Neutral / follow-ups
- A future `repospec add` could pull community templates, behind explicit opt-in
  and the same ownership rules.

## Alternatives considered

- **Fetch templates from a registry/git at runtime** — flexible but
  non-deterministic and offline-hostile. Rejected for core flows.

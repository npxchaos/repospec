# ADR-0002: Protocol versioning independent of the toolchain

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Founding engineer

## Context

For Repospec to be a standard, AI assistants and third-party tools must depend on a
stable contract. If the protocol's shape is implied by whatever the CLI happens
to emit, the contract is unstable and unimplementable by others. (Weakness W2.)

## Decision

Introduce a **Repospec Protocol Version** distinct from any package version.

- `project.yaml` declares `repospecProtocol: "MAJOR.MINOR"` (e.g. `"0.1"`).
- The normative meaning of each version lives in `spec/` (one document +
  JSON Schema per version).
- The protocol follows semantic versioning: MAJOR = breaking changes to
  required structure/semantics; MINOR = backward-compatible additions.
- `@repospec/protocol` exports `PROTOCOL_VERSION` and a
  `supports(version)` helper. The CLI advertises the range it supports.
- On a mismatch, tools emit a clear, actionable error (upgrade CLI, or run
  `repospec upgrade` to migrate the repo).
- Protocol changes go through the **RFC process** (see `docs/governance.md`),
  not ordinary PRs.

## Consequences

### Positive
- Third parties can implement against a frozen, documented version.
- `repospec upgrade` has a well-defined job: migrate from version X to Y.
- Decouples shipping CLI features from changing the standard.

### Negative / trade-offs
- Migrations must be written and tested for every breaking protocol change.
- Two version axes (protocol vs. package) to communicate clearly in docs.

### Neutral / follow-ups
- Start at `0.1`; reaching `1.0` signals a stability commitment.

## Alternatives considered

- **Tie protocol to CLI version** — simplest, but makes the standard a moving
  target and blocks external implementations. Rejected.
- **No version field** — impossible to evolve safely. Rejected.

# ADR-0007: Specification-first architecture (Specification → Engine → CLI)

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Founding engineer, project owner
- **Supersedes naming in:** ADR-0001 (package `core` → `engine`)

## Context

The original plan treated the toolchain as the project and the spec as a
Phase-7 deliverable. Review feedback reframed this: **the specification must be
the primary artifact, and the CLI is merely one implementation of it.** The
guiding question is *"what would Repospec v2 look like if the CLI didn't exist?"* —
which forces a clean separation between the standard and any implementation.

This is what lets others build compatible tools without depending on our code,
and it is how standards survive their first implementation.

## Decision

1. **The specification is primary and authored first.** The normative spec
   (`spec/protocol.md`, `repository.md`, `configuration.md`, `agent.md`,
   `workflow.md`, `lifecycle.md`, `versioning.md`) is written *before* Milestone
   0 implementation, not in a later phase. Implementations conform to it.

2. **Adopt the layering Specification → Engine → CLI → Repository.**
   - **Specification** — the standard (`spec/`), implemented in executable form
     by `@repospec/protocol`.
   - **Engine** — `@repospec/engine` (renamed from `core`): the
     UI-agnostic implementation of the protocol operations
     ([`spec/lifecycle.md`](../../spec/lifecycle.md)).
   - **CLI** — `@repospec/cli`: one human entrypoint to the engine.
   - **Repository** — the `.repospec/` directory the spec describes.

3. **Operations are defined by contract, not by CLI.** `lifecycle.md` specifies
   init/generate/sync/doctor/upgrade/bootstrap as state transitions so a
   non-CLI implementation (editor, CI) is equally valid.

4. **Repospec is an umbrella** of components: Repospec Specification, Repospec Engine,
   Repospec CLI, Repospec Templates, Repospec Adapters, Repospec Plugins. Adapters are a
   first-class component (registry in the engine, content in templates; MAY
   become its own package later).

5. **Rename `packages/core` → `packages/engine`** (`@repospec/engine`).
   All dependency directions from ADR-0001 are preserved with the new name.

6. **Add `docs/vision.md`** — the product argument for why Repospec exists,
   independent of its implementation.

## Consequences

### Positive
- Third parties can implement the protocol from `spec/` alone.
- The spec acts as the acceptance criteria for the engine and CLI — we build to
  a written contract instead of discovering it in code.
- "Engine" names the role accurately (it powers any front-end, not just the CLI).

### Negative / trade-offs
- More upfront writing before code. Accepted: a standard with no spec is just a
  tool.
- The spec and implementation can drift; mitigated by generating the JSON Schema
  from code (ADR-0005) and treating spec prose as authoritative.

### Neutral / follow-ups
- Roadmap reordered: a **Specification & Vision** milestone precedes Milestone 0;
  the later "author the spec" work becomes "generate JSON Schema + RFC process."
- ADR-0001's package list is updated wherever it says `core`.

## Alternatives considered

- **Spec last (original plan)** — risks encoding accidental CLI behavior as the
  de-facto standard. Rejected.
- **Keep the name `core`** — accurate-ish but undersells that it implements the
  spec for *any* front-end. `engine` is clearer. Adopted.

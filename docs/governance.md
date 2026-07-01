# Governance

Repospec Protocol aims to be an industry standard. That means the way we make
decisions must be as durable as the code. This document defines how change
happens. It will grow as the community grows; the principles below are stable.

## Two tracks of change

Not all changes are equal. We separate them:

### 1. Code changes → Pull Request
Bug fixes, new CLI features, adapters, refactors, docs, tests. Normal PR review
by code owners. Must keep the protocol contract unchanged.

### 2. Protocol changes → RFC, then ADR, then version bump
Anything that alters the **shape or meaning** of `.repospec/` (the standard):
new required fields, renamed artifacts, changed semantics, new artifact types.

Process:
1. **RFC** opened in `spec/rfcs/NNNN-title.md` describing motivation, proposed
   change, migration impact, and alternatives.
2. Discussion period. Reaching consensus may adjust or reject it.
3. On acceptance: an **ADR** records the decision, the **`spec/`** definition
   and JSON Schema are updated, the **protocol version** is bumped per
   ADR-0002, and a **migration** is provided for `repospec upgrade`.

Why heavier: third parties depend on the protocol. Breaking it cheaply breaks
the ecosystem.

## Roles

- **Maintainers** — review and merge; steward the roadmap.
- **Protocol stewards** — a subset who must approve any RFC/protocol change.
- **Contributors** — anyone opening issues/PRs/RFCs.

A `CODEOWNERS` file maps directories to reviewers; `spec/` and `protocol/`
require a protocol steward.

## Versioning policy

- **Protocol version** — semver of the standard; slow; governed by RFC.
- **Package versions** — semver per package; managed by Changesets; every
  user-facing change ships with a changeset.

## Principles that constrain all decisions

These come straight from the project's charter and override convenience:

- Repository over prompts. Protocol over conversations.
- Human decisions always win. AI follows the protocol.
- Every responsibility has a single owner.
- Small iterations over rewrites. Explicit over hidden.
- Convention over configuration. The protocol is tool-agnostic.

## Supporting documents

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — how to set up, test, and submit changes.
- [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) — Contributor Covenant.
- `.github/CODEOWNERS` — review ownership map.
- [`SECURITY.md`](../SECURITY.md) — vulnerability reporting.

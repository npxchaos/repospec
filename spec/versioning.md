# Repospec Specification — Versioning

- **Specification version:** 0.1 (draft)
- **Status:** Normative
- **Depends on:** [`protocol.md`](./protocol.md)
- **See also:** ADR-0002 (protocol versioning)

> Defines how the Repospec Protocol itself is versioned, how implementations
> declare compatibility, and how repositories migrate between versions. The
> protocol version is independent of any package or tool version — this
> independence is what allows third parties to implement the standard.

## 1. Two version axes

| Axis | What it versions | Cadence | Governed by |
| ---- | ---------------- | ------- | ----------- |
| **Protocol version** | This specification / the `.repospec/` format | Slow, deliberate | RFC process |
| **Package version** | A given implementation (e.g. `@repospec/cli`) | Fast | Changesets |

A repository declares only the **protocol version**, via `repospecProtocol` in
`project.yaml`. It never references a package version.

## 2. Protocol semantic versioning

The protocol version is `MAJOR.MINOR` (a patch axis is unnecessary for a format
specification; editorial fixes that do not change meaning do not bump the
version).

- **MAJOR** — a backward-incompatible change: removing/renaming a required
  field or artifact, changing the meaning of an existing field, or tightening
  validation such that a previously valid repository becomes invalid.
- **MINOR** — a backward-compatible change: adding an OPTIONAL field or artifact,
  adding an enum value, or relaxing validation.

Pre-1.0 (the `0.x` series), MINOR versions MAY include breaking changes; the
project will document each one. Reaching **1.0** is a public commitment to the
MAJOR/MINOR rules above.

## 3. Compatibility rules

- An implementation MUST declare the set (or range) of protocol versions it
  supports.
- When opening a repository, an implementation MUST compare `repospecProtocol`
  against its supported set:
  - **Supported** → proceed.
  - **Newer than supported** → MUST refuse with a clear error advising the
    operator to upgrade the implementation. It MUST NOT guess.
  - **Older but within a supported MAJOR** → MAY proceed, treating absent
    OPTIONAL fields as defaults.
  - **Older MAJOR** → SHOULD offer migration (`upgrade`) rather than operate on
    a stale format.
- An implementation MUST NOT silently rewrite `repospecProtocol` to a different
  value; changing it is an explicit migration.

## 4. Migration

Each MAJOR (and any breaking MINOR in `0.x`) MUST ship with a **migration** that
transforms a conforming repository at version *N* into a conforming repository
at version *N+1*:

- Migrations are pure transformations over the `.repospec/` artifacts.
- Migrations that alter human-authored **source artifacts** require operator
  consent ([`lifecycle.md`](./lifecycle.md) §2.5).
- Migrations MUST be reversible in documentation (a changelog of what changed),
  even if not automatically reversible in code.
- `repospec upgrade` applies the chain of migrations from the repository's current
  version to the target.

## 5. Schema publication

For each protocol version, the JSON Schema for `project.yaml` is published at:

```
schemas/<version>/project.schema.json
```

The schema is generated from the reference implementation (ADR-0005) but the
prose in [`configuration.md`](./configuration.md) is authoritative where the two
disagree. Editors reference the schema by URL for inline validation.

## 6. Changing this specification

Any change to the protocol's shape or semantics follows the **RFC process** in
[`../docs/governance.md`](../docs/governance.md):

1. RFC in `spec/rfcs/NNNN-title.md`.
2. On acceptance: an ADR records the decision; `spec/` and the JSON Schema are
   updated; the protocol version is bumped per §2; a migration is provided.

This deliberately makes protocol changes heavier than code changes — third
parties depend on the stability of the format.

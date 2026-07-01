# ADR-0005: Validation via zod with published JSON Schema

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Founding engineer

## Context

zod is the chosen validator, but a standard must be consumable by tools outside
the TypeScript ecosystem (editors via `$schema`, CI in other languages,
third-party implementations). zod is not language-neutral. (Weakness W5.)

> **Update (2026-07-01):** the schema shipped at repo-root
> `schemas/<protocol-version>/` (hosted on `raw.githubusercontent.com/.../schemas/…`)
> rather than `spec/schema/…`. The decision below stands; only the path changed.

## Decision

- zod schemas in `@repospec/protocol` are the **internal source of truth**
  for validation.
- A build step **generates a JSON Schema** from the zod schemas and publishes it
  to `spec/schema/<protocol-version>/project.schema.json`.
- `project.yaml` may reference it via `# yaml-language-server: $schema=...` (or
  equivalent) for in-editor validation.
- `repospec doctor` and `repospec init` validate with zod and produce **human-first
  error messages** (path + expectation + suggestion), not raw zod dumps.

## Consequences

### Positive
- One authoring surface (zod), two consumers (TS runtime + universal JSON
  Schema). No drift because the schema is generated, not hand-written.
- Editors give inline validation/autocomplete on `project.yaml`.

### Negative / trade-offs
- A generation step to keep wired into CI (snapshot-tested to catch drift).

### Neutral / follow-ups
- Pick a zod→JSON-Schema generator during implementation; pin it.

## Alternatives considered

- **Hand-written JSON Schema as source of truth** — would duplicate logic and
  drift from runtime validation. Rejected.
- **zod only** — blocks non-TS consumers of the standard. Rejected.

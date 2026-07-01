# ADR-0003: Single source of truth with tool adapters

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Founding engineer

## Context

Every AI assistant reads a different entrypoint (`CLAUDE.md`, `.cursor/rules/*`,
`.github/copilot-instructions.md`, etc.). If Repospec only writes `.repospec/`, no
assistant reads it. The value is a single authored source that projects into
each tool's native format. (Weakness W3.)

## Decision

`.repospec/` is the **single source of truth**. **Adapters** (renderers) project it
into tool-specific output files.

- An adapter declares: an `id`, the output path(s) it owns, and a render
  function `(.repospec model) → file contents`.
- Adapters live in/over `@repospec/engine` (registry) with content from
  `@repospec/templates`.
- `project.yaml` lists enabled adapters under an `ai`/`adapters` section.
- `repospec sync` re-renders all enabled adapters; `repospec generate` can target a
  subset.
- Ship at least **one** adapter with the first usable release (Claude/`AGENTS.md`
  is the initial target), with the registry designed for many.

Adapter outputs are **owned by Repospec** (see ADR-0004). Humans edit `.repospec/`,
never the generated outputs.

## Consequences

### Positive
- Real, immediate value: assistants understand the repo with zero prompting.
- New assistants are supported by adding an adapter, not changing the protocol.
- Keeps the protocol tool-agnostic while remaining practically useful.

### Negative / trade-offs
- Adapter outputs can drift if edited out-of-band (mitigated by ADR-0004).
- Each adapter is a maintenance surface tracking an external tool's format.

### Neutral / follow-ups
- Maintain a compatibility table of adapters ↔ assistant versions in docs.

## Alternatives considered

- **Only write `.repospec/`** — pure, but unused by today's assistants. Rejected.
- **Author each tool file by hand** — defeats the single-source-of-truth goal
  and causes drift. Rejected.

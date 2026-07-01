# Contributing to Repospec

Thank you for helping build Repospec. This project aims to become a standard, so the
way we work is deliberate. Please read this before opening your first PR.

## Two tracks of change

| You are changing… | Process |
| ----------------- | ------- |
| Code (CLI, engine, templates, adapters, docs, tests) | **Pull Request** |
| The protocol itself (the `.repospec/` format or its meaning) | **RFC first** — see [`spec/rfcs/0000-template.md`](./spec/rfcs/0000-template.md) and [`docs/governance.md`](./docs/governance.md) |

Protocol changes are heavier on purpose: third parties depend on the format's
stability.

## Prerequisites

- Node.js (see [`.nvmrc`](./.nvmrc))
- pnpm 10+ (`corepack enable` will provide it)

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## The development loop

```bash
pnpm dev            # watch-build all packages
pnpm test:watch     # run tests in watch mode
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm typecheck      # tsc --noEmit across packages
```

Before pushing, make sure the full check suite is green (this is exactly what CI
runs):

```bash
pnpm format:check && pnpm lint && pnpm build && pnpm typecheck && pnpm test
```

## Repository structure

```
spec/        the Repospec Specification (the standard) — read this first
docs/        architecture, ADRs, roadmap, governance, vision
packages/    the reference implementation
  protocol/  executable spec (types + zod)
  engine/    protocol operations (UI-agnostic)
  templates/ default content + adapter templates
  cli/       the repospec command-line front-end
```

The dependency direction is strict: `cli → engine → protocol`/`templates`
(ADR-0001 / ADR-0007). Do not import "upward."

## Definition of Done

Every change must satisfy:

- [ ] Tests pass and cover the change (`pnpm test`).
- [ ] Docs updated (package README / ADR / spec as applicable).
- [ ] A **changeset** is included for user-facing changes (`pnpm changeset`).
- [ ] It respects the ownership model (ADR-0004) and protocol versioning
      (ADR-0002).
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck` are clean.

## Commits & PRs

- Keep changes small and focused — one concern per PR (charter: "small
  iterations over rewrites").
- Use clear, imperative commit subjects.
- Reference the issue/milestone from [`docs/roadmap.md`](./docs/roadmap.md) where
  relevant.

## Architecture decisions

Significant or hard-to-reverse decisions are recorded as ADRs in
[`docs/adr/`](./docs/adr/). If your change makes such a decision, add an ADR
using [`docs/adr/template.md`](./docs/adr/template.md).

## Code of Conduct

Participation is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md).

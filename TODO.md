# Repospec Protocol — TODO & Milestones

High-level tracker. Detail lives in [`docs/roadmap.md`](./docs/roadmap.md);
rationale in [`docs/architecture/overview.md`](./docs/architecture/overview.md)
and the [ADRs](./docs/adr/). Phases follow the charter **in order**.

## Status key
`[ ]` not started · `[~]` in progress · `[x]` done

---

## ▸ Milestone S — Specification & Vision (precedes all code)
- [x] S.1 `docs/vision.md` — product argument
- [x] S.2–S.8 `spec/{protocol,repository,configuration,agent,workflow,lifecycle,versioning}.md`
- [x] S.9 `spec/rfcs/0000-template.md`
- [x] ADR-0007 specification-first architecture; `core` → `engine`

## ▸ Milestone 0 — Repository foundation — ✅ DONE
- [x] 0.1 Scaffold pnpm monorepo (tsconfig, eslint, prettier, vitest)
- [x] 0.2 Packages with enforced boundaries (ADR-0001): protocol, engine, templates, cli
- [x] 0.3 CI pipeline (format/lint/build/typecheck/test) + Changesets
- [x] 0.4 Meta files (CONTRIBUTING, CoC, SECURITY, CODEOWNERS, issue/PR templates)

## ▸ Milestone 1 — Phase 1 & 2: Structure & CLI shell — ✅ DONE
- [x] 1.1 `protocol`: types + zod schemas for `project.yaml`, agents, rules
- [x] 1.2 `protocol`: (de)serialize a `.repospec/` tree (injected fs)
- [x] 1.3 `cli`: commander shell + clack, all commands registered

## ▸ Milestone 2 — Phase 3 & 4: `repospec init` → static `.repospec/` — ✅ DONE
- [x] 2.1 `templates`: seed content (constitution, architecture, workflow, agents, rules)
- [x] 2.2 `engine`: init pipeline (answers → FilePlan → write), re-run safe
- [x] 2.3 `cli`: interview UX (+ non-interactive `--yes`)
- [x] 2.4 In-memory end-to-end tests + committed `examples/demo-service`

## ▸ Milestone 3 — Phase 5: Config files & adapters — ✅ DONE
- [x] 3.1 `engine`: adapter registry + interface (ADR-0003)
- [x] 3.2 Adapters: Claude (`CLAUDE.md`), `AGENTS.md`, Cursor, Copilot
- [x] 3.3 `repospec generate`
- [x] 3.4 `repospec sync` with ownership guard + `--check` (ADR-0004)
- [x] 3.5 `repospec doctor`

## ▸ Milestone 4 — Phase 6: Templates system
- [ ] 4.1 Variable interpolation + partials
- [x] 4.2 Cursor + Copilot adapters _(shipped early in Milestone 3)_
- [ ] 4.3 Template authoring docs

## ▸ Milestone 5 — Phase 7: Protocol validation & schema
- [ ] 5.1 Generate JSON Schema from zod → `spec/schema/0.1/` (ADR-0005)
- [ ] 5.2 Conformance test suite (fixtures validated against the spec)
- [ ] 5.3 `repospec upgrade` skeleton + version-mismatch errors (ADR-0002)
- [ ] 5.4 Reconcile generated schema with `spec/*.md` (drift snapshot)
      _(normative prose spec + RFC scaffolding delivered in Milestone S)_

## ▸ Milestone 6 — Phase 8: Plugins (declarative first)
- [ ] 6.1 Declarative plugin schema
- [ ] 6.2 **Security ADR for plugin runtime** (blocks code execution)
- [ ] 6.3 Plugin discovery + validation (no execution) + `SECURITY.md`

## ▸ Milestone 7 — Phase 9: AI-powered bootstrap (opt-in)
- [ ] 7.1 Repo analysis → draft answers (offline heuristics)
- [ ] 7.2 Optional AI provider behind explicit flag + redaction/consent
- [ ] 7.3 Human approval gate before writing

---

## Definition of Done (every issue)
- [ ] Tests pass (unit + relevant snapshots)
- [ ] Docs updated (package README / ADR / spec as applicable)
- [ ] A Changeset is included for user-facing changes
- [ ] Respects ownership model (ADR-0004) and protocol versioning (ADR-0002)

## Current state (2026-06-27)
**Milestones S, 0, 1, 2, and 3 are complete.** `repospec init`, `repospec doctor`,
`repospec sync` (with `--check` and the ownership guard), and `repospec generate` all
work end-to-end. The protocol schemas validate `.repospec/`, four adapters render
tool entrypoints (Claude, AGENTS.md, Cursor, Copilot), and 27 tests cover the
flows. Next: **Milestone 5** — generate the JSON Schema from zod and add the
`repospec upgrade` skeleton. (Milestone 4's adapters shipped early; interpolation
and authoring docs remain.)

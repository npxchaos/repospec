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
- [x] 3.2 Adapters: Claude (`CLAUDE.md`), `AGENTS.md`, Cursor, Copilot, Windsurf, Gemini
- [x] 3.3 `repospec generate`
- [x] 3.4 `repospec sync` with ownership guard + `--check` (ADR-0004)
- [x] 3.5 `repospec doctor`

## ▸ Milestone 4 — Phase 6: Templates system
- [x] 4.1 Variable interpolation + partials (`interpolate` / `partials`, used by seed content)
- [x] 4.2 Cursor + Copilot adapters _(shipped early in Milestone 3)_
- [x] 4.3 Template authoring docs ([`docs/templates.md`](./docs/templates.md))

## ▸ Milestone 5 — Phase 7: Protocol validation & schema
- [x] 5.1 Generate JSON Schema from zod → `schemas/0.1/` (ADR-0005), CI drift-guard
- [x] 5.2 Conformance test suite (examples + fixtures validated against the schemas)
- [x] 5.3 `repospec upgrade` + version-mismatch handling (ADR-0002)
- [ ] 5.4 Reconcile generated schema with `spec/*.md` (drift snapshot)
      _(normative prose spec + RFC scaffolding delivered in Milestone S)_

## ▸ Milestone 6 — Phase 8: Plugins (declarative first)
- [x] 6.1 Declarative plugin schema (`PluginRefSchema`)
- [x] 6.2 **Security ADR for plugin runtime** — [ADR-0008](./docs/adr/0008-plugin-runtime-security.md) (execution stays blocked until its controls ship)
- [x] 6.3 Plugin discovery + validation (no execution) + `SECURITY.md`

## ▸ Milestone 7 — Phase 9: AI-powered bootstrap (opt-in)
- [x] 7.1 Repo analysis → draft answers (offline heuristics) — `repospec bootstrap`
- [x] 7.2 Optional AI provider behind explicit flag (`bootstrap --ai`; sends detected metadata only, no source)
- [x] 7.3 Human approval gate before writing (bootstrap consent prompt)

_Beyond the original roadmap:_ `repospec review` / `repospec architect` (AI-assisted,
via an injectable `LlmClient`), and heuristic code ⇄ `.repospec/` drift detection in
`doctor` (`--strict` gates it in CI)._

---

## Definition of Done (every issue)
- [ ] Tests pass (unit + relevant snapshots)
- [ ] Docs updated (package README / ADR / spec as applicable)
- [ ] A Changeset is included for user-facing changes
- [ ] Respects ownership model (ADR-0004) and protocol versioning (ADR-0002)

## Current state (2026-07-01)
**The full command surface is implemented:** `init`, `bootstrap`, `generate`,
`sync` (`--check` + ownership guard), `doctor` (`--strict`, with code-drift
detection), `upgrade`, `review`, and `architect`. Six adapters render tool
entrypoints (Claude, AGENTS.md, Cursor, Copilot, Windsurf, Gemini). JSON Schema
is generated from zod and drift-guarded in CI. Packages are published to npm and
released automatically via Changesets. See [`docs/commands.md`](./docs/commands.md).

**Every roadmap deliverable is done, plus post-roadmap plugin hardening.** The
gated plugin runtime ships ([RFC-0001](./spec/rfcs/0001-plugin-manifest-and-consent.md)):
manifests, an integrity-pinned approval lockfile, consent-gated opt-in execution
(`plugins list`/`approve`, `generate --plugins`), resolved from local
`.repospec/plugins/` **or npm**. Execution runs in a subprocess under Node's
Permission Model with no filesystem access
([ADR-0010](./docs/adr/0010-plugin-sandbox-permission-model.md), supersedes
ADR-0009's worker), and `fetch`/`WebSocket` are denied without the `network`
capability. Remaining hardening: airtight network isolation (an OS sandbox
covering sockets — `node:net` isn't blockable in-process) and a bundling step so
multi-file / dependency-bearing plugins can run.

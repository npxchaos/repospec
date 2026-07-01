# Repospec Protocol — Implementation Roadmap

This roadmap turns the architecture into sequenced, shippable work. It follows
the nine phases from the charter **in order — phases are never skipped**. Each
phase maps to a milestone, each milestone to a set of GitHub issues, and each
issue to small implementation tasks.

Legend: every issue below is sized to be a single, reviewable PR. Tasks inside
an issue are checklist items, not separate PRs.

> **Status (2026-07-01): all milestones S–7 are delivered** and shipped in the
> published `@repospec/*` packages — including the gated plugin runtime (Milestone
> 6) and AI-assisted bootstrap (Milestone 7). This document is the original,
> sequenced *plan*; the checklists below are kept as that historical plan and do
> **not** track current completion. For live status see [`../TODO.md`](../TODO.md),
> and for the shipped command surface see [`commands.md`](./commands.md).

---

## Milestone S — Specification & Vision (precedes all code) — ✅ DONE

Goal: the standard exists in writing before any implementation, so the engine
and CLI are built to a contract (ADR-0007). Status: delivered in the design
phase.

- [x] S.1 `docs/vision.md` — the product argument (why Repospec exists).
- [x] S.2 `spec/protocol.md` — terminology, principles, conformance levels.
- [x] S.3 `spec/repository.md` — `.repospec/` layout + ownership model.
- [x] S.4 `spec/configuration.md` — `project.yaml` fields + validation.
- [x] S.5 `spec/agent.md` — agent & rule artifacts (frontmatter + body).
- [x] S.6 `spec/workflow.md` — engineering-workflow artifact.
- [x] S.7 `spec/lifecycle.md` — states + protocol operations (CLI-independent).
- [x] S.8 `spec/versioning.md` — protocol semver, compatibility, migration.
- [x] S.9 `spec/rfcs/0000-template.md` — RFC process scaffolding.

The JSON Schema (`schemas/0.1/`) is intentionally generated later, from the
engine (Milestone 5), with this prose as the authoritative source.

---

## Milestone 0 — Repository foundation (precedes Phase 2 code)

Goal: a contributor can clone, install, build, lint, and test an empty
monorepo. No product code yet.

### Issue 0.1 — Scaffold the pnpm monorepo
- [ ] `package.json` (private root), `pnpm-workspace.yaml` (`packages/*`).
- [ ] Base `tsconfig.base.json`; per-package extends.
- [ ] prettier + eslint config at the root; `format`/`lint` scripts.
- [ ] vitest config at the root; `test` script.
- [ ] Node + pnpm version pin (`.nvmrc` / `packageManager`).

### Issue 0.2 — Create empty packages with boundaries (ADR-0001)
- [ ] `packages/{protocol,engine,templates,cli}` each with `package.json`,
      `src/index.ts`, `tsup.config.ts`, and a stub `README.md`.
- [ ] Wire the dependency graph (cli→engine→protocol/templates).
- [ ] `build` script that builds all packages via tsup.

### Issue 0.3 — CI pipeline
- [ ] GitHub Actions: install → build → lint → test on PRs.
- [ ] Cache pnpm store.
- [ ] Add Changesets + a release-check job.

### Issue 0.4 — Project meta files
- [ ] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CODEOWNERS`.
- [ ] Issue/PR templates under `.github/`.
- [ ] Expand root `README.md` with quickstart + links to `docs/`.

---

## Milestone 1 — Phase 1 + Phase 2: Structure & CLI shell

Goal: `repospec --help` runs and lists planned commands; the CLI is wired to engine
stubs.

### Issue 1.1 — `protocol`: types + zod schemas for `project.yaml`
- [ ] Define `Project` type + zod schema (name, description, `repospecProtocol`,
      stack, conventions, repo type, adapters).
- [ ] Define frontmatter schemas for `agents/*` and `rules/*`.
- [ ] Export `PROTOCOL_VERSION` and `supports()` (ADR-0002).
- [ ] Unit tests: valid + invalid fixtures.

### Issue 1.2 — `protocol`: (de)serialize a `.repospec/` tree
- [ ] Injected-fs interface; read/parse `.repospec/` → model; serialize model →
      files.
- [ ] Round-trip tests with an in-memory fs.

### Issue 1.3 — `cli`: commander shell + clack bootstrap
- [ ] `repospec` binary; register command stubs: `init`, `doctor`, `sync`,
      `review`, `bootstrap`, `upgrade`, `architect`, `generate`.
- [ ] Global `--version` (CLI + supported protocol range), `--help`.
- [ ] Each stub prints "not yet implemented" + exit codes.
- [ ] Smoke test: `--help` and `--version`.

---

## Milestone 2 — Phase 3 + Phase 4: `repospec init` → static `.repospec/`

Goal: `repospec init` runs an interview and writes a complete, valid `.repospec/`.

### Issue 2.1 — `templates`: seed content + manifest (ADR-0006)
- [ ] Seed `constitution.md`, `architecture.md`, `workflow.md`.
- [ ] Starter `agents/*` and `rules/*` with valid frontmatter.
- [ ] Template manifest (files, ownership, target paths, variables).

### Issue 2.2 — `engine`: init pipeline (answers → FilePlan → write)
- [ ] `normalize(answers)` → config; validate with zod.
- [ ] Build a `FilePlan` (writes tagged with owner).
- [ ] Execute the plan via injected fs; dry-run support.
- [ ] Detect existing `.repospec/` → defer to update/upgrade (W8); never
      overwrite without a flag.

### Issue 2.3 — `cli`: interview UX for `init`
- [ ] clack flow: project identity, stack, conventions, adapters.
- [ ] Map answers → engine; render the FilePlan preview; confirm; write.
- [ ] `--yes`/non-interactive mode using defaults.

### Issue 2.4 — Snapshot tests + example output
- [ ] Snapshot the generated `.repospec/` tree for 2–3 archetypes
      (TS library, web app, service).
- [ ] Commit a generated example under `examples/`.

---

## Milestone 3 — Phase 5: Configuration files & adapters

Goal: `.repospec/` projects into at least one assistant's native entrypoint, kept
current by `sync`.

### Issue 3.1 — `engine`: adapter registry + interface (ADR-0003)
- [ ] Adapter contract: `id`, owned paths, `render(model)`.
- [ ] Registry + selection from `project.yaml`.

### Issue 3.2 — First adapter: Claude / `AGENTS.md` + `CLAUDE.md`
- [ ] Render `.repospec/` → assistant entrypoint with managed header (ADR-0004).
- [ ] Snapshot test of rendered output.

### Issue 3.3 — `repospec generate`
- [ ] Render enabled adapters (or a targeted subset).
- [ ] Wire CLI command + tests.

### Issue 3.4 — `repospec sync` with ownership guard (ADR-0004)
- [ ] Checksum-based diff; skip human-modified outputs; `--force`.
- [ ] `--check` mode for CI (no writes, non-zero on drift).
- [ ] Idempotency test (second run = no writes).

### Issue 3.5 — `repospec doctor`
- [ ] Validate `project.yaml` for its declared version; check referenced files;
      detect adapter drift.
- [ ] Human-first error messages; non-zero exit on error.

---

## Milestone 4 — Phase 6: Templates system

Goal: templates are extensible and well-documented (still bundled/offline).

### Issue 4.1 — Variable interpolation + partials in templates.
### Issue 4.2 — Additional adapters (Cursor, Copilot) behind the registry.
### Issue 4.3 — `templates` README documenting how to author a template.

---

## Milestone 5 — Phase 7: Protocol validation & published schema

Goal: the (already-authored, Milestone S) specification becomes machine-checked
and externally consumable.

### Issue 5.1 — Generate JSON Schema from zod → `schemas/0.1/` (ADR-0005).
### Issue 5.2 — Conformance test suite: validate fixtures against the spec.
### Issue 5.3 — `repospec upgrade` skeleton + version-mismatch errors (ADR-0002).
### Issue 5.4 — Reconcile generated schema with `spec/*.md`; drift snapshot test.

> Note: the normative prose spec and RFC scaffolding were delivered in
> **Milestone S**. This milestone makes them executable, it does not re-author
> them.

---

## Milestone 6 — Phase 8: Plugins — ✅ DONE

Goal: a plugin model exists and executes safely — gated by consent + integrity +
a worker sandbox (ADR-0008, ADR-0009, RFC-0001).

### Issue 6.1 — Declarative plugin schema (`PluginRefSchema` + manifest/lockfile).
### Issue 6.2 — Security ADR for the plugin runtime (trust/sandbox): ADR-0008/0009.
### Issue 6.3 — Plugin discovery + validation + approval + gated execution.

---

## Milestone 7 — Phase 9: AI-powered bootstrap (opt-in)

Goal: `repospec bootstrap`/`repospec architect` can infer a draft `.repospec/` from an
existing repo. Strictly opt-in; the only network feature.

### Issue 7.1 — Repo analysis → draft answers (offline heuristics first).
### Issue 7.2 — Optional AI provider behind an explicit flag/config; redaction
                and consent UX.
### Issue 7.3 — Human review/approval gate before writing (human decisions win).

---

## Sequencing rules

- Do not start a milestone before the prior one is green in CI.
- Any issue touching `spec/` or `protocol`'s public shape requires an RFC + ADR.
- Each issue ships with tests and docs — no exceptions (charter rule).

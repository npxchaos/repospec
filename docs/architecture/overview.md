# Repospec — Architecture Overview

> Status: Draft for review. This is the complete target architecture. It is the
> reference every issue and PR is measured against. Significant changes require
> an ADR (see `docs/adr/`). Product rationale lives in
> [`../vision.md`](../vision.md); the standard itself lives in [`../../spec/`](../../spec/).

## 1. Repospec is an umbrella; the Specification is its center

Repospec is not one program — it is a standard plus the components that materialize
it. The **Specification is primary**; everything else implements or serves it.

```
Repospec
├── Repospec Specification   the standard — language-neutral, versioned   ◀ primary
├── Repospec Engine          reference implementation of the spec
├── Repospec CLI             one human entrypoint to the engine
├── Repospec Templates       default content the spec is seeded from
├── Repospec Adapters        project the spec into each assistant's format
└── Repospec Plugins         community extensions (opt-in, consent-gated execution)
```

The organizing layering is **Specification → Engine → CLI → Repository**
(ADR-0007): the CLI calls the Engine, the Engine implements the Specification,
the Specification describes the `.repospec/` Repository. The test of the design:
*if the CLI vanished, the Specification and any other tool built on it still
stand.*

```
┌──────────────────────────────────────────────────────────────┐
│  THE SPECIFICATION  (the standard — language-neutral, versioned)│
│                                                                │
│   spec/*.md            normative definition (authored first)    │
│   schemas/         JSON Schema generated from the engine     │
│   .repospec/              the materialized protocol in a repo      │
│                                                                │
│   Source of truth. Any tool, in any language, can implement.   │
└──────────────────────────────────────────────────────────────┘
                              ▲   implements / maintains
                              │
┌──────────────────────────────────────────────────────────────┐
│  A REFERENCE IMPLEMENTATION  (TypeScript)                       │
│                                                                │
│   @repospec/protocol    executable spec: types + zod      │
│   @repospec/engine      operations: init/generate/sync... │
│   @repospec/templates   default content + adapter content │
│   @repospec/cli         commander + clack UX              │
└──────────────────────────────────────────────────────────────┘
```

The specification is the product. The reference implementation is how we make it
easy to adopt and maintain. Keeping them separate — and versioned independently
(ADR-0002) — is what lets Repospec become a standard rather than a single vendor's
tool.

## 2. The `.repospec/` directory (the protocol in a repo)

```
.repospec/
  project.yaml          # structured metadata — the machine-readable root
  constitution.md       # non-negotiable engineering principles (prose)
  architecture.md       # how THIS project is structured (prose)
  workflow.md           # how work flows: branching, review, release (prose)
  agents/               # role definitions (Markdown + frontmatter)
    <name>.md
  rules/                # focused, enforceable rules (Markdown + frontmatter)
    <name>.md
  templates/            # project-local scaffolding templates (optional)
  plugins/<id>/         # plugin packages + manifest (RFC-0001)
  plugins.lock          # operator approvals gating plugin execution
```

- `project.yaml` is the **root**. It declares the protocol version, project
  identity, stack, conventions, and which adapters are enabled. It is validated
  against a published JSON Schema.
- Prose files (`constitution.md`, `architecture.md`, `workflow.md`) are
  human/AI-readable and referenced from `project.yaml`.
- `agents/*` and `rules/*` use **YAML frontmatter** (validated identity +
  metadata) followed by a Markdown body.
- Everything under `.repospec/` is **owned by humans**. Repospec seeds it from
  templates and never silently overwrites it.

### Tool adapter outputs (owned by Repospec, generated)

These live in their native locations, are generated from `.repospec/`, and carry a
managed header:

```
CLAUDE.md / AGENTS.md
.cursor/rules/repospec.mdc
.github/copilot-instructions.md
... (one per enabled adapter)
```

`repospec sync` regenerates these. They are owned by Repospec; humans edit `.repospec/`,
not the outputs. See ADR-0003 and ADR-0004.

## 3. Package boundaries and dependency direction

```
cli ──▶ engine ──▶ protocol
            └────▶ templates ──▶ (protocol types only)
```

Strict, one-directional. Rationale in ADR-0001 (rename to `engine` in ADR-0007).

### `@repospec/protocol`
The protocol made executable. No side effects beyond pure (de)serialization.

- TypeScript types for every `.repospec/` artifact.
- zod schemas (the internal source of truth for validation).
- JSON Schema generation (published to `schemas/`, hosted on GitHub raw).
- `PROTOCOL_VERSION` constant + version compatibility helpers.
- parse/serialize a `.repospec/` directory tree given an injected filesystem
  (so it is testable without touching disk).

Depends on: nothing (only zod).

### `@repospec/engine`
The engine. Tool-UI-agnostic: it accepts plain data (interview answers,
config), never prompts. This is what makes it testable and embeddable (a VS
Code extension or CI action could use it directly).

- `init` pipeline: answers → validated config → file plan → write.
- `bootstrap`: infer a draft `.repospec/` from an existing repo (offline; opt-in AI).
- `generate`: render artifacts/adapters from `.repospec/`.
- `sync`: diff desired vs. actual adapter outputs; apply respecting ownership.
- `doctor`: validate a repo's `.repospec/`, report problems, detect code drift.
- `upgrade`: migrate between protocol versions.
- `review` / `architect`: AI-assisted, via an injectable `LlmClient` port.
- the **adapter registry** (ten built-in renderers) and the **plugin runtime**
  (approved, integrity-pinned, run in a permission-restricted subprocess).

Depends on: protocol, templates.

### `@repospec/templates`
Default content as data: the seed `constitution.md`, `architecture.md`,
`workflow.md`, starter `agents/` and `rules/`, and adapter output templates
(`CLAUDE.md`, etc.). Minimal logic — mostly files + a manifest.

Depends on: protocol types only.

### `@repospec/cli`
The only package that knows about a terminal. Thin mapping of commands to the
engine. One front-end among possible others (editor extension, CI action).

- commander for command parsing.
- @clack/prompts for the interview.
- renders engine results to the terminal; no business logic here.

Depends on: engine.

## 4. Core flows

### `repospec init`
```
1. Detect existing .repospec/  → if present, hand off to update/upgrade flow.
2. Run interview (cli) → raw answers.
3. engine: answers → normalized config → validate (zod).
4. engine: build a FilePlan (list of writes, with ownership tags).
5. Preview the plan (dry-run friendly).
6. Write .repospec/ from templates + answers.
7. Render enabled adapter outputs.
8. Print next steps.
```
Deterministic and offline. Re-run safe.

### `repospec sync`
```
1. Load + validate .repospec/.
2. Render desired adapter outputs.
3. Diff against on-disk outputs (by managed checksum).
4. Human-modified output? → warn, skip unless --force.
5. Apply changes; report a summary.
```

### `repospec doctor`
```
1. Locate .repospec/.
2. Validate project.yaml against the schema for its declared version.
3. Check referenced files exist; check adapters are in sync.
4. Report errors/warnings with fixes; exit non-zero on error.
```

## 5. Ownership model (summary)

| Artifact                         | Owner  | Sync behavior                       |
| -------------------------------- | ------ | ----------------------------------- |
| `.repospec/**` (source of truth)    | Human  | Seeded once; never silently changed |
| Adapter outputs (`CLAUDE.md` …)  | Repospec  | Regenerated; protected by checksum  |

Full rules: ADR-0004.

## 6. Validation strategy

- zod schemas in `protocol` are the single internal source of truth.
- A build step emits a **JSON Schema** to `schemas/` for external use.
- `doctor` and `init` validate with zod; error messages are human-first.
- Details: ADR-0005.

## 7. Versioning

- **Protocol version** (`repospecProtocol`) — semver of the standard. Slow,
  governed by RFC. Lives in `spec/`.
- **Package versions** — semver of each npm package, managed by Changesets.
- The CLI advertises which protocol versions it supports; mismatches are a
  clear, actionable error. Details: ADR-0002.

## 8. Technology stack (confirmed)

| Concern        | Choice                | Notes                                  |
| -------------- | --------------------- | -------------------------------------- |
| Language       | TypeScript            |                                        |
| Runtime        | Node.js (LTS)         | ESM-first                              |
| Package mgr    | pnpm (workspaces)     |                                        |
| Bundler        | tsup                  | per-package                            |
| CLI parser     | commander             |                                        |
| Prompts        | @clack/prompts        | cli package only                       |
| Validation     | zod                   | + JSON Schema generation               |
| Release        | Changesets            | _addition_ — see W9                    |
| Format/Lint    | prettier / eslint     |                                        |
| Tests          | vitest                | snapshot the generated `.repospec/` tree  |
| Docs           | Markdown              | ADRs + spec + package READMEs          |

## 9. Testing strategy

- **protocol**: unit tests on schemas (valid/invalid fixtures), round-trip
  (de)serialization, JSON Schema generation snapshot.
- **engine**: pipeline tests with an in-memory fs; **snapshot tests** of the full
  generated `.repospec/` tree per project archetype; sync ownership tests.
- **cli**: thin smoke/integration tests (command wiring, exit codes).
- **examples/**: real generated outputs kept in the repo as living fixtures and
  documentation.

## 10. Non-goals (for now)

- Not an agent runtime; Repospec does not execute AI calls except opt-in Phase 9.
- Not a replacement for any assistant; it _feeds_ them.
- No plugin code execution except opt-in, consent- and integrity-gated
  (ADR-0008/0009).
- No network dependency for the core operations (Phases 1–8).

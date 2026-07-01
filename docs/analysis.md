# Repospec Protocol — Analysis: Weaknesses & Improvements

> Status: Draft for review. This document captures the critical analysis that
> precedes any implementation. It is deliberately blunt — the goal is to find
> the weak points _before_ we write code, not after we have shipped them.

## 1. What Repospec Protocol actually is

Before critiquing, we state the thesis precisely so we can measure decisions
against it:

- Repospec Protocol is a **repository-first specification** plus a **reference
  toolchain** that materializes and maintains that specification.
- The **`.repospec/` directory is the single source of truth.** It is
  human-authored (seeded by templates), version-controlled, and tool-agnostic.
- AI coding assistants consume the protocol. The protocol does not depend on
  any specific assistant.

Two distinct things share the project's name and must never be conflated:

1. **The protocol** — a versioned, language-neutral specification of the
   `.repospec/` directory (its files, schema, and semantics). This is the
   standard.
2. **The toolchain** — the `repospec` CLI and its packages that generate,
   validate, and sync the protocol. This is _a_ reference implementation, not
   _the_ standard.

A standard must be implementable by someone who never installs our CLI.

## 2. Weaknesses in the original brief

### W1 — Naming collision between two `architecture.md` files
The brief lists `docs/` (repo documentation) and also a generated
`.repospec/architecture.md` (protocol artifact). These are different audiences and
lifecycles. Without disambiguation, contributors and tools will confuse
"documentation about Repospec" with "documentation Repospec generates."

**Improvement:** repo-level design docs live in `docs/`. Protocol artifacts
live in `.repospec/`. The formal, normative protocol definition lives in `spec/`.
Never reuse a filename across these three roots for different meanings.

### W2 — The protocol is not versioned independently of the CLI
If the CLI and the protocol evolve as one, no AI tool can safely depend on the
protocol: a CLI patch could silently change the contract. A standard needs its
own semantic version.

**Improvement:** introduce a **Repospec Protocol Version** (`repospecProtocol: "0.1"`)
stored in `project.yaml` and defined in `spec/`. The CLI declares which
protocol versions it supports. `repospec upgrade` migrates between protocol
versions. See ADR-0002.

### W3 — "Tool-agnostic" is asserted but the mechanism is missing
The brief says "every AI coding assistant should understand the repository
without prompts." In reality each assistant reads a _different_ entrypoint:

| Assistant      | Entrypoint it reads today            |
| -------------- | ------------------------------------ |
| Claude Code    | `CLAUDE.md`, `AGENTS.md`             |
| Cursor         | `.cursor/rules/*`, `.cursorrules`    |
| GitHub Copilot | `.github/copilot-instructions.md`    |
| Aider          | `CONVENTIONS.md`                      |
| Windsurf       | `.windsurfrules`                      |

If Repospec only writes `.repospec/`, no assistant reads it yet. The value is a
**single source of truth that projects into each tool's native entrypoint.**

**Improvement:** make **adapters** (a.k.a. renderers) a first-class concept.
`.repospec/` is authored once; adapters render tool-specific files from it; `repospec
sync` keeps them current. This is the killer feature and must be in the
architecture from day one, even if only one adapter ships first. See ADR-0003.

### W4 — Generated vs. human-edited files: no ownership model
"Human decisions always win" and "every responsibility has a single owner" are
stated as principles, but `repospec sync` regenerating files will destroy human
edits unless ownership is explicit. This is the #1 way file-generators lose
users' trust.

**Improvement:** define a strict ownership model. `.repospec/` source files are
**owned by humans** and never overwritten silently. Adapter outputs (e.g.
`CLAUDE.md`) are **owned by Repospec** and carry a managed header + checksum;
sync refuses to clobber files a human has modified out-of-band without
`--force`. See ADR-0004.

### W5 — Validation layer underspecified; no public schema
zod is chosen, but a _standard_ needs a language-neutral contract. Editors, CI
in non-JS repos, and third-party implementations cannot consume zod.

**Improvement:** zod is the internal source of truth; we **generate and publish
a JSON Schema** for `project.yaml` from it. The JSON Schema ships in `spec/`
and is referenceable by `$schema`. See ADR-0005.

### W6 — Markdown vs. structured data boundary is fuzzy
`project.yaml` is structured; `constitution.md`, `architecture.md`,
`workflow.md` are prose; `agents/` and `rules/` are somewhere in between.
Without a rule, we cannot validate or machine-process the in-between files.

**Improvement:** adopt **Markdown + YAML frontmatter** for `agents/*` and
`rules/*` — the frontmatter is validated by zod (machine-readable identity and
metadata), the body is prose (human/AI-readable). Pure prose files
(`constitution.md`, `architecture.md`, `workflow.md`) remain free-form but are
referenced from `project.yaml`.

### W7 — Template distribution and determinism
If templates are fetched from the network at `init` time, `repospec init` becomes
non-deterministic and offline-hostile — the opposite of `create-next-app`'s
feel.

**Improvement:** templates are a **bundled package** (`@repospec/
templates`) shipped with the CLI. Phases 1–8 are fully offline and
deterministic. Only Phase 9 (AI bootstrap) touches the network, and it is
strictly opt-in. See ADR-0006.

### W8 — `repospec init` re-run behavior
Running `init` twice must not silently overwrite an existing `.repospec/`. The
brief does not address this.

**Improvement:** `init` detects an existing `.repospec/`, and switches to an
update/merge flow (or defers to `repospec sync` / `repospec upgrade`). Destruction
requires an explicit flag.

### W9 — Monorepo release & versioning tooling unspecified
Four published packages need coordinated versioning and changelogs.

**Improvement:** pnpm workspaces + **Changesets** for versioning and release
notes. Deliberately avoid heavier orchestrators (nx/turbo) until build times
justify them — "avoid unnecessary abstractions."

### W10 — Governance for a would-be standard is absent
Thousands of contributors and a public standard need: a CODEOWNERS map, a
Contributor Covenant, a CONTRIBUTING guide, ADRs (chosen), and — critically —
an **RFC process for protocol changes** that is heavier than a normal code PR.
Changing the standard is not the same as fixing a bug.

**Improvement:** two-track change process. Code changes → PR. Protocol changes
→ RFC (in `spec/rfcs/`) → ADR → version bump. See `docs/governance.md`.

### W11 — Plugin security (Phase 8)
Plugins imply executing third-party code during `init`/`generate`. That is an
arbitrary-code-execution surface in developers' repos.

**Improvement:** defer the plugin _runtime_ design to its own ADR with an
explicit trust/sandbox model. Until then, plugins are declarative only. No
plugin code runs before Phase 8 lands with a security review.

### W12 — The `repospec`/`@repospec` naming risk
"Repospec" is heavily used (Laravel Repospec, Minecraft Repospec, SourceHut). The npm
name `repospec` is taken.

**Improvement:** publish under the scope **`@repospec/*`**; keep the
binary named `repospec` (with a documented fallback if it collides locally).
Confirm npm scope availability before first publish.

## 3. Improvements summary (actionable)

1. Separate **protocol** (standard) from **toolchain** (implementation) in
   docs, versioning, and governance.
2. Add a **protocol version** field and compatibility checks.
3. Make **adapters/renderers** a core concept; ship `.repospec/` + at least one
   tool adapter from the first usable release.
4. Define a strict **ownership + idempotent sync** model with managed markers.
5. Generate and publish a **JSON Schema** from zod.
6. Standardize **Markdown + frontmatter** for semi-structured artifacts.
7. **Bundle templates**; keep Phases 1–8 offline and deterministic.
8. Make `init` **re-run safe**.
9. Use **Changesets**; avoid premature build orchestration.
10. Establish **governance + an RFC process** for protocol changes.
11. Treat **plugins** as a security boundary; declarative-only until reviewed.
12. Resolve **naming** via the `@repospec` scope.

These improvements are folded into the architecture and the roadmap that
follow.

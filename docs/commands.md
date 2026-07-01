# Repospec Commands

The `repospec` CLI is one front end to the engine; every command maps to an
engine operation (`spec/lifecycle.md`). Install it with `npm i -g @repospec/cli`
or run it ad hoc with `npx @repospec/cli <command>`.

All commands operate on the nearest `.repospec/` directory, found by walking up
from the current working directory.

## Lifecycle at a glance

```
(no .repospec/)                     .repospec/ exists
      │                                   │
   init ──────────────▶ .repospec/ ◀───── bootstrap (infer a draft from the repo)
      │                                   │
      ├── generate / sync ──▶ AGENTS.md, CLAUDE.md, …  (tool entrypoints)
      ├── doctor ───────────▶ validate + report drift
      ├── review ───────────▶ judge a diff against the rules (AI)
      ├── architect ────────▶ draft architecture.md (AI)
      └── upgrade ──────────▶ migrate to a newer protocol version
```

## Authoring & generation

| Command | What it does |
| --- | --- |
| `repospec init [--yes] [--force] [--name] [--description] [--type] [--languages] [--adapters]` | Scaffold a `.repospec/` and generate tool entrypoints. Interactive by default; `--yes` uses flags/defaults. Re-run safe — never overwrites human-owned files without `--force`. |
| `repospec bootstrap [--yes] [--force] [--ai] [--no-import-docs]` | Infer a **draft** `.repospec/` from an existing repo (package.json, lockfiles, dependencies) — offline by default, no network. It also seeds the prose docs from your repository's existing docs when present — `architecture.md` from `ARCHITECTURE.md`, `workflow.md` from `CONTRIBUTING.md`, `constitution.md` from `PRINCIPLES.md`/`ACTION_PLAN.md`, and similar (see below) — so you start from real content, not a blank template. Pass `--no-import-docs` to skip that and use the generic templates. Shows what it detected and writes only on approval (`--yes` to skip the prompt). `--ai` opts in to refining the description with a model; it sends only the detected metadata (name + evidence), never source code or doc contents, and still produces a draft for review. |
| `repospec generate [--force] [--only <ids>] [--plugins]` | Render tool entrypoints from `.repospec/`. `--plugins` also includes outputs from approved plugins (see Plugins below). |
| `repospec sync [--force] [--check] [--plugins]` | Regenerate entrypoints, honoring the ownership model — a hand-edited output is not overwritten without `--force`. `--check` reports drift and exits non-zero (CI). `--plugins` includes approved plugin outputs. |

### Bootstrap doc import

`bootstrap` looks for your repository's existing documentation and seeds the
matching `.repospec/` prose file from it — the first existing, non-empty match
wins, imported verbatim under a provenance note (the source's own top-level
title is stripped). This is offline: it reads only local files.

| `.repospec/` file | Sourced from (in priority order) |
| --- | --- |
| `architecture.md` | `ARCHITECTURE.md`, `ARCHITECTURE.markdown`, `docs/architecture.md`, `docs/architecture/README.md`, `docs/architecture/overview.md`, `docs/ARCHITECTURE.md` |
| `constitution.md` | `CONSTITUTION.md`, `PRINCIPLES.md`, `ENGINEERING.md`, `docs/constitution.md`, `docs/principles.md`, `docs/engineering-principles.md`, `ACTION_PLAN.md`, `PLAN.md` |
| `workflow.md` | `WORKFLOW.md`, `docs/workflow.md`, `docs/development.md`, `DEVELOPMENT.md`, `CONTRIBUTING.md`, `docs/contributing.md` |

The result is a **draft you own** — review and trim it. Pass `--no-import-docs`
to fall back to the generic templates.

### Claude Code subagents (`claude-agents` adapter)

Enable the `claude-agents` adapter (in `project.yaml` `adapters:` or at `init`)
to project **each `.repospec/agents/<id>.md` role into a native Claude Code
subagent** at `.claude/agents/<id>.md` — frontmatter (`name`, `description`,
optional `model`) plus a system prompt built from the role's responsibilities,
boundaries, and body. `repospec sync` keeps them current from the single source
of truth.

Why it matters: those subagents are directly invocable in Claude Code and can be
**fanned out in parallel**. Repospec defines the roles and shared context; the
tool runs them. For parallel *writers*, give each a git worktree or scope roles
to disjoint files (rule `appliesTo` globs) so they don't collide.

## Validation

| Command | What it does |
| --- | --- |
| `repospec doctor [--strict]` | Validate `.repospec/` and report problems. Detects: missing referenced documents, unknown adapters, duplicate plugins, generated-output drift, **code ⇄ `.repospec/` drift** (declared stack vs. what the repo actually contains — languages, runtimes, package manager, frameworks, testing tools), and **rule-target drift** (a rule whose `appliesTo` globs match no files — it targets code that no longer exists). Warnings don't fail by default; `--strict` makes any warning a failure, so CI can gate on drift. |

## Evolution

| Command | What it does |
| --- | --- |
| `repospec upgrade [--yes]` | Migrate `.repospec/` to the protocol version this tool targets, applying the chain of migrations and bumping `repospecProtocol`. Reports when already current, refuses a repo declaring a newer protocol, and asks before editing source (`--yes` to skip). |

## AI-assisted (opt-in)

`review` and `architect` call a language model. Credentials are resolved by the
Anthropic SDK — set `ANTHROPIC_API_KEY`, or authenticate with `ant auth login`.
The model defaults to `claude-opus-4-8`; override with `REPOSPEC_MODEL`. The
engine talks to an injectable `LlmClient` port, so these operations are
provider-agnostic and unit-tested without a network.

| Command | What it does |
| --- | --- |
| `repospec review [ref] [--staged] [--strict]` | Review a change — `git diff <ref>` (default `HEAD`), or `--staged` for the index — against the constitution and rules. Prints findings; exits non-zero on an `error`-severity finding, or on any finding with `--strict`. |
| `repospec architect <request> [--write]` | Draft or revise `architecture.md` from the project identity and current document. Prints a draft; `--write` saves it (after confirmation). |

## Plugins

`project.yaml` may declare `plugins` (see [`spec/configuration.md`](../spec/configuration.md)
§3.7). A plugin is resolved from a local `.repospec/plugins/<id>/` **or** an
installed npm package `<id>`, each shipping a `repospec-plugin.yaml` manifest
([RFC-0001](../spec/rfcs/0001-plugin-manifest-and-consent.md)). It runs only
under the trust model in [ADR-0008](./adr/0008-plugin-runtime-security.md):
**integrity + consent are the gate**, execution is a subprocess under Node's
Permission Model with no filesystem access and no ambient environment
([ADR-0010](./adr/0010-plugin-sandbox-permission-model.md)), and it is opt-in.
A plugin gets `fetch`/`WebSocket` only if approved for the `network` capability
(low-level `node:net` access can't be blocked in-process — see ADR-0010).

| Command | What it does |
| --- | --- |
| `repospec plugins list` | List declared plugins with their approval status and declared capabilities. |
| `repospec plugins approve [--yes]` | Write `.repospec/plugins.lock` approving each declared plugin's **exact current code** (pinned by integrity hash) and its declared capabilities. |
| `repospec generate --plugins` / `repospec sync --plugins` | Include outputs from approved plugins. A plugin runs only if the lockfile approves it and the on-disk integrity still matches; anything else is skipped with a warning, never run. |

A plugin default-exports `async ({ repo, capabilities }) => ({ outputs: [{ path, body }] })`.
It may span multiple files and use dependencies — the engine **bundles** it with
esbuild before running it, and pins the integrity hash over the whole bundle
([ADR-0011](./adr/0011-plugin-bundling.md)). Its outputs go through the same
ownership/managed pipeline as adapter outputs (managed header; never clobber
hand-edits without `--force`). Executable plugins require the `generate-outputs`
capability, declared in the manifest and approved in the lockfile.

## Exit codes

`0` success; non-zero when a command reports a blocking condition — `sync
--check`/`doctor --strict` on drift, `doctor` on an error-level issue, `review`
on an error finding, `upgrade` on an unresolvable state, or any command on an
unexpected error.

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
| `repospec bootstrap [--yes] [--force] [--ai]` | Infer a **draft** `.repospec/` from an existing repo (package.json, lockfiles, dependencies) — offline by default, no network. Shows what it detected and writes only on approval (`--yes` to skip the prompt). `--ai` opts in to refining the description with a model; it sends only the detected metadata (name + evidence), never source code, and still produces a draft for review. |
| `repospec generate [--force] [--only <ids>] [--plugins]` | Render tool entrypoints from `.repospec/`. `--plugins` also includes outputs from approved plugins (see Plugins below). |
| `repospec sync [--force] [--check] [--plugins]` | Regenerate entrypoints, honoring the ownership model — a hand-edited output is not overwritten without `--force`. `--check` reports drift and exits non-zero (CI). `--plugins` includes approved plugin outputs. |

## Validation

| Command | What it does |
| --- | --- |
| `repospec doctor [--strict]` | Validate `.repospec/` and report problems. Detects: missing referenced documents, unknown adapters, duplicate plugins, generated-output drift, and **code ⇄ `.repospec/` drift** (declared stack vs. what the repo actually contains — languages, runtimes, package manager, frameworks, testing tools). Warnings don't fail by default; `--strict` makes any warning a failure, so CI can gate on drift. |

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
§3.7). A plugin lives at `.repospec/plugins/<id>/` with a `repospec-plugin.yaml`
manifest ([RFC-0001](../spec/rfcs/0001-plugin-manifest-and-consent.md)) and runs
only under the trust model in
[ADR-0008](./adr/0008-plugin-runtime-security.md) / [ADR-0009](./adr/0009-plugin-sandbox-mechanism.md):
**integrity + consent are the gate**, execution is a subprocess under Node's
Permission Model with no filesystem access and no ambient environment
([ADR-0010](./adr/0010-plugin-sandbox-permission-model.md)), and it is opt-in.

| Command | What it does |
| --- | --- |
| `repospec plugins list` | List declared plugins with their approval status and declared capabilities. |
| `repospec plugins approve [--yes]` | Write `.repospec/plugins.lock` approving each declared plugin's **exact current code** (pinned by integrity hash) and its declared capabilities. |
| `repospec generate --plugins` / `repospec sync --plugins` | Include outputs from approved plugins. A plugin runs only if the lockfile approves it and the on-disk integrity still matches; anything else is skipped with a warning, never run. |

A plugin is a module that default-exports `async ({ repo, capabilities }) => ({ outputs: [{ path, body }] })`.
Its outputs go through the same ownership/managed pipeline as adapter outputs, so
they carry a managed header and never clobber hand-edits without `--force`.
Executable plugins require the `generate-outputs` capability, declared in the
manifest and approved in the lockfile.

## Exit codes

`0` success; non-zero when a command reports a blocking condition — `sync
--check`/`doctor --strict` on drift, `doctor` on an error-level issue, `review`
on an error finding, `upgrade` on an unresolvable state, or any command on an
unexpected error.

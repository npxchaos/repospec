# @repospec/protocol

## 0.8.0

### Minor Changes

- 23e9fd7: Plugins are now **bundled** engine-side with esbuild before they run
  ([ADR-0011](https://github.com/npxchaos/repospec/blob/main/docs/adr/0011-plugin-bundling.md)),
  lifting ADR-0010's single-file constraint: a plugin may span multiple files and
  use dependencies (local imports and `node_modules` are inlined; `node:` builtins
  stay external). The integrity hash is now computed over the **whole bundle**, so
  tampering any imported file or dependency — not just the entry — fails the
  approval check. The sandbox is unchanged (the self-contained bundle runs in the
  zero-fs `data:`-URL child). `@repospec/engine` gains esbuild as a dependency; the
  integrity hash depends on the esbuild version (re-approve after an upgrade).

## 0.7.0

### Minor Changes

- 7e1a7fd: Plugin hardening: capability-gated network + npm resolution.

  - **Network capability enforced (partial):** a plugin not approved for the
    `network` capability runs with `fetch` and `WebSocket` replaced by throwing
    stubs. Low-level `node:net`/`node:http` can't be blocked in-process (Node has
    no network permission, and loader-hook gating needs `--allow-worker`, which the
    sandbox denies), so that residual remains — see ADR-0010; full isolation needs
    an OS sandbox.
  - **npm resolution:** a declared plugin now resolves from a local
    `.repospec/plugins/<id>/` **or** an installed npm package `<id>` that ships a
    `repospec-plugin.yaml`. Resolution/reads happen engine-side; the sandboxed
    child still receives only the source (zero-fs). Plugin entries must remain
    single self-contained modules.

- 7c6e8f9: Harden the plugin sandbox (ADR-0010, supersedes ADR-0009's worker). Approved
  plugins now run in a child `node` process under Node's Permission Model with
  **no filesystem access** (no read or write), no child-process/worker/addon
  permissions, and `env: {}`. The engine reads the (integrity-checked) plugin
  source and the child imports it as a `data:` URL, so it needs zero fs grants —
  an OS-enforced boundary, not cooperative isolation. Filesystem writes from a
  plugin are now blocked by the runtime (verified by test). Constraint: a plugin
  entry must be a single self-contained module (bundle any dependencies), since a
  `data:` URL cannot resolve relative or `node_modules` imports.

## 0.6.0

### Minor Changes

- b74f6a0: Ship the plugin runtime (ADR-0008 trust model, ADR-0009 sandbox, RFC-0001
  manifest/lockfile). Plugins now execute — safely and opt-in:

  - **protocol:** `PluginManifest` / `PluginLock` schemas + `parsePluginManifest`,
    `parsePluginLock`, `serializePluginLock`.
  - **engine:** `runPlugins` / `resolvePlugins` / `buildApprovalLock` + `integrityOf`.
    A plugin runs only if `.repospec/plugins.lock` approves it with a matching
    integrity hash and the `generate-outputs` capability (declared + approved).
    Execution is a `worker_threads` worker with **no ambient environment**;
    integrity + consent are the load-bearing controls (the worker is
    defense-in-depth, not a hard boundary — see ADR-0009). Outputs flow through the
    same ownership/managed pipeline as adapters.
  - **cli:** `repospec plugins list` / `repospec plugins approve`, and `--plugins`
    on `generate` / `sync` (off by default). Plugin execution is opt-in and skipped
    with a warning for anything unapproved or tampered.

### Patch Changes

- 604f373: Refresh package READMEs to the current, feature-complete surface: all nine CLI
  commands, six adapters, the `LlmClient` port, the plugin runtime, and the
  manifest/lockfile schemas (they previously described a Milestone 1–3 subset).

## 0.5.0

### Minor Changes

- 07bec44: Add opt-in AI assist to `repospec bootstrap` (`--ai`). When enabled, the detected
  facts (project name + the inference evidence — metadata only, never source code)
  are sent to the model to refine the project description; the result is still a
  draft for human approval. `planBootstrap` gains an optional `llm` (the engine's
  injectable `LlmClient` port), so the assist is provider-agnostic and unit-tested
  with a fake. Offline inference remains the default. Closes roadmap 7.2.
- 16f258c: Add the AI-assisted operations `repospec review` and `repospec architect`,
  completing the protocol's command surface.

  - `review` judges a change (a `git diff`) against the repository's constitution
    and rules, returning structured findings; exits non-zero on an error-severity
    finding (`--strict` for any finding).
  - `architect` drafts or revises `.repospec/architecture.md` from the project
    identity and current document; prints a draft, `--write` to save it.

  The engine gains a small, injectable `LlmClient` port, so the operations stay
  UI- and vendor-agnostic and unit-testable with a fake (ADR-0007). The CLI
  supplies a Claude implementation via `@anthropic-ai/sdk` (model `claude-opus-4-8`,
  adaptive thinking); it resolves credentials from `ANTHROPIC_API_KEY` or an
  `ant auth login` profile. All roadmap command stubs are now implemented.

- 49809e9: Plugins (declarative), deeper drift detection, and a command reference.

  - **Plugins (declarative only):** `doctor` validates declared `plugins` (warns on
    duplicates) and the generated guide now lists them, explicitly noting no plugin
    code is executed (spec §3.7; roadmap Milestone 6 discovery + validation).
  - **Deeper code drift:** `doctor` now also compares declared runtimes against the
    repo, and `bootstrap` infers the Node runtime version from `package.json`
    `engines.node` (e.g. `node20`).
  - **Docs:** add `docs/commands.md` (full command reference) and refresh `TODO.md`
    to the current, feature-complete command surface.

## 0.4.0

### Minor Changes

- f81d077: `repospec doctor --strict` treats warnings — including code ⇄ `.repospec/` drift —
  as failures, so CI can gate on them. Also extend drift detection to testing tools
  (declared `stack.testing` vs the dependencies), in both directions.
- c06a2c7: Implement `repospec upgrade` — the protocol-migration operation (`spec/versioning.md`
  §4). It reads the repository's declared `repospecProtocol`, compares it to what the
  tool targets, and: reports when already current; refuses a repo declaring a newer
  protocol; and, for an older repo, applies the chain of migrations, bumping
  `repospecProtocol` (edits to source artifacts require consent). The migration
  registry is empty for now — `0.1` is the first protocol version — but the mechanism
  is complete and tested. Adds `parseProtocolVersion` / `compareProtocolVersions` to
  `@repospec/protocol`.

## 0.3.0

### Minor Changes

- f3ad5c6: Add `repospec bootstrap` — infer a draft `.repospec/` from an existing repository
  using offline heuristics (manifests, lockfiles, dependencies), presented for human
  review before writing. Add Windsurf (`.windsurf/rules/repospec.md`) and Gemini CLI
  (`GEMINI.md`) adapters.
- 2e80c89: `repospec doctor` now warns on code ⇄ `.repospec/` drift: it compares the declared
  stack (languages, package manager, frameworks) against what the repository actually
  contains, using the same offline inference as `bootstrap`. Warnings only, gated to
  repositories with a `package.json`. Also fix `repospec --version`, which reported
  `0.0.0` instead of the real package version.

### Patch Changes

- 0577d96: Add `keywords` to each package for npm discoverability.

## 0.2.1

### Patch Changes

- 11465bf: Point the generated `project.yaml` `$schema` at a hosted JSON Schema
  (`raw.githubusercontent.com/npxchaos/repospec/main/schemas/0.1/project.schema.json`)
  instead of the unhosted `repospec.dev` URL, fixing a dead link in every generated
  repository.

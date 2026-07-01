# @repospec/cli

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

### Patch Changes

- Updated dependencies [f81d077]
- Updated dependencies [c06a2c7]
  - @repospec/engine@0.4.0

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
- Updated dependencies [f3ad5c6]
- Updated dependencies [2e80c89]
- Updated dependencies [0577d96]
  - @repospec/engine@0.3.0

## 0.2.1

### Patch Changes

- 11465bf: Point the generated `project.yaml` `$schema` at a hosted JSON Schema
  (`raw.githubusercontent.com/npxchaos/repospec/main/schemas/0.1/project.schema.json`)
  instead of the unhosted `repospec.dev` URL, fixing a dead link in every generated
  repository.
- Updated dependencies [11465bf]
  - @repospec/engine@0.2.1

# Changelog

All notable changes to Repospec are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-07-01

First working draft of the Repospec Protocol: an open, tool-agnostic standard that
makes a repository self-describing to AI coding agents. Humans author a `.repospec/`
directory; a build tool compiles it into the root `AGENTS.md` that agents already read.

### Added

- **Protocol specification (v0.1).** `docs/spec-v0.1.md` defines the `.repospec/`
  directory — `project.yaml`, `constitution.md`, `workflow.md`, `agents/`, `rules/`,
  `decisions/`, `history/`, `templates/` — and the invariant that humans edit
  `.repospec/` while `AGENTS.md` is generated. Accompanied by `docs/manifesto.md`.
- **Roles model.** Named responsibilities (`.repospec/agents/`) with owned scope,
  bounded authority, and defined hand-offs — a contract per role, replacing
  "act like a senior engineer."
- **Durable memory model.** Versioned decisions (`.repospec/decisions/`, append-only
  ADRs) and narrative history (`.repospec/history/`) that outlive any single
  conversation or model.
- **Reference build tool.** `tools/repospec_build.py` compiles `.repospec/` into
  `AGENTS.md` (`repospec build`) and, with `--check`, verifies the committed
  `AGENTS.md` is current without writing. Dependency-light — PyYAML only.
- **CI drift-guard.** `.github/workflows/repospec.yml` runs `repospec build --check`
  on every push and pull request, failing when `AGENTS.md` drifts from `.repospec/`.
- **Worked example.** `examples/acme-billing/` — a complete `.repospec/` and its
  generated `AGENTS.md`.

### Changed

- **Renamed the project `forge` → `repospec`** to avoid colliding with Foundry's
  Solidity CLI, whose first command is literally `forge init`. The rename covers the
  protocol name, the CLI verb, the reference build tool, the `.repospec/` convention
  directory, and all user-facing strings and prose.

### Known limitations (open problems)

- **Enforcement — partially addressed.** `AGENTS.md` is advisory; an agent can ignore
  it. v0.1.0 ships a CI check that the compiled `AGENTS.md` is current, which closes
  the staleness gap. Optional gate hooks that enforce the workflow at commit/merge
  time remain future work.
- **Drift detection — still open.** When code and `.repospec/` diverge (as opposed to
  `AGENTS.md` drifting from `.repospec/`), there is no mechanism yet to detect the
  divergence or decide which side wins before it misleads an agent.

[0.1.0]: https://github.com/npxchaos/repospec/releases/tag/v0.1.0

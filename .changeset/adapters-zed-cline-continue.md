---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Add three built-in adapters — **Zed** (`.rules`), **Cline**
(`.clinerules/repospec.md`), and **Continue** (`.continue/rules/repospec.md`) —
bringing the total to nine. Paths verified against each tool's current
documentation. Enable them in `project.yaml` `adapters` (or via `repospec init`).

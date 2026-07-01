---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Plugins (declarative), deeper drift detection, and a command reference.

- **Plugins (declarative only):** `doctor` validates declared `plugins` (warns on
  duplicates) and the generated guide now lists them, explicitly noting no plugin
  code is executed (spec §3.7; roadmap Milestone 6 discovery + validation).
- **Deeper code drift:** `doctor` now also compares declared runtimes against the
  repo, and `bootstrap` infers the Node runtime version from `package.json`
  `engines.node` (e.g. `node20`).
- **Docs:** add `docs/commands.md` (full command reference) and refresh `TODO.md`
  to the current, feature-complete command surface.

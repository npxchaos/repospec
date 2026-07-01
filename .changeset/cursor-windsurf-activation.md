---
'@repospec/engine': patch
'@repospec/cli': patch
---

Fix Cursor and Windsurf rule activation. Both tools require frontmatter for a
rule file to auto-apply, which the generated outputs were missing — so the files
were written but never loaded. The `cursor` adapter now emits `.mdc` frontmatter
with `alwaysApply: true` (and a `description`), and the `windsurf` adapter now
emits `trigger: always_on`. The managed-header wrapper keeps this frontmatter on
line 1. Paths are unchanged (`.cursor/rules/repospec.mdc`,
`.windsurf/rules/repospec.md`); run `repospec sync` to regenerate.

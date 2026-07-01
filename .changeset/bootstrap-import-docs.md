---
'@repospec/engine': minor
'@repospec/cli': minor
---

`bootstrap` now seeds the prose documents from a repository's existing docs
instead of leaving generic templates. Offline and local-only: `architecture.md`
is filled from `ARCHITECTURE.md` (and similar), `workflow.md` from
`CONTRIBUTING.md`, `constitution.md` from `PRINCIPLES.md`/`ACTION_PLAN.md`, and
so on — the first existing, non-empty match is imported verbatim under a
provenance note (its own top-level title stripped). The result is a draft you
own and edit. Pass `--no-import-docs` to fall back to the templates. Engine adds
`harvestProse` and a `seedOverrides` option on `planInit`.

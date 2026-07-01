---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

`repospec doctor` now detects **rule-target drift**: a rule whose `appliesTo`
globs match no files in the repository is flagged, since it targets code that no
longer exists. This extends drift detection past the stack into the `.repospec/`
artifacts themselves. It only runs when a rule declares `appliesTo` (repositories
that don't use it pay nothing), and — like other drift — it's a warning that
`--strict` promotes to a CI failure.

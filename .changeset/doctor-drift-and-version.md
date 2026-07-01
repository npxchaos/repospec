---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

`repospec doctor` now warns on code ⇄ `.repospec/` drift: it compares the declared
stack (languages, package manager, frameworks) against what the repository actually
contains, using the same offline inference as `bootstrap`. Warnings only, gated to
repositories with a `package.json`. Also fix `repospec --version`, which reported
`0.0.0` instead of the real package version.

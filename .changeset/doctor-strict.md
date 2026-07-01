---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

`repospec doctor --strict` treats warnings — including code ⇄ `.repospec/` drift —
as failures, so CI can gate on them. Also extend drift detection to testing tools
(declared `stack.testing` vs the dependencies), in both directions.

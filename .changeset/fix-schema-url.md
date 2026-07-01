---
'@repospec/protocol': patch
'@repospec/engine': patch
'@repospec/cli': patch
'@repospec/templates': patch
---

Point the generated `project.yaml` `$schema` at a hosted JSON Schema
(`raw.githubusercontent.com/npxchaos/repospec/main/schemas/0.1/project.schema.json`)
instead of the unhosted `repospec.dev` URL, fixing a dead link in every generated
repository.

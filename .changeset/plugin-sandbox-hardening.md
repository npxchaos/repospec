---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Harden the plugin sandbox (ADR-0010, supersedes ADR-0009's worker). Approved
plugins now run in a child `node` process under Node's Permission Model with
**no filesystem access** (no read or write), no child-process/worker/addon
permissions, and `env: {}`. The engine reads the (integrity-checked) plugin
source and the child imports it as a `data:` URL, so it needs zero fs grants —
an OS-enforced boundary, not cooperative isolation. Filesystem writes from a
plugin are now blocked by the runtime (verified by test). Constraint: a plugin
entry must be a single self-contained module (bundle any dependencies), since a
`data:` URL cannot resolve relative or `node_modules` imports.

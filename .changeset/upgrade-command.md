---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Implement `repospec upgrade` — the protocol-migration operation (`spec/versioning.md`
§4). It reads the repository's declared `repospecProtocol`, compares it to what the
tool targets, and: reports when already current; refuses a repo declaring a newer
protocol; and, for an older repo, applies the chain of migrations, bumping
`repospecProtocol` (edits to source artifacts require consent). The migration
registry is empty for now — `0.1` is the first protocol version — but the mechanism
is complete and tested. Adds `parseProtocolVersion` / `compareProtocolVersions` to
`@repospec/protocol`.

---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Ship the plugin runtime (ADR-0008 trust model, ADR-0009 sandbox, RFC-0001
manifest/lockfile). Plugins now execute — safely and opt-in:

- **protocol:** `PluginManifest` / `PluginLock` schemas + `parsePluginManifest`,
  `parsePluginLock`, `serializePluginLock`.
- **engine:** `runPlugins` / `resolvePlugins` / `buildApprovalLock` + `integrityOf`.
  A plugin runs only if `.repospec/plugins.lock` approves it with a matching
  integrity hash and the `generate-outputs` capability (declared + approved).
  Execution is a `worker_threads` worker with **no ambient environment**;
  integrity + consent are the load-bearing controls (the worker is
  defense-in-depth, not a hard boundary — see ADR-0009). Outputs flow through the
  same ownership/managed pipeline as adapters.
- **cli:** `repospec plugins list` / `repospec plugins approve`, and `--plugins`
  on `generate` / `sync` (off by default). Plugin execution is opt-in and skipped
  with a warning for anything unapproved or tampered.

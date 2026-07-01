---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Plugin hardening: capability-gated network + npm resolution.

- **Network capability enforced (partial):** a plugin not approved for the
  `network` capability runs with `fetch` and `WebSocket` replaced by throwing
  stubs. Low-level `node:net`/`node:http` can't be blocked in-process (Node has
  no network permission, and loader-hook gating needs `--allow-worker`, which the
  sandbox denies), so that residual remains — see ADR-0010; full isolation needs
  an OS sandbox.
- **npm resolution:** a declared plugin now resolves from a local
  `.repospec/plugins/<id>/` **or** an installed npm package `<id>` that ships a
  `repospec-plugin.yaml`. Resolution/reads happen engine-side; the sandboxed
  child still receives only the source (zero-fs). Plugin entries must remain
  single self-contained modules.

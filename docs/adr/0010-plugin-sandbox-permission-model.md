# ADR-0010: Harden the plugin sandbox with Node's Permission Model

- **Status:** Accepted
- **Date:** 2026-07-01
- **Deciders:** Founding engineer
- **Supersedes:** the execution *mechanism* of
  [ADR-0009](./0009-plugin-sandbox-mechanism.md) (the trust model in ADR-0008 and
  the integrity/consent gate are unchanged)

## Context

ADR-0009 shipped plugin execution in a `worker_threads` worker with no ambient
environment, and was explicit that a worker is **not** a hard boundary — a worker
can still `require('node:fs')` and write to disk. Integrity + consent carried the
real weight; the worker was defense-in-depth only.

Node's **Permission Model** (`--permission`, stable in Node 24) closes that gap
for the filesystem and process-spawning surface. Under `--permission`, `fs.read`,
`fs.write`, `child_process`, `worker`, native addons, and WASI are **deny-by-default**
and only granted by explicit `--allow-*` flags — enforced by the runtime, not by
plugin cooperation. Verified: a write under `--permission` without
`--allow-fs-write` throws `ERR_ACCESS_DENIED`.

## Decision

Run each approved plugin in a **child `node` process under the Permission Model**,
not a worker:

```
node --permission --input-type=module -e <runner>
```

- **No filesystem at all.** `--permission` with **no `--allow-*` grants**: no
  `fs.read`, no `fs.write`, no `child_process`, no `worker`, no addons, no WASI.
  The plugin cannot read *or* write the disk, spawn processes, start workers, or
  load native code — all enforced by the runtime.
- **The engine reads the source; the plugin imports a `data:` URL.** The engine
  (which is trusted and has already read the entry to compute its integrity
  hash) sends the plugin's **source** over stdin. The child imports it as a
  `data:text/javascript,…` URL, which needs no filesystem access. This is why the
  child can run with zero fs permissions.
- **No ambient environment.** The child is spawned with `env: {}`.
- **Data in/out over stdio.** stdin carries `{ source, repo, capabilities }` as
  JSON; the plugin returns `{ outputs: [{ path, body }] }` on stdout. Outputs
  still flow through the engine's ownership/managed pipeline (ADR-0004) — the
  plugin never writes files itself.
- **Bounded.** A timeout kills a plugin that hangs.

Because the plugin is imported as a `data:` URL, its entry must be a **single,
self-contained module** — relative imports of sibling files or `node_modules`
cannot resolve. External dependencies must be bundled into the entry.

Integrity + consent (ADR-0008) remain the primary gate: a plugin runs only if
`.repospec/plugins.lock` approves it at a matching integrity hash. The Permission
Model is now a genuine second layer, not just cooperative isolation.

## Consequences

### Positive
- OS-enforced: filesystem writes and process/worker spawning are blocked by the
  runtime, not by trusting the plugin. A materially stronger boundary than ADR-0009.
- Portable — no native deps, no per-OS sandbox config; works wherever Node 24 runs.
- The engine keeps sole authority over writes and the ownership model.

### Negative / trade-offs
- **Network is not gated.** The Permission Model has no network permission, so a
  plugin can still make outbound network calls. The `network` capability stays
  unenforced (and unsupported) until a network-gating mechanism exists; integrity
  + consent remain the control there.
- Plugins must be **self-contained in their directory** — imports outside
  `pluginDir` (e.g. `node_modules`) are denied by `--allow-fs-read`. External
  dependencies must be bundled. (npm-based resolution is a separate follow-up.)
- Subprocess startup is slightly heavier than a worker.

### Neutral / follow-ups
- Network gating (a proxy/broker, or an OS sandbox that covers sockets) to make
  the `network` capability real.
- npm-based plugin resolution with an `--allow-fs-read` grant scoped to the
  resolved package.

## Alternatives considered

- **Keep the worker (ADR-0009).** Rejected — no OS-enforced fs boundary.
- **WASM.** Rejected as the default — strongest isolation but forces authors to
  compile to WASM; kept as possible future hardening.
- **OS sandbox (seccomp / `sandbox-exec`).** Rejected as the default —
  non-portable and heavy; the Permission Model gives most of the fs/process
  benefit portably.

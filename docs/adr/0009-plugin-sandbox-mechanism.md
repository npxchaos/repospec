# ADR-0009: Plugin sandbox mechanism

- **Status:** Superseded by [ADR-0010](./0010-plugin-sandbox-permission-model.md)
- **Date:** 2026-07-01
- **Deciders:** Founding engineer
- **Implements:** [ADR-0008](./0008-plugin-runtime-security.md) (trust model),
  [RFC-0001](../../spec/rfcs/0001-plugin-manifest-and-consent.md) (manifest +
  lockfile)

## Context

ADR-0008 accepted the plugin *trust model* — per-repo consent, capability
declaration, sandboxed execution, determinism preserved — and deferred the
**sandbox mechanism** to an implementation ADR. This is that ADR.

The hard truth: **Node.js has no built-in hard sandbox for arbitrary
JavaScript.** `vm` is explicitly not a security boundary (documented as
escapable). `worker_threads` isolate the module graph and globals but a worker
can still `require('node:fs')` and touch disk unless the code cooperates. True
containment of untrusted JS needs OS-level isolation (subprocess + seccomp /
`sandbox-exec`, non-portable) or a different execution target (WASM, which forces
plugin authors to compile to WASM — a large adoption cost). None of these is a
clean, portable, low-friction default today.

So the sandbox cannot be the *primary* control. It is one layer.

## Decision

**Integrity + consent are the load-bearing controls; the worker is
defense-in-depth.** Concretely:

1. **A plugin runs only if approved.** Execution requires an `approved` entry in
   `.repospec/plugins.lock` (RFC-0001) whose `integrity` hash matches the
   resolved plugin artifact exactly. No approval, or any hash mismatch → the
   plugin is inert (never loaded). This means the operator has vetted *this exact
   code*. It is the same trust decision as adding a dependency, made explicit and
   pinned.

2. **Execution mechanism: `worker_threads`.** Approved plugins run in a Worker,
   not the main thread, with:
   - `env: {}` — **no environment variables** passed to the worker.
   - no `workerData` secrets; the worker receives only the plugin path and its
     approved capability list.
   - communication with the engine solely over the message port.
   - `resourceLimits` set to bound memory/time.

3. **Capability broker.** The worker is handed a scoped API over the message
   channel, not the host's `fs`/`process`/network. A plugin requests an action
   (e.g. "read `.repospec/rules/`"); the broker on the main side checks the
   plugin's *approved* capabilities before performing it. A capability not
   declared in the manifest **and** approved in the lockfile is never granted.

4. **Plugins are data-contributors, not writers.** A plugin returns
   *contributions* (adapter outputs, rule/agent data) as plain data. The engine
   still owns writing, the managed header, and the ownership check (ADR-0004), so
   a plugin cannot bypass the drift/overwrite guarantees or write outside the
   plan.

5. **Off by default.** Plugin execution is opt-in (`--plugins`) and off in
   non-interactive/CI contexts unless explicitly enabled.

**We do not overclaim.** The worker + capability broker constrain a *cooperating*
plugin and remove ambient authority (no env, no injected secrets). A determined
*malicious* plugin can still escape a Node worker; the defense against that is
integrity+consent (you approved the exact code) plus the small, auditable
capability surface — not the worker itself. A hard boundary (WASM or an
OS-sandboxed subprocess) is a future hardening, tracked as a follow-up.

## Consequences

### Positive
- A working, portable plugin runtime with no native dependencies.
- No ambient authority: plugins get no env and only brokered, capability-checked
  access.
- Determinism and the ownership model survive (plugins contribute to the plan).
- The trust decision is explicit, pinned, and tamper-evident (integrity hash).

### Negative / trade-offs
- Not a hard sandbox against hostile code — integrity+consent carry that weight.
- Worker + broker message-passing adds latency and implementation complexity.
- Contributions are limited to declarative data shapes the broker understands.

### Neutral / follow-ups
- **Hardening:** evaluate a WASM component model or an OS-sandboxed subprocess as
  a stricter execution target once demand justifies the author/runtime cost.
- Resolution from npm (vs. a local `.repospec/plugins/` path) is a separate
  concern; the first implementation may resolve from a local path only.

## Alternatives considered

- **`vm` module.** Rejected — not a security boundary; trivially escapable.
- **WASM now.** Rejected as the default — strongest isolation but forces plugin
  authors to compile to WASM, killing adoption. Kept as future hardening.
- **Subprocess + OS sandbox (seccomp/`sandbox-exec`).** Rejected as the default —
  strong but non-portable and heavy to configure per-OS. Possible future target.
- **Run in-process (no worker).** Rejected — full ambient authority on the main
  thread; contradicts ADR-0008.

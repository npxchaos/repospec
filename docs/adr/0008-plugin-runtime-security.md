# ADR-0008: Plugin runtime security (trust and sandbox model)

- **Status:** Accepted
- **Date:** 2026-07-01
- **Deciders:** Founding engineer

## Context

`project.yaml` can declare `plugins` (ADR-0007's "Repospec Plugins" layer;
`spec/configuration.md` §3.7). The intent is community extensions — extra
adapters, rule packs, generators. But a plugin is third-party code that would run
inside a developer's repository during `init`/`generate`/`sync`, with whatever
authority the host process has: filesystem, network, environment, credentials.
That is the same threat surface as a malicious `postinstall` script. (Weakness
W11 in `docs/analysis.md`.)

The protocol also promises **determinism** (`spec/lifecycle.md`: operations are
pure functions of the repository) and an **ownership model** (ADR-0004:
generated files carry a managed header and are never silently overwritten).
Arbitrary plugin code can violate both.

We need a decision that lets the plugin *model* exist now — so `project.yaml`
can declare plugins and tools can reason about them — without shipping an
arbitrary-code-execution vector before the trust model is built.

## Decision

1. **Plugins are declarative-only until the runtime defined here is
   implemented.** Today, and until every control below ships, an implementation
   **MUST NOT execute plugin code**. It may parse, validate, and surface declared
   plugins (discovery), and nothing more. `repospec doctor` validates plugin
   references; `sync` lists them in the generated guide. This is the current,
   shipped behavior (roadmap Milestone 6, Issue 6.3).

2. **When execution is added, it obeys this trust model:**
   - **Explicit, per-repository consent.** A plugin never runs on first
     encounter. The operator must approve each plugin (and each version) once,
     recorded in the repository (e.g. a lockfile with the plugin's integrity
     hash). An unapproved or hash-mismatched plugin is skipped with a warning,
     never run.
   - **Capability declaration, deny by default.** A plugin manifest declares the
     capabilities it needs (`generate-outputs`, `read-repo`, `network`, …).
     Nothing outside the declared, approved set is granted. No ambient authority.
   - **Sandboxed execution.** Plugin code runs in an isolated context (separate
     process/worker, no inherited environment or credentials), communicating
     with the engine only over the same typed ports the engine already uses
     (`RepospecFileSystem`, the adapter interface). It never gets the host `fs`,
     `process.env`, or network unless a capability grants it.
   - **Determinism preserved.** A plugin contributes to the *plan*, not to
     side-effecting writes. The engine still owns writing, the managed header,
     and the ownership check (ADR-0004), so plugin output cannot bypass the
     drift/overwrite guarantees.
   - **`--no-plugins` escape hatch and CI default-off.** Plugin execution is
     opt-in in non-interactive contexts.

3. **This ADR blocks execution until its controls exist.** Any PR that runs
   plugin code without consent + capabilities + sandbox contradicts an Accepted
   ADR and must be rejected or supersede this one.

## Consequences

### Positive
- The declarative plugin surface ships safely now; the ecosystem can start
  declaring plugins and building against the schema.
- The eventual runtime has a written trust model reviewers can hold PRs to.
- Determinism and the ownership model survive third-party extension.

### Negative / trade-offs
- Plugins do nothing executable yet — extension authors can declare but not run
  code until the runtime lands.
- A sandbox (subprocess/worker + capability broker) is real implementation cost.

### Neutral / follow-ups
- Define the plugin manifest schema and the approval lockfile format in a
  follow-up (protocol RFC, since it changes `.repospec/` shape).
- Choose the sandbox mechanism (Node `worker_threads` with no `require`,
  subprocess with seccomp-style limits, or WASM) in an implementation ADR.

## Alternatives considered

- **Run plugins directly in-process now.** Rejected — arbitrary code with the
  host's full authority, the exact `postinstall` threat, and it breaks
  determinism and the ownership guarantees.
- **Never support executable plugins (declarative forever).** Rejected — too
  limiting for a standard that wants a tool ecosystem; the model above makes
  execution safe rather than forbidden.
- **Trust npm/registry provenance instead of per-repo consent.** Rejected as
  insufficient on its own — provenance doesn't constrain runtime authority;
  capabilities + sandbox are still required.

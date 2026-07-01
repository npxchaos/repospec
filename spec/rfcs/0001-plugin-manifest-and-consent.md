# RFC-0001: Plugin manifest and approval lockfile

- **Status:** Draft
- **Author(s):** Founding engineer
- **Created:** 2026-07-01
- **Targets protocol version:** 0.2

> Use this template for any change to the Repospec Specification. This RFC defines
> the **declarative** shape that a future plugin runtime will build on. It adds no
> code execution — that remains gated by
> [ADR-0008](../../docs/adr/0008-plugin-runtime-security.md) until its controls
> ship (sandbox mechanism to be chosen in a separate implementation ADR).

## Summary

Define two declarative artifacts so plugins can be described, approved, and
integrity-checked before any runtime exists: a **plugin manifest** (what a plugin
declares about itself) and a repository-local **approval lockfile** (which
plugins, at which versions and hashes, an operator has approved). Today's
`plugins` array in `project.yaml` (RFC precursor, already shipped) references
plugins; this RFC gives those references a validated contract and a consent
record.

## Motivation

`project.yaml` can already declare `plugins: [{ id, version?, options? }]`, and
`doctor` validates/surfaces them (declarative-only, ADR-0008). But there is no
way to describe *what a plugin is or needs*, and no record of *what the operator
approved*. Both are prerequisites for ADR-0008's trust model — capability-scoped,
consent-gated execution — and both are useful on their own: a manifest lets
tooling show a plugin's declared capabilities before anything runs, and a
lockfile makes plugin sets reproducible and tamper-evident. Defining them now,
without execution, lets the ecosystem form around a stable contract while the
runtime is designed.

## Proposal

Add to the specification (`configuration.md`, `repository.md`), all
backward-compatible:

### 1. Plugin manifest

A plugin package ships a `repospec-plugin.yaml` manifest:

```yaml
id: acme-compliance-pack        # matches the id used in project.yaml plugins[]
version: "1.2.0"
description: Compliance rules and a SOC2 reviewer role for Acme services.
capabilities:                   # deny-by-default; only these may ever be granted
  - contribute-rules            # add rules/ entries
  - contribute-agents           # add agents/ entries
  - generate-outputs            # register an adapter
provides:                       # declarative contributions (data, not code)
  rules: [soc2-audit-log, pci-scope]
  agents: [compliance-reviewer]
  adapters: []
```

`capabilities` is a closed enum (`contribute-rules`, `contribute-agents`,
`generate-outputs`, `read-repo`, `network`). Anything a plugin does at runtime
(once runtimes exist) must be covered by a declared, approved capability.

### 2. Approval lockfile

A repository records operator approval in `.repospec/plugins.lock`:

```yaml
repospecProtocol: "0.2"
approved:
  - id: acme-compliance-pack
    version: "1.2.0"
    integrity: "sha256-…"       # hash of the resolved plugin artifact
    capabilities: [contribute-rules, contribute-agents]
    approvedAt: "2026-07-01"
```

An implementation MUST treat a declared plugin as **unapproved** (and therefore
inert — never executed, even once runtimes exist) unless a matching `approved`
entry exists whose `integrity` matches the resolved artifact. A version or hash
mismatch is a hard stop, not a prompt-and-run.

### 3. `doctor` and validation (no execution)

`doctor` gains checks, all static:

- Each `plugins[]` entry in `project.yaml` resolves to a manifest whose `id`
  matches (warning if not resolvable).
- Each approved plugin's `capabilities` are a subset of its manifest's declared
  capabilities (error on escalation).
- `plugins.lock` entries with no corresponding `project.yaml` reference are
  reported as stale (warning).

None of this runs plugin code.

## Compatibility & migration

- **MINOR** ([`../versioning.md`](../versioning.md)): the manifest and lockfile
  are new and optional; the existing `plugins` array is unchanged. A repository
  with no plugins is unaffected.
- No migration required. Repositories opt in by adding a `plugins.lock`.
- Introducing `plugins.lock` touches human-owned source, so writing/updating it
  requires operator consent (it *is* the consent record).

## Alternatives considered

- **Manifest inside `project.yaml`.** Rejected — a plugin's self-description
  belongs with the plugin, not the consuming repo; the repo only references and
  approves.
- **Trust registry provenance instead of a lockfile.** Rejected — provenance
  doesn't constrain runtime capabilities and isn't tamper-evident per-repo
  (ADR-0008).
- **Wait and define this together with the runtime.** Rejected — the declarative
  contract is useful now and lets the ecosystem stabilize before execution lands.

## Open questions

- Exact `integrity` scheme (SRI-style hash of the packed artifact vs. the
  registry's own integrity value).
- Whether `options` (per-plugin config in `project.yaml`) should be schema-checked
  against a manifest-declared options schema.
- The sandbox mechanism and the consent UX are **out of scope here** — they
  belong to the implementation ADR that ADR-0008 calls for.

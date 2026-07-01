# Repospec Specification — Lifecycle

- **Specification version:** 0.1 (draft)
- **Status:** Normative
- **Depends on:** [`protocol.md`](./protocol.md), [`repository.md`](./repository.md), [`versioning.md`](./versioning.md)

> Defines the lifecycle of a Repospec-enabled repository as a set of **states** and
> the **operations** that move between them. Operations are described by their
> contract (inputs, effects, postconditions), independent of any CLI surface —
> so the same operations can be invoked by a CLI, an editor, a CI job, or
> another tool. The reference operations map to `repospec` subcommands, noted in
> parentheses.

## 1. States

A repository is in exactly one of these states with respect to the protocol:

| State | Meaning |
| ----- | ------- |
| **Uninitialized** | No `.repospec/` directory exists. |
| **Initialized** | A valid `.repospec/` exists, conforming to a supported protocol version. |
| **Drifted** | `.repospec/` is valid, but one or more generated outputs are missing or out of sync with the source artifacts. |
| **Invalid** | `.repospec/` exists but does not conform (schema or reference errors). |
| **Outdated** | `.repospec/` conforms to a protocol version older than the one the implementation prefers; migration is available. |

## 2. Operations

Each operation is defined by its **contract**, not its UI. An operation MUST be
deterministic given the same inputs and repository state (except the explicitly
network-bound `bootstrap`).

### 2.1 Initialize (`repospec init`)

- **Precondition:** Uninitialized (or operator consents to update an existing
  `.repospec/`).
- **Input:** project answers (identity, stack, conventions, adapters). MAY be
  gathered interactively or supplied non-interactively.
- **Effect:** writes a valid `.repospec/` seeded from templates; renders enabled
  adapter outputs.
- **Postcondition:** Initialized.
- **Safety:** MUST detect an existing `.repospec/` and MUST NOT overwrite source
  artifacts without explicit consent.

### 2.2 Generate (`repospec generate`)

- **Precondition:** Initialized.
- **Input:** optionally, a subset of adapters/artifacts to render.
- **Effect:** renders generated outputs from current source artifacts.
- **Postcondition:** Initialized, generated outputs present.

### 2.3 Synchronize (`repospec sync`)

- **Precondition:** Initialized or Drifted.
- **Effect:** brings generated outputs into agreement with source artifacts,
  honoring ownership (ADR-0004): human-modified outputs are not overwritten
  without consent. MUST be **idempotent** — a second run with no source change
  performs no writes. A `--check` mode reports drift without writing and exits
  non-zero if drift exists.
- **Postcondition:** Initialized (no drift).

### 2.4 Diagnose (`repospec doctor`)

- **Precondition:** any state.
- **Effect:** validates `.repospec/` and reports problems with actionable,
  path-first messages; detects drift and version mismatch. Does not modify
  files.
- **Postcondition:** unchanged; exit code reflects whether errors were found.

### 2.5 Upgrade (`repospec upgrade`)

- **Precondition:** Outdated.
- **Effect:** migrates `.repospec/` from its current protocol version to a newer
  supported version using a defined migration ([`versioning.md`](./versioning.md)).
  Migration of source artifacts requires operator consent.
- **Postcondition:** Initialized at the target version.

### 2.6 Bootstrap (`repospec bootstrap` / `repospec architect`) — network, opt-in

- **Precondition:** Uninitialized or Initialized.
- **Effect:** infers a *draft* `.repospec/` from an existing codebase. Offline
  heuristics run first — this includes reading the repository's existing
  documentation (e.g. `ARCHITECTURE.md`, `CONTRIBUTING.md`) to seed the prose
  documents from real content rather than a blank template. An AI provider MAY
  be used only with explicit operator opt-in and consent about what is sent;
  the offline doc import never leaves the machine. The draft is presented for
  human review and MUST NOT be written without approval (human decisions win).
- **Postcondition:** Initialized (after human approval) or unchanged.

## 3. State transition map

```
                 init / bootstrap(+approval)
   Uninitialized ───────────────────────────────▶ Initialized
      ▲                                         │  ▲
      │                                   sync  │  │ generate
      │                                (no-op if │  │
      │                                  in sync)│  │
      │                                         ▼  │
   (remove .repospec/)                          Drifted
                                                │
                                          sync  │
                                                ▼
                                             Initialized

   Initialized/Drifted ──fails validation──▶ Invalid ──(fix)──▶ Initialized
   Initialized (old version) = Outdated ──upgrade──▶ Initialized (new version)
```

## 4. Implementation notes

- Operations SHOULD support a **dry-run** that reports the planned writes
  without performing them.
- Operations that write MUST report a clear summary of what changed.
- Because operations are defined by contract, a non-CLI implementation (editor
  extension, CI action) is conformant as long as it preserves these
  preconditions, effects, and safety rules.

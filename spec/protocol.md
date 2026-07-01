# Repospec Specification — Protocol

- **Specification version:** 0.1 (draft)
- **Status:** Normative
- **Audience:** anyone implementing or consuming the Repospec Protocol

> This is the root of the Repospec Specification. It defines what the protocol
> *is*, the terminology used across all spec documents, and what it means for a
> tool or a repository to *conform*. The TypeScript packages under `packages/`
> are one implementation of this specification — not the specification itself.

## 1. Purpose

The Repospec Protocol defines a **standard, versioned, tool-agnostic format** by
which a software repository describes how it should be built, maintained, and
evolved. The description is stored in the repository, under a directory named
`.repospec/`. Any tool — AI assistant, CLI, editor, CI job — MAY read this
directory to understand the project. No tool is REQUIRED to produce it.

The protocol's central claim: **the repository is the source of truth.** Human
decisions are committed to `.repospec/`; automated agents follow what is committed.

## 2. Terminology

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**,
**MAY**, and **OPTIONAL** are to be interpreted as described in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

- **Protocol** — this specification.
- **Repository artifacts** — the files under `.repospec/` (see
  [`repository.md`](./repository.md)).
- **Implementation** — any tool that reads and/or writes the artifacts.
- **Engine** — an implementation of the protocol's operations (the reference
  engine is `@repospec/engine`).
- **Adapter** — a component that renders the artifacts into a tool-specific
  entrypoint (e.g. `CLAUDE.md`). See [`repository.md`](./repository.md) §
  Generated outputs.
- **Source artifact** — a `.repospec/` file authored by humans; the source of
  truth.
- **Generated output** — a file produced from source artifacts (e.g. an adapter
  output); owned by the implementation, not the human.
- **Protocol version** — the version of *this specification* a repository
  targets, declared as `repospecProtocol`. Distinct from any package version.

## 3. Design principles (normative intent)

These principles constrain every other document in the specification. Where a
later rule and a principle conflict, the conflict is a defect in the rule.

1. **Repository over prompts.** Context lives in version control, not in chat.
2. **Protocol over conversations.** The contract is a format, not a dialogue.
3. **Human decisions always win.** An implementation MUST NOT silently override
   human-authored source artifacts.
4. **Single owner per file.** Every file is either a source artifact (human) or
   a generated output (implementation) — never both.
5. **Explicit over hidden.** Behavior is declared in `project.yaml`, not
   inferred by surprise.
6. **Tool-agnostic.** The protocol MUST NOT require any specific assistant,
   editor, or vendor.
7. **Stable and versioned.** Breaking changes to the format require a protocol
   version change ([`versioning.md`](./versioning.md)).

## 4. Conformance

Conformance is defined for two kinds of subject.

### 4.1 A conforming repository

A repository conforms to protocol version *X* if:

- it contains a `.repospec/` directory at its root;
- `.repospec/project.yaml` exists, is valid YAML, and declares
  `repospecProtocol: "X"`;
- `project.yaml` validates against the configuration schema for version *X*
  ([`configuration.md`](./configuration.md));
- every artifact referenced by `project.yaml` (documents, agents, rules)
  exists and is valid per its artifact specification.

### 4.2 A conforming implementation

An implementation conforms to protocol version *X* if:

- it can **read** a conforming repository at version *X* without loss of
  declared information;
- it rejects, with a clear error, a repository whose `repospecProtocol` it does not
  support (it MUST NOT silently misinterpret an unsupported version);
- if it **writes** artifacts, the output is itself a conforming repository at a
  version the implementation declares it supports;
- it honors the **ownership model** (§3.3–3.4): it MUST NOT overwrite a modified
  human-authored source artifact or a human-modified generated output without
  explicit operator consent.

### 4.3 Conformance levels for implementations

An implementation MAY conform at one of three levels. Levels are additive.

| Level | Name      | Capability |
| ----- | --------- | ---------- |
| L1    | Reader    | Reads and validates a conforming repository. |
| L2    | Generator | L1 + produces conforming artifacts and generated outputs. |
| L3    | Maintainer| L2 + idempotent sync, drift detection, and version migration. |

The reference toolchain targets **L3**. An AI assistant that merely reads
`.repospec/` to inform its behavior is a valid **L1** implementation.

## 5. Relationship between specification and implementation

- The specification is **primary**. Implementations are interchangeable.
- The specification is **language-neutral**. The normative configuration
  contract is mirrored by a published **JSON Schema**
  (see [`configuration.md`](./configuration.md) and ADR-0005); the JSON Schema
  is generated *from* the reference implementation but the prose here is
  authoritative where they disagree.
- Changes to the specification follow the **RFC process** in
  [`../docs/governance.md`](../docs/governance.md), not ordinary code review.

## 6. Document map

The specification is split into focused documents:

| Document | Defines |
| -------- | ------- |
| [`protocol.md`](./protocol.md) | This document: terminology & conformance. |
| [`repository.md`](./repository.md) | The `.repospec/` directory and ownership. |
| [`configuration.md`](./configuration.md) | `project.yaml` and its schema. |
| [`agent.md`](./agent.md) | Agent and rule artifacts (frontmatter + body). |
| [`workflow.md`](./workflow.md) | The engineering-workflow artifact. |
| [`lifecycle.md`](./lifecycle.md) | Repository states and protocol operations. |
| [`versioning.md`](./versioning.md) | Protocol semver, compatibility, migration. |

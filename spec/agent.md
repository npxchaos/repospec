# Repospec Specification — Agents & Rules

- **Specification version:** 0.1 (draft)
- **Status:** Normative
- **Depends on:** [`protocol.md`](./protocol.md), [`repository.md`](./repository.md)

> Defines the two semi-structured artifact kinds: **agents** (`.repospec/agents/`)
> and **rules** (`.repospec/rules/`). Both are Markdown files with a validated YAML
> frontmatter block followed by a free-form Markdown body. The frontmatter is
> machine-readable identity and metadata; the body is human/AI-readable
> instruction.

## 1. Common file shape

Both kinds use the same physical shape:

```markdown
---
# YAML frontmatter — validated
id: ...
---

Markdown body — free-form instructions, read by humans and assistants.
```

Rules:

- The frontmatter block MUST be the first thing in the file, delimited by `---`
  lines.
- The frontmatter MUST be valid YAML and conform to the schema for its kind.
- The body MAY be empty but SHOULD describe the artifact in prose.
- The file's `id` MUST be unique within its kind. The filename SHOULD equal
  `<id>.md`.

## 2. Agents

An **agent** is a reusable role an assistant can adopt when working in the
repository (e.g. *Reviewer*, *Implementer*, *Architect*). Agents are advisory:
they describe intent and boundaries, not executable behavior.

### 2.1 Agent frontmatter

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `id` | string | yes | Unique slug, e.g. `reviewer`. |
| `name` | string | yes | Human-facing name. |
| `description` | string | yes | One sentence: what this role is for. |
| `responsibilities` | string[] | no | What the role owns (single-owner principle). |
| `boundaries` | string[] | no | What the role MUST NOT do. |
| `capabilities` | string[] | no | Tools/skills the role expects. |
| `model` | string | no | A preferred model hint; advisory only. |

### 2.2 Example

```markdown
---
id: reviewer
name: Code Reviewer
description: Reviews diffs for correctness, tests, and adherence to the constitution.
responsibilities:
  - Flag missing tests or docs.
  - Verify changes respect architecture.md boundaries.
boundaries:
  - Does not merge.
  - Does not change product scope.
---

When reviewing, start from the constitution and architecture documents. Prefer
small, specific suggestions. Block only on correctness, missing tests, or
violated rules.
```

## 3. Rules

A **rule** is a single, focused, enforceable expectation (e.g. *"no `any` in
TypeScript"*). Rules are intentionally small — one rule per file — so they can
be added, removed, and reasoned about independently.

### 3.1 Rule frontmatter

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `id` | string | yes | Unique slug, e.g. `no-any`. |
| `title` | string | yes | Short human-facing title. |
| `severity` | enum | yes | `error` \| `warning` \| `info`. |
| `appliesTo` | string[] | no | Glob(s) the rule applies to; default all. |
| `rationale` | string | no | Why the rule exists. |

### 3.2 Example

```markdown
---
id: no-any
title: No `any` in TypeScript
severity: error
appliesTo: ["**/*.ts", "**/*.tsx"]
rationale: `any` disables type safety and hides real bugs.
---

Use precise types or `unknown` with narrowing. If a type is genuinely dynamic,
document why at the use site.
```

## 4. Semantics for implementations

- Frontmatter validation is REQUIRED for conformance; a malformed agent/rule is
  a validation error reported by `doctor`.
- The body is **not** parsed for structure by the protocol; it is passed through
  to adapters and assistants verbatim.
- `severity` is advisory metadata; the protocol does not mandate enforcement
  mechanics. An implementation MAY surface `error`-severity rules more
  prominently in generated outputs.
- Adapters ([`repository.md`](./repository.md)) decide how agents and rules are
  rendered into each tool's entrypoint; the protocol only guarantees the
  artifacts are available and valid.

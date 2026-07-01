# Repospec Specification — Repository

- **Specification version:** 0.1 (draft)
- **Status:** Normative
- **Depends on:** [`protocol.md`](./protocol.md)

> Defines the `.repospec/` directory: its layout, the meaning of each artifact, and
> the ownership rules that protect human-authored content. Terminology and
> conformance are inherited from [`protocol.md`](./protocol.md).

## 1. Location

A conforming repository MUST contain a directory named `.repospec/` at the
repository root (the directory containing the version-control root, e.g. `.git`).
Implementations MUST locate `.repospec/` by walking upward from the working
directory, stopping at the first `.repospec/` found.

## 2. Layout

```
.repospec/
  project.yaml          REQUIRED   structured root; see configuration.md
  constitution.md       REQUIRED   non-negotiable engineering principles
  architecture.md       REQUIRED   how THIS project is structured
  workflow.md           REQUIRED   how work flows; see workflow.md
  agents/               OPTIONAL   role definitions; see agent.md
    <id>.md
  rules/                OPTIONAL   focused, enforceable rules; see agent.md
    <id>.md
  templates/            OPTIONAL   project-local scaffolding templates
  plugins/              OPTIONAL   declarative plugin references (see versioning)
```

- `project.yaml` is the **root artifact**. Every other artifact is discovered
  through it (directly, or via the conventional directory names above).
- The three prose documents (`constitution.md`, `architecture.md`,
  `workflow.md`) are REQUIRED and free-form Markdown. Their *paths* MAY be
  overridden in `project.yaml`; their default paths are as shown.
- `agents/` and `rules/` contain Markdown-with-frontmatter artifacts
  ([`agent.md`](./agent.md)). An implementation MUST treat every `*.md` file
  directly inside these directories as an artifact of that kind.

Implementations MUST ignore unknown files and directories under `.repospec/`
(forward compatibility), but MAY warn about them.

## 3. Artifact summary

| Artifact | Kind | Required | Purpose |
| -------- | ---- | -------- | ------- |
| `project.yaml` | structured (YAML) | yes | identity, stack, conventions, references, enabled adapters |
| `constitution.md` | prose | yes | principles that MUST hold regardless of task |
| `architecture.md` | prose | yes | the project's own structure and boundaries |
| `workflow.md` | prose + model | yes | branching, review, release, definition of done |
| `agents/<id>.md` | frontmatter + prose | no | a role an assistant can adopt |
| `rules/<id>.md` | frontmatter + prose | no | a single enforceable rule |
| `templates/**` | files | no | project-local scaffolding |
| `plugins/**` | declarative | no | extensions; declarative-only until the plugin security ADR |

## 4. Ownership (normative)

Every file Repospec interacts with has exactly **one** owner. This is the rule that
makes the protocol safe to automate.

### 4.1 Source artifacts — owned by humans

Everything under `.repospec/` is a **source artifact**. An implementation:

- MAY create source artifacts during initialization (seeding from templates);
- MUST NOT modify an existing source artifact without explicit operator consent
  (e.g. an interactive confirmation or an explicit `--force` flag);
- MUST treat source artifacts as the source of truth when generating outputs.

### 4.2 Generated outputs — owned by the implementation

Files rendered *from* source artifacts (adapter outputs, derived schemas) are
**generated outputs**. They live in their tool-native locations, outside or
inside the repo as the adapter dictates. A generated output:

- MUST carry a **managed header** identifying it as generated, naming the source
  protocol version, and pointing the reader to edit `.repospec/` instead;
- SHOULD carry a **content checksum** of its generated body so drift is
  detectable;
- MUST NOT be overwritten by sync if it was modified out-of-band (checksum
  mismatch) without explicit operator consent.

### 4.3 Conventional generated outputs

Adapter outputs are not part of the protocol's required layout (they are
tool-specific), but the protocol reserves their *semantics*. Examples an adapter
MAY own:

```
AGENTS.md
CLAUDE.md
.cursor/rules/repospec.mdc
.github/copilot-instructions.md
```

The set of generated outputs in a repository is determined by the `adapters`
section of `project.yaml` ([`configuration.md`](./configuration.md)).

## 5. Validity

A `.repospec/` directory is valid at protocol version *X* when:

1. `project.yaml` is present and valid per [`configuration.md`](./configuration.md);
2. all REQUIRED prose documents referenced by `project.yaml` exist;
3. every `agents/*.md` and `rules/*.md` is valid per [`agent.md`](./agent.md);
4. no two artifacts declare the same `id` within the same kind.

`repospec doctor` (or any L1 implementation) reports violations of these rules.

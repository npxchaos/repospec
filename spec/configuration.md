# Repospec Specification — Configuration

- **Specification version:** 0.1 (draft)
- **Status:** Normative
- **Depends on:** [`protocol.md`](./protocol.md), [`repository.md`](./repository.md)

> Defines `.repospec/project.yaml`: the structured root artifact. This prose is
> authoritative; a machine-readable **JSON Schema** is generated from the
> reference implementation and published to `spec/schema/<version>/` (ADR-0005).

## 1. Format

`project.yaml` MUST be a valid YAML 1.2 document containing a single mapping at
the top level. Implementations SHOULD support an editor `$schema` association so
authors get inline validation:

```yaml
# yaml-language-server: $schema=https://repospec.dev/schema/0.1/project.schema.json
```

## 2. Top-level fields

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `repospecProtocol` | string | yes | Protocol version targeted, e.g. `"0.1"`. See [`versioning.md`](./versioning.md). |
| `project` | object | yes | Project identity. |
| `stack` | object | yes | Languages, runtimes, tooling. |
| `conventions` | object | no | Formatter, linter, commit/branch style. |
| `documents` | object | no | Overrides for prose-document paths. |
| `agents` | object | no | Where agent artifacts live. |
| `rules` | object | no | Where rule artifacts live. |
| `adapters` | array | no | Tool entrypoints to generate. |
| `plugins` | array | no | Declarative plugin references. |

Unknown top-level fields MUST be ignored by implementations (forward
compatibility) and MAY be warned about.

## 3. Field definitions

### 3.1 `project`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | yes | Human-facing project name. |
| `description` | string | yes | One-sentence summary. |
| `type` | enum | yes | `application` \| `library` \| `service` \| `cli` \| `monorepo`. |
| `repository` | string (URL) | no | Canonical repository URL. |

### 3.2 `stack`

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `languages` | string[] | yes | e.g. `[typescript]`. |
| `runtimes` | string[] | no | e.g. `[node]`. |
| `packageManager` | string | no | e.g. `pnpm`. |
| `frameworks` | string[] | no | e.g. `[react]`. |
| `testing` | string[] | no | e.g. `[vitest]`. |

### 3.3 `conventions`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `formatter` | string | e.g. `prettier`. |
| `linter` | string | e.g. `eslint`. |
| `commitStyle` | enum | `conventional` \| `freeform`. |
| `branching` | enum | `trunk` \| `github-flow` \| `gitflow`. |

### 3.4 `documents`

Overrides default prose-document paths from [`repository.md`](./repository.md).

| Field | Type | Default |
| ----- | ---- | ------- |
| `constitution` | string | `constitution.md` |
| `architecture` | string | `architecture.md` |
| `workflow` | string | `workflow.md` |

### 3.5 `agents` / `rules`

| Field | Type | Default |
| ----- | ---- | ------- |
| `dir` | string | `agents` / `rules` respectively |

### 3.6 `adapters`

An array of adapter selections. Each entry is either a string `id` or an object:

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `id` | string | yes | Adapter identifier, e.g. `claude`, `cursor`, `copilot`. |
| `options` | object | no | Adapter-specific options. |

The set of enabled adapters determines which **generated outputs** exist
([`repository.md`](./repository.md) §4).

### 3.7 `plugins`

An array of declarative plugin references. Until the plugin security ADR
(roadmap Milestone 6), plugins are **declarative only**: an implementation MUST
NOT execute plugin code. Each entry:

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `id` | string | yes | Plugin identifier. |
| `version` | string | no | Version constraint. |
| `options` | object | no | Plugin-specific options. |

## 4. Example

```yaml
# yaml-language-server: $schema=https://repospec.dev/schema/0.1/project.schema.json
repospecProtocol: "0.1"

project:
  name: acme-web
  description: Customer-facing storefront.
  type: application
  repository: https://github.com/acme/web

stack:
  languages: [typescript]
  runtimes: [node]
  packageManager: pnpm
  frameworks: [react]
  testing: [vitest]

conventions:
  formatter: prettier
  linter: eslint
  commitStyle: conventional
  branching: github-flow

adapters:
  - id: claude
  - id: cursor
  - id: copilot
```

## 5. Validation rules

- `repospecProtocol` MUST be a version the implementation supports, else a clear
  error ([`versioning.md`](./versioning.md)).
- `project.name`, `project.description`, `project.type`, and
  `stack.languages` are REQUIRED and MUST be non-empty.
- `adapters[].id` MUST reference an adapter the implementation knows; an unknown
  adapter is a warning (the repository is still valid; that output is skipped).
- Validation errors MUST be reported **path-first** and human-readable (e.g.
  `project.type: expected one of application|library|service|cli|monorepo`),
  not as raw schema dumps.

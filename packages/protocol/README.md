# @repospec/protocol

The **executable form of the Repospec Specification**. This package translates the
normative spec in [`spec/`](../../spec/) into TypeScript: artifact types, zod
schemas, and protocol-version helpers. It is pure — no filesystem or network
side effects.

> The specification is authoritative. Where this package and the prose spec
> disagree, [`spec/`](../../spec/) wins (see ADR-0005).

## Status

Implemented (Milestone 1):

- `PROTOCOL_VERSION`, `supports(version)` — version helpers.
- zod schemas for `project.yaml`, agents, and rules + inferred types.
- `parseProject` / `serializeProject`, `parseAgent`, `parseRule`,
  `parseFrontmatter`.
- `readRepospec(fs, dir)` — read and validate a whole `.repospec/` tree through the
  injectable `RepospecFileSystem` port.
- `RepospecValidationError` with human-first, path-prefixed messages.

The generated JSON Schema (from these zod schemas) lands in Milestone 5.

## Usage

```ts
import { parseProject, readRepospec, supports } from '@repospec/protocol';

const project = parseProject(yamlText); // validated, with defaults applied
supports(project.repospecProtocol); // → true
```

## Dependencies

- `zod` — schema definitions (source of truth for the generated JSON Schema).
- `yaml` — YAML parsing/serialization for `project.yaml` and frontmatter.

Depends on nothing else in the monorepo (ADR-0001).

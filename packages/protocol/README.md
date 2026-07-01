# @repospec/protocol

The **executable form of the Repospec Specification**. This package translates the
normative spec in [`spec/`](../../spec/) into TypeScript: artifact types, zod
schemas, and protocol-version helpers. It is pure — no filesystem or network
side effects.

> The specification is authoritative. Where this package and the prose spec
> disagree, [`spec/`](../../spec/) wins (see ADR-0005).

## What it provides

- `PROTOCOL_VERSION`, `supports(version)`, `parseProtocolVersion`,
  `compareProtocolVersions` — version helpers.
- zod schemas for `project.yaml`, agents, rules, and plugins (manifest +
  approval lockfile) + inferred types.
- `parseProject` / `serializeProject`, `parseAgent`, `parseRule`,
  `parsePluginManifest`, `parsePluginLock`, `serializePluginLock`,
  `parseFrontmatter`.
- `readRepospec(fs, dir)` — read and validate a whole `.repospec/` tree through the
  injectable `RepospecFileSystem` port.
- `RepospecValidationError` with human-first, path-prefixed messages.

A JSON Schema is generated from these zod schemas to `schemas/0.1/` (hosted on
GitHub raw); see [ADR-0005](../../docs/adr/0005-validation-zod-and-json-schema.md).

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

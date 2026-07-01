# Repospec Specification

This directory is the **heart of the project**: the normative, language-neutral
definition of the Repospec Protocol. Any tool, in any language, can implement it.
The TypeScript packages under `packages/` are *one* implementation of what is
defined here — the specification is primary, the implementation is replaceable.

> The test of this design: *if the CLI disappeared tomorrow, the specification
> and any other tool built against it would still stand.* The architecture is
> organized around that property — see
> [`../docs/adr/0007-specification-first-architecture.md`](../docs/adr/0007-specification-first-architecture.md).

## Documents

| Document | Defines | Status |
| -------- | ------- | ------ |
| [`protocol.md`](./protocol.md) | Terminology, principles, conformance, conformance levels | Normative |
| [`repository.md`](./repository.md) | The `.repospec/` directory layout and ownership model | Normative |
| [`configuration.md`](./configuration.md) | `project.yaml` fields and validation | Normative |
| [`agent.md`](./agent.md) | Agent and rule artifacts (frontmatter + body) | Normative |
| [`workflow.md`](./workflow.md) | The engineering-workflow artifact | Normative + Informative |
| [`lifecycle.md`](./lifecycle.md) | Repository states and protocol operations | Normative |
| [`versioning.md`](./versioning.md) | Protocol semver, compatibility, migration | Normative |

## Generated & future contents

```
spec/
  *.md                            the documents above (authored first)
  schema/
    0.1/
      project.schema.json         JSON Schema generated from the engine (ADR-0005)
  rfcs/
    0000-template.md              RFC template (protocol change proposals)
    NNNN-title.md                 individual proposals (see governance)
```

The JSON Schema is produced during implementation (roadmap Milestone 5) from the
zod schemas in `@repospec/protocol`; this prose remains authoritative.

## Protocol version

Current target: **0.1** (pre-stability). A repository declares the version it
targets via `repospecProtocol` in `.repospec/project.yaml`. Changes to this
specification follow the RFC process in
[`../docs/governance.md`](../docs/governance.md).

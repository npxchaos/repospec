# Repospec

> An open, repository-first **specification** that standardizes how AI coding
> assistants understand, build, and evolve a software project — without prompts.

**The repository is the source of truth, not the AI.** Repospec defines a versioned
`.repospec/` specification that any AI coding assistant — Claude, Cursor, Copilot,
and others — can read to understand how a project should be built and maintained.
The reference `repospec` CLI generates and keeps that specification in sync.

This is not an agent framework, not a prompt collection, and not specific to any
one editor. The **specification is the product**; the CLI is one implementation
of it.

```bash
repospec init      # interview → generate a complete .repospec/ + tool entrypoints
```

## Project status

🛠️ **Working alpha.** The specification is authored and the reference toolchain
runs end-to-end: `repospec init` generates a complete `.repospec/` plus assistant
entrypoints, and `repospec doctor` / `repospec sync` / `repospec generate` maintain them.
Milestones S, 0, 1, 2, and 3 are complete (see [`TODO.md`](./TODO.md)).

## Quickstart

```bash
# from the repo root
pnpm install && pnpm build

# in any project directory
node /path/to/repospec/packages/cli/dist/bin.js init

# or non-interactively
repospec init --yes --name my-app --type application --languages typescript --adapters claude,cursor
repospec doctor          # validate .repospec/
repospec sync            # regenerate CLAUDE.md, .cursor/rules, … from .repospec/
repospec sync --check    # CI: fail if entrypoints drift from .repospec/
```

`repospec init` writes the human-owned `.repospec/` source of truth and the
Repospec-owned tool entrypoints. Edit `.repospec/`, then `repospec sync` to update every
assistant's file at once. Generated files carry a managed header and are never
clobbered if you hand-edit them (without `--force`). See a real result in
[`examples/demo-service`](./examples/demo-service).

Start here:

- [`docs/vision.md`](./docs/vision.md) — **why Repospec exists** (read this first).
- [`spec/`](./spec/) — the **Repospec Specification**, the heart of the project.
- [`docs/analysis.md`](./docs/analysis.md) — weaknesses in the brief and fixes.
- [`docs/architecture/overview.md`](./docs/architecture/overview.md) — the
  complete target architecture.
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records.
- [`docs/roadmap.md`](./docs/roadmap.md) — milestones → issues → tasks.
- [`TODO.md`](./TODO.md) — high-level milestone tracker.
- [`docs/governance.md`](./docs/governance.md) — how decisions are made.

## What Repospec is

Repospec is an umbrella; the **Specification** is its center:

```
Repospec
├── Repospec Specification   the standard — language-neutral, versioned   ◀ primary
├── Repospec Engine          reference implementation of the spec
├── Repospec CLI             one human entrypoint to the engine
├── Repospec Templates       default content the spec is seeded from
├── Repospec Adapters        project the spec into each assistant's format
└── Repospec Plugins         community extensions (declarative-first)
```

The organizing layering is **Specification → Engine → CLI → Repository**: the
CLI calls the Engine, the Engine implements the Specification, the Specification
describes the `.repospec/` repository. If the CLI disappeared tomorrow, the
specification — and any other tool built against it — would still stand. That is
the test of a standard.

A single authored `.repospec/` is projected into each assistant's native entrypoint
(`CLAUDE.md`, `.cursor/rules/*`, Copilot instructions) by **adapters**, and kept
current by `repospec sync`.

## Reference implementation (TypeScript)

| Package | Role |
| ------- | ---- |
| `@repospec/protocol` | the executable specification (types + zod) |
| `@repospec/engine` | the operations: init / generate / sync / doctor / upgrade |
| `@repospec/templates` | default content + adapter content |
| `@repospec/cli` | commander + clack front-end |

The protocol is versioned independently of these packages so anyone can
implement it (see [`spec/versioning.md`](./spec/versioning.md)).

## Contributing

Repospec is built to welcome thousands of contributors. See
[`docs/governance.md`](./docs/governance.md) for the change process: **code
changes via PR; protocol changes via RFC** ([`spec/rfcs/`](./spec/rfcs/)).
`CONTRIBUTING.md` lands with Milestone 0.

## License

[MIT](./LICENSE) © npxchaos

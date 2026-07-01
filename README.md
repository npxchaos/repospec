# Repospec

[![CI](https://github.com/npxchaos/repospec/actions/workflows/ci.yml/badge.svg)](https://github.com/npxchaos/repospec/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@repospec/cli.svg)](https://www.npmjs.com/package/@repospec/cli)
[![docs](https://img.shields.io/badge/docs-repospec-3c8772.svg)](https://npxchaos.github.io/repospec/)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

📖 **Documentation site:** <https://npxchaos.github.io/repospec/>

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
npx @repospec/cli init   # interview → generate a complete .repospec/ + tool entrypoints
```

## Project status

**Published on npm; the full command surface is implemented.** `init`,
`bootstrap`, `generate`, `sync`, `doctor`, `upgrade`, `review`, `architect`, and
`plugins` all work end-to-end; ten adapters render tool entrypoints; the plugin
runtime executes approved, integrity-pinned plugins in a sandbox. Every roadmap
milestone is delivered (see [`TODO.md`](./TODO.md)); releases ship via Changesets.

## Quickstart

```bash
# run without installing
npx @repospec/cli init

# or install the CLI
npm install -g @repospec/cli      # or: pnpm add -g @repospec/cli
repospec init

# non-interactively
repospec init --yes --name my-app --type application --languages typescript --adapters claude,agents
repospec doctor          # validate .repospec/
repospec sync            # regenerate AGENTS.md / CLAUDE.md from .repospec/
repospec sync --check    # CI: fail if entrypoints drift from .repospec/
```

`repospec init` writes the human-owned `.repospec/` source of truth and the
Repospec-owned tool entrypoints. Edit `.repospec/`, then `repospec sync` to update every
assistant's file at once. Generated files carry a managed header and are never
clobbered if you hand-edit them (without `--force`). See a real result in
[`examples/demo-service`](./examples/demo-service).

Start here:

- [`docs/commands.md`](./docs/commands.md) — **the full command reference**.
- [`docs/templates.md`](./docs/templates.md) — authoring and customizing seed content.
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
└── Repospec Plugins         community extensions (opt-in, consent-gated execution)
```

The organizing layering is **Specification → Engine → CLI → Repository**: the
CLI calls the Engine, the Engine implements the Specification, the Specification
describes the `.repospec/` repository. If the CLI disappeared tomorrow, the
specification — and any other tool built against it — would still stand. That is
the test of a standard.

A single authored `.repospec/` is projected into each assistant's native entrypoint
by **adapters** — `AGENTS.md`, `CLAUDE.md`, Cursor, GitHub Copilot, Windsurf,
Gemini, Zed, Cline, and Continue all ship today — and kept current by `repospec sync`.
A tenth adapter, `claude-agents`, projects each role you define into a native
Claude Code subagent (`.claude/agents/<id>.md`) you can invoke and fan out in
parallel.

## Reference implementation (TypeScript)

| Package | Role |
| ------- | ---- |
| `@repospec/protocol` | the executable specification (types + zod) |
| `@repospec/engine` | the operations: init / bootstrap / generate / sync / doctor / upgrade / review / architect / plugins |
| `@repospec/templates` | default content + adapter content |
| `@repospec/cli` | commander + clack front-end |

The protocol is versioned independently of these packages so anyone can
implement it (see [`spec/versioning.md`](./spec/versioning.md)).

## Contributing

Repospec is built to welcome thousands of contributors. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) and
[`docs/governance.md`](./docs/governance.md) for the change process: **code
changes via PR; protocol changes via RFC** ([`spec/rfcs/`](./spec/rfcs/)).

## License

[MIT](./LICENSE) © npxchaos

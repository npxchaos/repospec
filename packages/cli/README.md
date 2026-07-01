# @repospec/cli

The **`repospec` CLI** — one human entrypoint to the [Repospec engine](../engine).
It is the only package that knows about a terminal: it parses commands, runs the
interview, and renders results. All real work lives in the engine (ADR-0007).

## Commands

All implemented. See [`docs/commands.md`](../../docs/commands.md) for the full
reference.

- `repospec init` — interactive interview (or `--yes`) that generates `.repospec/`
  and the enabled tool entrypoints.
- `repospec bootstrap` — infer a draft `.repospec/` from an existing repo (offline;
  `--ai` opts in to model-refined description).
- `repospec generate` — render entrypoints (`--only <ids>`, `--plugins`).
- `repospec sync` — regenerate entrypoints; `--check` for CI, `--force` to override
  the ownership guard, `--plugins`.
- `repospec doctor` — validate `.repospec/` and report problems, including code
  drift (`--strict` fails on warnings, for CI).
- `repospec upgrade` — migrate `.repospec/` to a newer protocol version.
- `repospec review` — review a diff against the constitution and rules (AI-assisted).
- `repospec architect` — draft/revise `architecture.md` (AI-assisted).
- `repospec plugins list` / `repospec plugins approve` — inspect and approve
  declarative plugins.

## Usage

```bash
# run without installing
npx @repospec/cli init

# or install
npm i -g @repospec/cli   # or: pnpm add -g @repospec/cli
repospec init --yes --name my-app --type application --languages typescript
repospec doctor
repospec sync --check
```

`review`, `architect`, and `bootstrap --ai` call Claude — set `ANTHROPIC_API_KEY`
or authenticate with `ant auth login`; override the model with `REPOSPEC_MODEL`.

## Dependencies

- `@repospec/engine` — the operations the CLI exposes.
- `@repospec/protocol` — schemas + serialization used directly (e.g. plugins).
- `@anthropic-ai/sdk` — Claude provider for the AI-assisted commands.
- `commander` — command parsing.
- `@clack/prompts` — the interactive interview.

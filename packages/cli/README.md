# @repospec/cli

The **`repospec` CLI** — one human entrypoint to the [Repospec engine](../engine).
It is the only package that knows about a terminal: it parses commands, runs the
interview, and renders results. All real work lives in the engine (ADR-0007).

## Status

Implemented (Milestones 1–3). Working commands:

- `repospec init` — interactive interview (or `--yes` non-interactive) that
  generates `.repospec/` and the enabled tool entrypoints.
- `repospec doctor` — validate `.repospec/` and report problems (non-zero on error).
- `repospec sync` — regenerate entrypoints; `--check` for CI, `--force` to override
  the ownership guard.
- `repospec generate` — render entrypoints (`--only <ids>`).

`upgrade`, `review`, `bootstrap`, and `architect` are registered as planned
commands (see `--help`).

## Usage (after build)

```bash
repospec init --yes --name my-app --type application --languages typescript
repospec doctor
repospec sync --check
```

## Dependencies

- `@repospec/engine` — the operations the CLI exposes.
- `commander` — command parsing.
- `@clack/prompts` — the interactive interview.

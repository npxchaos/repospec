# Repospec Protocol

**The open engineering protocol for AI-assisted software development.**

Repospec makes a repository self-describing to AI coding agents. Instead of re-explaining your
project every session, you keep its standards, roles, decisions, and history in a `.repospec/`
directory — and Repospec compiles them into the `AGENTS.md` file agents already read.

```text
.repospec/   (you author this)        ->   repospec build   ->   AGENTS.md   (agents read this)
```

## Why this and not just AGENTS.md or spec-kit

Repospec layers on existing standards rather than replacing them:

- **AGENTS.md** is the portable context file agents read. Repospec *generates* it, so Repospec works
  with today's tools immediately — it doesn't ask agents to learn a new file.
- **spec-kit** drives a single feature from spec to implementation. Repospec governs the standing
  engineering system around features.

Repospec's own contribution is two things neither covers:

1. **Roles** (`.repospec/agents/`) — named responsibilities with owned scope, bounded authority,
   and hand-offs. Replaces "act like a senior engineer."
2. **Durable memory** (`.repospec/decisions/`, `.repospec/history/`) — versioned decisions and history
   that outlive any conversation or model.

## Quickstart

```bash
# try the example
python3 tools/repospec_build.py examples/acme-billing        # compiles AGENTS.md
python3 tools/repospec_build.py examples/acme-billing --check # CI mode: fails if stale
```

Copy `examples/acme-billing/.repospec/` into your own repo, edit it to describe your project,
and run `repospec build` to regenerate `AGENTS.md`.

## Repository layout

```text
docs/        manifesto and the v0.1 protocol spec
examples/    a complete worked example (acme-billing)
tools/       reference build tool (.repospec -> AGENTS.md)
.github/     CI that fails when AGENTS.md drifts from .repospec/
```

## Status

v0.1, working draft. Open problems (enforcement and drift detection) are tracked in
[`docs/spec-v0.1.md`](docs/spec-v0.1.md). Feedback and contributions welcome — see
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

MIT — see [`LICENSE`](LICENSE).

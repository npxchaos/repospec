# Contributing to Forge Protocol

Forge is an open protocol. The goal is a common language between repositories and AI agents,
so the spec matters more than any one implementation.

## Where to start
- **Spec changes** — open an issue describing the problem before a PR. See `docs/spec-v0.1.md`.
- **Reference tooling** — `tools/forge_build.py` is intentionally small and dependency-light.
- **Examples** — additional worked examples under `examples/` are welcome.

## Ground rules
- Keep `AGENTS.md` generated. Never hand-edit it; run `forge build` and commit the result.
- CI runs `forge build --check`; a PR with a stale `AGENTS.md` will fail.
- Discuss naming and scope in issues — both are still open.

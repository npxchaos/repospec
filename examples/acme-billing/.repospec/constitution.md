# Constitution — acme-billing

These rules are non-negotiable. Every change, human or agent, obeys them.

1. Small steps over large rewrites. Prefer the smallest change that ships value.
2. Tests precede implementation for any code touching billing math (see `rules/testing.md`).
3. A human approves every change under `deploy/` and `migrations/`.
4. Secrets never enter the repo, the logs, or agent output (see `rules/security.md`).
5. Money is integer cents. Never floats. Never.
6. Every externally observable behavior change is recorded in `history/`, and if architectural, in `decisions/`.

Humans amend this file. Agents obey it and never edit it.

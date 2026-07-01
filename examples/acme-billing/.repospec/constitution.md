# Constitution — acme-billing

Non-negotiable principles. Every change obeys these; they outrank convenience.

- **Small steps over large rewrites.** Prefer the smallest change that solves the
  problem.
- **Tests precede implementation for billing math.** Any code that computes money
  starts with a failing test.
- **A human approves every change to `deploy/` or `migrations/`.** These are gated;
  an agent may propose but not clear the gate.
- **Secrets never enter the repo, the logs, or an agent's output.** No card data,
  no credentials, no tokens.
- **Settled decisions are not re-litigated.** Read the architecture before proposing
  a structural change.

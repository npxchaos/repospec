---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Add the AI-assisted operations `repospec review` and `repospec architect`,
completing the protocol's command surface.

- `review` judges a change (a `git diff`) against the repository's constitution
  and rules, returning structured findings; exits non-zero on an error-severity
  finding (`--strict` for any finding).
- `architect` drafts or revises `.repospec/architecture.md` from the project
  identity and current document; prints a draft, `--write` to save it.

The engine gains a small, injectable `LlmClient` port, so the operations stay
UI- and vendor-agnostic and unit-testable with a fake (ADR-0007). The CLI
supplies a Claude implementation via `@anthropic-ai/sdk` (model `claude-opus-4-8`,
adaptive thinking); it resolves credentials from `ANTHROPIC_API_KEY` or an
`ant auth login` profile. All roadmap command stubs are now implemented.

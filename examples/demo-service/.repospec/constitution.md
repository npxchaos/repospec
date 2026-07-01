# Constitution — demo-service

These are the non-negotiable principles for this project. They hold regardless
of the task, the tool, or the assistant. When a specific instruction conflicts
with a principle here, this document wins.

> This file is owned by the team. Edit it deliberately, in a reviewed change.

## Principles

1. **The repository is the source of truth.** Decisions live in version
   control, not in chat history or memory.
2. **Human decisions win.** Automated agents follow what is committed here; they
   do not override it.
3. **Small, reviewable changes.** Prefer several focused changes over one large
   one.
4. **Tests and docs ship with the change**, not afterward.
5. **Explicit over implicit.** Make intent visible in code and configuration.
6. **One responsibility per unit.** Functions, modules, and files do one thing.

## Quality bar

- Code is formatted and linted before it is committed.
- Public APIs are documented.
- Changes that alter behavior include tests that would fail without them.

## Amending this document

Change it via a pull request like any other code. Significant changes deserve a
short rationale in the PR description.

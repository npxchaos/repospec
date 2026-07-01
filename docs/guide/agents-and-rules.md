# Roles & rules

Generic content = generic behavior. This is where you make assistants follow
*your* project. Two artifact types live under `.repospec/`.

## Agents (roles)

`.repospec/agents/<id>.md` — a role an assistant plays. YAML frontmatter plus a
Markdown body:

```markdown
---
id: reviewer
name: Reviewer
description: Reviews changes for correctness, tests, and style.
responsibilities:
  - Run and read the tests before approving
  - Flag risky or out-of-scope changes
boundaries:
  - Never approve without passing tests
  - Never expand scope beyond the diff
model: opus            # optional
---

Be concise and specific. Cite `file:line`. Prefer the smallest correct change.
```

- `responsibilities` / `boundaries` / `capabilities` are optional string lists.
- The body is free-form guidance — the role's system prompt.

## Rules

`.repospec/rules/<id>.md` — a focused, enforceable constraint:

```markdown
---
id: tests-required
title: Tests accompany behavior changes
severity: error          # error | warning | info
appliesTo:
  - "src/**/*.ts"
rationale: Untested behavior rots. A change without a test is incomplete.
---

Any change to runtime behavior under `src/` must add or update a test in the same PR.
```

**Always add `appliesTo` globs.** They do double duty:

1. Scope the rule to the right files.
2. Let `doctor` detect **rule-target drift** — a rule whose globs match no files
   (it's guarding code that no longer exists).

## Make them effective

- **Specific + short beats long + generic.** Agents skim walls of text; they
  follow crisp constraints.
- **One responsibility per home.** Split roles (reviewer vs. implementer) rather
  than one mega-role.
- **Boundaries are the highest-value lines** — what the agent must *never* do.

## Apply

```bash
npx @repospec/cli sync
```

Every enabled assistant's entrypoint now embeds the roles and rules. Verify fast:
open your tool and ask *"what are this project's rules?"* — it should answer from
the generated file.

## Next

- [Parallel subagents →](./parallel-agents) — turn these roles into Claude Code
  subagents you can fan out.
- [Adapters →](./adapters) — pick which assistants receive them.

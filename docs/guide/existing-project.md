# Adopt in an existing project

A repo that's already in progress. Use `bootstrap` — it infers your stack from
the code and **imports your existing docs** so you start from real content, not a
blank template.

## 1. Bootstrap

```bash
cd my-existing-project
npx @repospec/cli bootstrap
```

It runs **offline** and shows what it found before writing anything:

- **Stack** from `package.json`, lockfiles, and dependencies — languages,
  runtimes, package manager, frameworks, testing tools, formatter/linter.
- **Type** inferred (`cli` if there's a `bin`, `application` for app frameworks,
  `monorepo` for workspaces, `library`, or `service`).
- **Prose docs** seeded from your repository's own docs (see below).

Review the plan, confirm, and it writes a **draft** `.repospec/`. Nothing is
written without your approval.

## 2. Doc import — the important part

`bootstrap` fills the prose documents from files you already wrote, first match
wins, imported verbatim under a provenance note (the source's own title stripped):

| `.repospec/` file | Sourced from (priority order) |
| --- | --- |
| `architecture.md` | `ARCHITECTURE.md`, `docs/architecture.md`, `docs/architecture/overview.md`, … |
| `constitution.md` | `PRINCIPLES.md`, `ENGINEERING.md`, `CONSTITUTION.md`, `ACTION_PLAN.md`, … |
| `workflow.md` | `CONTRIBUTING.md`, `WORKFLOW.md`, `docs/development.md`, … |

So a real `ARCHITECTURE.md` becomes `.repospec/architecture.md` you can trim,
instead of a blank skeleton. Skip it with `--no-import-docs`.

Non-standard doc paths? The import is filename-based — rename to a recognized
name, or paste the content into `.repospec/` by hand after bootstrap.

## 3. Review the draft

Bootstrap output is a **starting point you own**. Read every file:

- Trim imported docs to what an agent needs (drop changelog-style noise).
- Fix the inferred description/type if off.
- Fill in [roles & rules](./agents-and-rules) — bootstrap seeds generic ones.

## 4. Generate + commit

```bash
npx @repospec/cli sync      # regenerate entrypoints from the reviewed draft
npx @repospec/cli doctor    # validate; flags stack drift if the draft is stale
git add .repospec CLAUDE.md AGENTS.md
git commit -m "Add Repospec"
```

## Optional: AI-refined description

```bash
npx @repospec/cli bootstrap --ai
```

Sends **only** the detected metadata (name + evidence) to refine the one-line
description — never source code, never doc contents. Requires
`ANTHROPIC_API_KEY` (or `ant auth login`).

## Next

- [Roles & rules →](./agents-and-rules).
- [Parallel subagents →](./parallel-agents).
- [Guard drift in CI →](./ci) — catch the day the code and `.repospec/` diverge.

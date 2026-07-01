# Parallel subagents

Repospec doesn't run agents — it defines the shared context they read. Execution
(and parallelism) is the host tool's job. Here's how to make your roles run in
parallel.

## 1. Project roles into native subagents

Enable the `claude-agents` adapter:

```yaml
# .repospec/project.yaml
adapters: [claude, agents, claude-agents]
```

```bash
npx @repospec/cli sync
```

Each `.repospec/agents/<id>.md` role becomes a native **Claude Code subagent** at
`.claude/agents/<id>.md` — frontmatter (`name`, `description`, optional `model`)
plus a system prompt built from the role's responsibilities, boundaries, and
body. One source of truth, kept in sync.

## 2. Fan out

In Claude Code, invoke several subagents in one message — they run concurrently.
Good for read/analyze fan-out (review N modules, audit M dimensions) where the
workers don't write.

## 3. Parallel writers: isolate them

The one hard rule: **parallel writers must not share files.** Two options:

**Git worktrees — real isolation, one branch each:**

```bash
git worktree add ../proj-featA -b featA
git worktree add ../proj-featB -b featB
# run a Claude Code session in each; merge the branches after
```

**File-scoping — one repo, disjoint files:** give each role a rule with
`appliesTo` globs that don't overlap, so agents stay in their lane. See
[Roles & rules](./agents-and-rules).

## What Repospec gives parallel work

- **Consistency** — every worker reads the same generated guide, so they behave
  the same way.
- **Scoping** — `appliesTo` globs keep agents off each other's files.
- **Single source** — change a role once; `sync` updates every subagent.

Repospec is the coordination layer. Worktrees or the Task tool are the execution
layer.

## Next

- [Guard drift in CI →](./ci).
- [Troubleshooting →](./troubleshooting).

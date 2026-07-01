---
'@repospec/engine': minor
'@repospec/cli': minor
---

Add the `claude-agents` adapter (tenth built-in): it projects each
`.repospec/agents/<id>.md` role into a native **Claude Code subagent** at
`.claude/agents/<id>.md` — YAML frontmatter (`name`, `description`, optional
`model`) plus a system prompt composed from the role's responsibilities,
boundaries, and body. Enable it in `project.yaml` `adapters:` and keep the
subagents in sync with `repospec sync`. This turns the roles you define once
into subagents Claude Code can invoke and fan out in parallel.

The managed-header pipeline now keeps YAML frontmatter first (placing the header
just after it) so tools that require frontmatter on line 1 — Claude Code
subagents, Cursor `.mdc` — parse correctly. Existing header-first files are
unaffected.

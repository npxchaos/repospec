# Adapters

An adapter projects the single `.repospec/` source of truth into one tool's
native entrypoint. Enable them in `project.yaml`:

```yaml
# .repospec/project.yaml
adapters: [claude, agents, cursor, claude-agents]
```

Then `repospec sync` writes/updates each file. Every generated file carries a
managed header + checksum and is protected from accidental clobbering
([Ownership](./troubleshooting)).

## Built-in adapters

| id | Tool | Generates |
| --- | --- | --- |
| `claude` | Claude / Claude Code | `CLAUDE.md` |
| `agents` | Cross-tool convention | `AGENTS.md` |
| `copilot` | GitHub Copilot | `.github/copilot-instructions.md` |
| `cursor` | Cursor | `.cursor/rules/repospec.mdc` |
| `windsurf` | Windsurf | `.windsurf/rules/repospec.md` |
| `gemini` | Gemini CLI | `GEMINI.md` |
| `zed` | Zed | `.rules` |
| `cline` | Cline | `.clinerules/repospec.md` |
| `continue` | Continue | `.continue/rules/repospec.md` |
| `claude-agents` | Claude Code subagents | `.claude/agents/<id>.md` (one per role) |

The first nine render a single **assistant guide** from your project, roles, and
rules. `claude-agents` is different: it emits **one file per role** as a native
Claude Code subagent — see [Parallel subagents](./parallel-agents).

## Selecting a subset

```bash
# regenerate only specific adapters
npx @repospec/cli generate --only claude,cursor
```

## Adding a tool that isn't listed

Adapters are a stable extension point. If your assistant reads a file not covered
here, open an issue or PR — a new adapter is a small, pure renderer. Until then,
`AGENTS.md` (the cross-tool convention) is read by many tools.

## Next

- [Roles & rules →](./agents-and-rules) — what the adapters actually render.
- [Commands →](../commands) — `generate` / `sync` flags.

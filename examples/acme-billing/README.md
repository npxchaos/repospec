# Forge Starter — acme-billing (example)

A worked example of a Forge-governed repository. Copy the `.forge/` directory into your repo,
edit it to describe your project, and run `forge build` to compile `AGENTS.md`.

- `.forge/` — human-authored source of truth (you edit this)
- `AGENTS.md` — generated; the file coding agents actually read (don't hand-edit)

Forge layers on two existing standards rather than replacing them: it **compiles AGENTS.md**
(so it works with today's agents immediately) and leaves feature-level spec→plan→tasks flow to
tools like spec-kit. Forge's own contribution is the **roles** (`.forge/agents/`) and the
**durable memory** (`.forge/decisions/`, `.forge/history/`).

> Naming note: `forge` collides with Foundry's Solidity CLI (`forge init`). The command name here
> is a placeholder pending a rename.

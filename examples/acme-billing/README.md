# Repospec Starter — acme-billing (example)

A worked example of a Repospec-governed repository. Copy the `.repospec/` directory into your repo,
edit it to describe your project, and run `repospec build` to compile `AGENTS.md`.

- `.repospec/` — human-authored source of truth (you edit this)
- `AGENTS.md` — generated; the file coding agents actually read (don't hand-edit)

Repospec layers on two existing standards rather than replacing them: it **compiles AGENTS.md**
(so it works with today's agents immediately) and leaves feature-level spec→plan→tasks flow to
tools like spec-kit. Repospec's own contribution is the **roles** (`.repospec/agents/`) and the
**durable memory** (`.repospec/decisions/`, `.repospec/history/`).

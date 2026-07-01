# Getting started

Repospec keeps one human-owned source of truth — the `.repospec/` directory —
and generates every AI assistant's entrypoint from it. You edit `.repospec/`;
`repospec sync` regenerates `CLAUDE.md`, `AGENTS.md`, Cursor rules, and the rest.

No install required — run it with `npx`.

## Which path are you on?

- **Starting a new project (nothing yet)** → [Start from scratch](./from-scratch).
- **Adding Repospec to an existing repo** → [Adopt in an existing project](./existing-project).

Both end in the same place: a `.repospec/` you own plus generated entrypoints
kept in sync.

## The 30-second version

```bash
# new project
npx @repospec/cli init

# existing project (infers stack + imports your ARCHITECTURE.md etc.)
npx @repospec/cli bootstrap
```

Then the loop you'll repeat forever:

```bash
# edit files under .repospec/ ...
npx @repospec/cli sync      # regenerate every assistant's entrypoint
npx @repospec/cli doctor    # validate + report drift
```

## Install (optional)

`npx` always runs the latest. To pin a local/global binary:

```bash
npm install -g @repospec/cli   # or: pnpm add -g @repospec/cli
repospec --version
```

## Mental model

| Layer | Who owns it | You do |
| --- | --- | --- |
| `.repospec/` (source of truth) | **You** | Edit it |
| `CLAUDE.md`, `AGENTS.md`, … (entrypoints) | **Repospec** | Never hand-edit — run `sync` |

Generated files carry a managed header + checksum. If you hand-edit one, `sync`
**refuses to clobber it** (without `--force`) and tells you — so you can move the
change into `.repospec/` where it belongs. See
[Ownership & drift](./troubleshooting).

Next: [Start from scratch →](./from-scratch)

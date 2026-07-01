# Start from scratch

A brand-new project with no `.repospec/` yet. `repospec init` runs a short
interview and writes both the source of truth and the tool entrypoints.

## 1. Initialize

```bash
cd my-new-project
npx @repospec/cli init
```

The interview asks for the name, description, type (`application`, `service`,
`library`, `cli`, `monorepo`), languages, and which assistants to target. Prefer
non-interactive?

```bash
npx @repospec/cli init --yes \
  --name my-app --type application \
  --languages typescript \
  --adapters claude,agents,cursor
```

`init` is **re-run safe**: it never overwrites a human-owned `.repospec/` file
without `--force`.

## 2. What you get

```
.repospec/
  project.yaml          # machine-readable root (validated against the schema)
  constitution.md       # non-negotiable engineering principles
  architecture.md       # how THIS project is structured
  workflow.md           # branching, review, release
  agents/               # role definitions (reviewer, implementer, …)
  rules/                # focused, enforceable rules
CLAUDE.md               # generated entrypoint (one per enabled adapter)
AGENTS.md
.cursor/rules/repospec.mdc
```

See a real result in
[`examples/demo-service`](https://github.com/npxchaos/repospec/tree/main/examples/demo-service).

## 3. Make it yours

The seed content is a skeleton. The value is in filling it:

- **`constitution.md`** — short, imperative principles the agent must not break.
- **`architecture.md`** — boundaries, where things live, what depends on what.
- **`agents/*.md`** and **`rules/*.md`** — see
  [Roles & rules](./agents-and-rules). This is what turns generic assistants
  into ones that follow *your* project.

Then regenerate:

```bash
npx @repospec/cli sync
```

## 4. Commit

```bash
git add .repospec CLAUDE.md AGENTS.md .cursor
git commit -m "Add Repospec"
```

## Next

- [Roles & rules →](./agents-and-rules) — make the agents actually behave.
- [Guard drift in CI →](./ci).
- [Adapters →](./adapters) — target more assistants.

# Guard drift in CI

The failure mode Repospec prevents: `.repospec/` says one thing, the code (or the
generated entrypoints) say another, and agents act on stale truth. Two checks
catch it. Both exit non-zero on a problem, so CI can gate on them.

## Entrypoints match `.repospec/`

```bash
npx @repospec/cli sync --check
```

Renders what the entrypoints *should* be and compares to what's on disk. Fails if
`CLAUDE.md`/`AGENTS.md`/etc. drift from `.repospec/` — e.g. someone edited a
generated file by hand, or forgot to `sync` after editing `.repospec/`.

## Code matches `.repospec/`

```bash
npx @repospec/cli doctor --strict
```

`doctor` validates `.repospec/` and reports:

- missing referenced documents, unknown adapters, duplicate plugins;
- **generated-output drift** (same as `sync --check`);
- **code ⇄ `.repospec/` drift** — declared stack vs. what the repo actually
  contains (languages, runtimes, package manager, frameworks, testing tools);
- **rule-target drift** — a rule whose `appliesTo` globs match no files.

Warnings don't fail by default; `--strict` makes any warning a failure.

## GitHub Actions

```yaml
name: repospec
on: [push, pull_request]
jobs:
  repospec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: npx @repospec/cli sync --check
      - run: npx @repospec/cli doctor --strict
```

When it fails: run `npx @repospec/cli sync` locally, commit the regenerated
files (or fix the underlying drift in `.repospec/`), and push.

## Next

- [Troubleshooting →](./troubleshooting).
- Full flag reference: [Commands](../commands).

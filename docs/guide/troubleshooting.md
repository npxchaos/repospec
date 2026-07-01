# Troubleshooting & edge cases

Common situations and what to do.

## `sync` skipped a file: "modified by hand"

You (or a teammate) hand-edited a generated entrypoint. Repospec detects the
checksum mismatch and **refuses to overwrite** — your edit is safe.

The fix is to move the change to the source of truth:

1. Copy the intent of your edit into the relevant `.repospec/` file.
2. Run `npx @repospec/cli sync` — now the regenerated output includes it.

If you're sure the hand-edit should be discarded:

```bash
npx @repospec/cli sync --force
```

`--force` overwrites hand-edited **and** unmanaged outputs. Use deliberately.

## `sync` skipped a file: "not Repospec-managed"

A file exists at an adapter's output path but has no managed header (it predates
Repospec, or was written by another tool). Repospec won't touch it without
`--force`. Back it up, then `sync --force` to take ownership.

## `doctor` reports code drift

`.repospec/project.yaml` declares a stack that no longer matches the repo — e.g.
you added a framework or switched package managers. Update `project.yaml` (or run
`bootstrap` again in a scratch branch to re-infer), then `sync`. `--strict` turns
this into a CI failure.

## `doctor` reports rule-target drift

A rule's `appliesTo` globs match no files — it's guarding code that moved or was
deleted. Either update the globs or retire the rule.

## Protocol version mismatch

The CLI supports a specific protocol version. If `project.yaml` declares a
different one:

```bash
npx @repospec/cli upgrade
```

It plans and applies migrations between versions. The protocol is versioned
independently of the npm packages ([versioning spec](../../spec/versioning)).

## Bootstrap imported the wrong doc

The doc import is filename-based and picks the first match. If it grabbed the
wrong file (or too much), edit `.repospec/architecture.md` (etc.) directly — it's
yours — or re-run with `--no-import-docs` and paste content in by hand.

## "Unknown adapter" warning

`project.yaml` lists an adapter id the engine doesn't know. Check the spelling
against the [adapter list](./adapters); remove or correct it.

## A plugin isn't running

Plugin execution is opt-in and consent-gated. It runs only after explicit
approval recorded in `plugins.lock`:

```bash
npx @repospec/cli plugins list      # see discovered plugins + status
npx @repospec/cli plugins approve <id>
npx @repospec/cli generate --plugins
```

If a previously approved plugin stops running, its integrity hash changed (the
code was modified) — re-review and re-approve. See
[SECURITY](https://github.com/npxchaos/repospec/blob/main/SECURITY.md).

## Still stuck?

- Full flag reference: [Commands](../commands).
- File an issue: <https://github.com/npxchaos/repospec/issues>.

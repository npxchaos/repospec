# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).
Every user-facing change to a published package ships with a changeset.

Add one with:

```bash
pnpm changeset
```

Pick the affected packages and the semver bump (patch / minor / major), and
write a short, user-facing summary. The changeset file is committed with your
PR; releases are produced from these files.

Note: the **protocol version** (`repospecProtocol`) is versioned separately from
package versions — see [`spec/versioning.md`](../spec/versioning.md).

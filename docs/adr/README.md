# Architecture Decision Records

ADRs capture significant, hard-to-reverse decisions and the reasoning behind
them. They are immutable once Accepted: to change a decision, write a new ADR
that supersedes the old one.

Use [`template.md`](./template.md) for new records. Number sequentially.

| ADR | Title | Status |
| --- | ----- | ------ |
| [0001](./0001-monorepo-and-package-boundaries.md) | Monorepo layout and package boundaries | Accepted |
| [0002](./0002-protocol-versioning.md) | Protocol versioning independent of the toolchain | Accepted |
| [0003](./0003-single-source-of-truth-and-tool-adapters.md) | Single source of truth with tool adapters | Accepted |
| [0004](./0004-ownership-and-idempotent-sync.md) | Ownership model and idempotent sync | Accepted |
| [0005](./0005-validation-zod-and-json-schema.md) | Validation via zod with published JSON Schema | Accepted |
| [0006](./0006-template-distribution.md) | Bundled, offline-first template distribution | Accepted |
| [0007](./0007-specification-first-architecture.md) | Specification-first architecture (Specification → Engine → CLI) | Accepted |
| [0008](./0008-plugin-runtime-security.md) | Plugin runtime security (trust and sandbox model) | Accepted |
| [0009](./0009-plugin-sandbox-mechanism.md) | Plugin sandbox mechanism (worker) | Superseded by 0010 |
| [0010](./0010-plugin-sandbox-permission-model.md) | Plugin sandbox: Node Permission Model subprocess | Accepted |

## When to write an ADR

- Changing a package boundary or dependency direction.
- Changing the protocol's shape or semantics (also requires an RFC — see
  `../governance.md`).
- Choosing or replacing a foundational dependency.
- Any decision a future contributor would otherwise reverse without context.

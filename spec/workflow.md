# Repospec Specification — Workflow

- **Specification version:** 0.1 (draft)
- **Status:** Normative (artifact) + Informative (recommended model)
- **Depends on:** [`protocol.md`](./protocol.md), [`repository.md`](./repository.md)

> Defines the `.repospec/workflow.md` artifact: the repository's statement of *how
> work flows* — branching, review, release, and the definition of done. This
> document specifies what the artifact MUST cover (normative) and recommends a
> structure (informative).

## 1. Purpose

`workflow.md` answers: *"How does a change go from idea to merged, released
code in this project?"* It is the single place an assistant or a new contributor
learns the team's process, so the process is followed consistently — by humans
and AI alike.

## 2. Normative requirements

`workflow.md` is a REQUIRED prose artifact ([`repository.md`](./repository.md)).
To conform, it MUST address each of the following topics. The wording and depth
are the team's choice; the topics are not optional.

| Topic | Must state |
| ----- | ---------- |
| **Branching** | How branches are named and based; the integration branch. |
| **Change size** | The expectation that changes are small and incremental (charter: "small iterations over rewrites"). |
| **Review** | Who/what reviews, and what blocks a merge. |
| **Testing** | The expectation that changes ship with tests. |
| **Documentation** | The expectation that changes ship with doc updates. |
| **Release** | How versions are cut and published. |
| **Definition of Done** | The checklist a change MUST satisfy before merge. |

An implementation MAY check that these topics are present (e.g. by heading), but
MUST NOT enforce specific content — the protocol describes process, it does not
dictate it.

## 3. Recommended structure (informative)

A workflow that reads well and is easy for assistants to follow:

```markdown
# Workflow

## Branching
Trunk-based. Feature branches from `main`, named `type/short-description`.

## Change size
One concern per pull request. Prefer several small PRs over one large one.

## Review
Every PR needs one human approval. CI (build, lint, test) MUST be green.
Reviews start from `constitution.md` and `architecture.md`.

## Testing
Every behavioral change ships with tests. No PR reduces coverage of touched code.

## Documentation
Public APIs, ADR-worthy decisions, and user-facing changes update docs in the
same PR.

## Release
Versions are cut with Changesets; releases are automated from `main`.

## Definition of Done
- [ ] Tests pass and cover the change
- [ ] Docs updated
- [ ] Adheres to the constitution and architecture
- [ ] Reviewed and approved
```

## 4. Relationship to the engineering lifecycle

`workflow.md` describes the **human/team** process for changing the *product*.
It is distinct from [`lifecycle.md`](./lifecycle.md), which describes the
**protocol operations** (init, generate, sync, doctor, upgrade) that act on the
`.repospec/` directory itself. One is "how we ship features"; the other is "how the
Repospec artifacts are created and maintained."

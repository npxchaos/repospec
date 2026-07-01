# Templates & Authoring

`repospec init` seeds a repository's `.repospec/` from the bundled templates in
`@repospec/templates`. Templates are shipped in the package (not fetched at
runtime) so `init` is deterministic and offline (ADR-0006). This page explains
what they produce and how to author or customize them.

## What templates produce

Templates render only the **human-owned source** under `.repospec/` — the
constitution, architecture, workflow, and the starter agents and rules. They do
**not** render tool entrypoints like `CLAUDE.md` or `AGENTS.md`; those are
generated from `.repospec/` by adapters in the engine and carry a managed header
(ADR-0004). Keep the line clear: templates seed what a human then owns and edits;
adapters generate what the tool regenerates.

`getSeedDocuments(project)` returns the seed files for a validated project:

```ts
import { getSeedDocuments } from '@repospec/templates';

for (const { path, contents } of getSeedDocuments(project)) {
  // path is relative to .repospec/, e.g. "constitution.md", "agents/reviewer.md"
}
```

`project.yaml` itself is not a template — the engine serializes it from the
validated configuration.

## Interpolation

Seed content is filled from the init answers with a small substitution engine.
`interpolate` replaces `{{ dotted.path }}` placeholders from a variable tree and
**throws on a missing variable** — a loud failure beats a silent blank in a
generated document.

```ts
import { interpolate, partials } from '@repospec/templates';

const TEMPLATE = `# Architecture — {{ project.name }}

${partials.seededNote}

This is a **{{ project.type }}**.
`;

const md = interpolate(TEMPLATE, { project: project.project });
```

- Whitespace inside the braces is ignored: `{{project.name}}` and
  `{{ project.name }}` are equivalent.
- Paths resolve into nested objects (`{{ project.name }}` reads
  `vars.project.name`).
- A referenced variable that is missing or `null`/`undefined` throws.

### Partials

`partials` holds reusable snippets shared across documents, so common prose lives
in one place. Today it exports `seededNote` (the notice at the top of every
seeded document). Compose partials into templates with a normal template literal,
as shown above.

## Customizing the seed content

The seed content lives in `@repospec/templates/src/content/`. To change what new
repositories start with, edit those modules — each is a small function returning
Markdown, using `interpolate` + `partials` for anything derived from the project.
Keep two rules in mind:

1. **Deterministic and offline.** No network, no clock, no randomness — the same
   project must always produce the same seed (ADR-0006).
2. **Human-owned output only.** Never emit a managed header or anything a human
   shouldn't own; generated entrypoints are the adapters' job.

## Adapters vs. templates

| | Templates (`@repospec/templates`) | Adapters (`@repospec/engine`) |
| --- | --- | --- |
| Produce | human-owned `.repospec/` source | generated tool entrypoints |
| When | once, at `init` | every `generate` / `sync` |
| Ownership | human edits freely afterward | managed header; regenerated |
| Add one by | editing `content/` | implementing the `Adapter` interface |

To target a new assistant, add an **adapter** (see `packages/engine/src/adapters/`),
not a template. Templates are for what the human authors; adapters are for what
the tool keeps in sync.

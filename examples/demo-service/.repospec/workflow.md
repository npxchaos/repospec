# Workflow — demo-service

How a change goes from idea to merged, released code.

## Branching

GitHub flow: feature branches off `main`, merged via reviewed PRs.

## Change size

One concern per pull request. Prefer several small PRs over one large one.

## Commits

Write clear, imperative commit subjects.

## Review

Every change is reviewed before merge. Reviews start from `constitution.md` and
`architecture.md`. CI must be green.

## Testing

Every behavioral change ships with tests that would fail without it.

## Documentation

User-facing and architectural changes update the relevant docs in the same PR.

## Release

Describe how versions are cut and published for this project.

## Definition of Done

- [ ] Tests pass and cover the change
- [ ] Docs updated
- [ ] Adheres to the constitution and architecture
- [ ] Reviewed and approved

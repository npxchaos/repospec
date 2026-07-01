import type { Project } from '@repospec/protocol';

const BRANCHING: Record<string, string> = {
  trunk: 'Trunk-based: short-lived branches off `main`, merged quickly.',
  'github-flow':
    'GitHub flow: feature branches off `main`, merged via reviewed PRs.',
  gitflow: 'Git flow: `develop` + `main`, with release and hotfix branches.',
};

/**
 * Render the seed `workflow.md` — how work flows from idea to released code.
 * Covers every topic the specification requires (`spec/workflow.md`).
 *
 * @param project - The project configuration gathered at init.
 * @returns Markdown for `.repospec/workflow.md`.
 */
export function workflow(project: Project): string {
  const branching =
    BRANCHING[project.conventions.branching ?? 'github-flow'] ??
    BRANCHING['github-flow'];
  const commit =
    project.conventions.commitStyle === 'conventional'
      ? 'Use [Conventional Commits](https://www.conventionalcommits.org/).'
      : 'Write clear, imperative commit subjects.';

  return `# Workflow — ${project.project.name}

How a change goes from idea to merged, released code.

## Branching

${branching}

## Change size

One concern per pull request. Prefer several small PRs over one large one.

## Commits

${commit}

## Review

Every change is reviewed before merge. Reviews start from \`constitution.md\` and
\`architecture.md\`. CI must be green.

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
`;
}

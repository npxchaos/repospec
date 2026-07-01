/**
 * Starter agent artifacts (`.repospec/agents/*`). Each is a Markdown document with
 * validated frontmatter (see `spec/agent.md`).
 */

/** The `reviewer` starter agent. */
export function reviewerAgent(): string {
  return `---
id: reviewer
name: Code Reviewer
description: Reviews diffs for correctness, tests, and adherence to the constitution.
responsibilities:
  - Flag missing tests or documentation.
  - Verify changes respect architecture.md boundaries.
  - Check that changes are small and focused.
boundaries:
  - Does not merge.
  - Does not expand product scope.
---

When reviewing, start from \`constitution.md\` and \`architecture.md\`. Prefer
small, specific suggestions. Block only on correctness, missing tests, or a
violated rule from \`rules/\`.
`;
}

/** The `implementer` starter agent. */
export function implementerAgent(): string {
  return `---
id: implementer
name: Implementer
description: Implements changes that follow the project's protocol and conventions.
responsibilities:
  - Make the smallest change that solves the problem.
  - Add tests and documentation alongside the change.
boundaries:
  - Does not change architecture without a recorded decision.
  - Does not bypass the rules in rules/.
---

Read \`workflow.md\` before starting. Follow the stack and conventions declared in
\`project.yaml\`. When a design choice is significant, record it rather than
deciding silently.
`;
}

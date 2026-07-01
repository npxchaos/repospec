/**
 * Starter rule artifacts (`.repospec/rules/*`). Each is a single, focused,
 * enforceable expectation with validated frontmatter (see `spec/agent.md`).
 */

/** Rule: behavioral changes ship with tests. */
export function testsRequiredRule(): string {
  return `---
id: tests-required
title: Changes ship with tests
severity: error
rationale: Untested behavior regresses silently.
---

Every change that alters behavior must include a test that would fail without
the change. Bug fixes start with a failing test that reproduces the bug.
`;
}

/** Rule: keep changes small and focused. */
export function smallChangesRule(): string {
  return `---
id: small-changes
title: Keep changes small and focused
severity: warning
rationale: Small changes are easier to review and safer to revert.
---

One concern per change. If a change grows to touch many unrelated areas, split
it.
`;
}

/** Rule: document public APIs. */
export function documentPublicApiRule(): string {
  return `---
id: document-public-api
title: Document public APIs
severity: warning
rationale: Undocumented public surfaces are hard to use and easy to misuse.
---

Every exported function, type, and module has a short doc comment explaining its
purpose and contract.
`;
}

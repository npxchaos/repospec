/**
 * `@repospec/templates` — default content the Repospec protocol is seeded
 * from. Bundled, so `repospec init` is deterministic and offline (ADR-0006).
 *
 * Templates produce only **human-owned** source artifacts under `.repospec/`
 * (ADR-0004). Generated outputs (e.g. `CLAUDE.md`) are produced by adapters in
 * the engine, not here.
 *
 * @packageDocumentation
 */

import type { Project } from '@repospec/protocol';
import { architecture } from './content/architecture.js';
import { constitution } from './content/constitution.js';
import { workflow } from './content/workflow.js';
import { implementerAgent, reviewerAgent } from './content/agents.js';
import {
  documentPublicApiRule,
  smallChangesRule,
  testsRequiredRule,
} from './content/rules.js';

export { interpolate, partials } from './render.js';

/** A seed file to be written under `.repospec/`. Always human-owned. */
export interface SeedFile {
  /** Path relative to the `.repospec/` directory. */
  readonly path: string;
  /** File contents. */
  readonly contents: string;
}

/**
 * Build the set of seed documents for a freshly initialized project.
 *
 * Does **not** include `project.yaml` — that is serialized by the engine from
 * the validated configuration.
 *
 * @param project - The validated project configuration.
 * @returns The human-owned files to write under `.repospec/`.
 */
export function getSeedDocuments(project: Project): SeedFile[] {
  return [
    { path: project.documents.constitution, contents: constitution(project) },
    { path: project.documents.architecture, contents: architecture(project) },
    { path: project.documents.workflow, contents: workflow(project) },
    { path: `${project.agents.dir}/reviewer.md`, contents: reviewerAgent() },
    {
      path: `${project.agents.dir}/implementer.md`,
      contents: implementerAgent(),
    },
    {
      path: `${project.rules.dir}/tests-required.md`,
      contents: testsRequiredRule(),
    },
    {
      path: `${project.rules.dir}/small-changes.md`,
      contents: smallChangesRule(),
    },
    {
      path: `${project.rules.dir}/document-public-api.md`,
      contents: documentPublicApiRule(),
    },
  ];
}

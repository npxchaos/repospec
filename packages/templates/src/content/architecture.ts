import type { Project } from '@repospec/protocol';
import { interpolate, partials } from '../render.js';

const TEMPLATE = `# Architecture — {{ project.name }}

{{ project.description }}

${partials.seededNote}

## Overview

This is a **{{ project.type }}**. Describe its purpose and the boundary of
what it owns in one or two paragraphs.

## Technology

{{ technology }}

## Structure

Describe the top-level layout and what each part is responsible for. Keep the
single-owner principle: each responsibility has exactly one home.

\`\`\`
src/            <!-- describe -->
tests/          <!-- describe -->
\`\`\`

## Boundaries & dependencies

- What may depend on what (and what may not).
- External services or systems this project talks to.

## Key decisions

Link or summarize the decisions a newcomer must know to work here safely.
`;

/**
 * Render the seed `architecture.md` — a starting point describing how *this*
 * project is structured. Pre-filled from the init answers via {@link interpolate};
 * meant to be expanded by the team.
 *
 * @param project - The project configuration gathered at init.
 * @returns Markdown for `.repospec/architecture.md`.
 */
export function architecture(project: Project): string {
  const { stack } = project;
  const line = (label: string, values?: string[]): string =>
    values && values.length > 0 ? `- **${label}:** ${values.join(', ')}` : '';
  const technology = [
    line('Languages', stack.languages),
    line('Runtimes', stack.runtimes),
    stack.packageManager
      ? `- **Package manager:** ${stack.packageManager}`
      : '',
    line('Frameworks', stack.frameworks),
    line('Testing', stack.testing),
  ]
    .filter(Boolean)
    .join('\n');

  return interpolate(TEMPLATE, {
    project: project.project,
    technology,
  });
}

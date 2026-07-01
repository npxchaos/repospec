import type { Project } from '@repospec/protocol';

/**
 * Render the seed `architecture.md` — a starting point describing how *this*
 * project is structured. Pre-filled from the init answers; meant to be expanded
 * by the team.
 *
 * @param project - The project configuration gathered at init.
 * @returns Markdown for `.repospec/architecture.md`.
 */
export function architecture(project: Project): string {
  const { stack } = project;
  const list = (label: string, values?: string[]): string =>
    values && values.length > 0 ? `- **${label}:** ${values.join(', ')}\n` : '';

  return `# Architecture — ${project.project.name}

${project.project.description}

> Seeded by \`repospec init\`. Replace the placeholders below with the real shape of
> this project, then keep it current as the project evolves.

## Overview

This is a **${project.project.type}**. Describe its purpose and the boundary of
what it owns in one or two paragraphs.

## Technology

${list('Languages', stack.languages)}${list('Runtimes', stack.runtimes)}${
    stack.packageManager
      ? `- **Package manager:** ${stack.packageManager}\n`
      : ''
  }${list('Frameworks', stack.frameworks)}${list('Testing', stack.testing)}

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
}

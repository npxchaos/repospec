import type { RepospecRepository } from '@repospec/protocol';

/**
 * Render the shared Markdown guide that most assistant adapters emit. It tells
 * an assistant that the repository follows the Repospec protocol and points it at
 * the source-of-truth artifacts, then summarizes the rules and agents.
 *
 * @param repo - The validated `.repospec/` repository.
 * @returns Markdown body (without a managed header).
 */
export function renderAssistantGuide(repo: RepospecRepository): string {
  const { project } = repo;
  // Sort by id so output is deterministic regardless of read/seed order.
  const agents = [...repo.agents].sort((a, b) =>
    a.meta.id.localeCompare(b.meta.id),
  );
  const rules = [...repo.rules].sort((a, b) =>
    a.meta.id.localeCompare(b.meta.id),
  );
  const lines: string[] = [];

  lines.push(`# ${project.project.name} — AI Assistant Guide`);
  lines.push('');
  lines.push(
    'This repository follows the [Repospec Protocol](https://github.com/npxchaos/repospec).',
  );
  lines.push(
    'The source of truth is the `.repospec/` directory; this file is generated from it.',
  );
  lines.push('');

  lines.push('## Project');
  lines.push('');
  lines.push(`- **Name:** ${project.project.name}`);
  lines.push(`- **Type:** ${project.project.type}`);
  lines.push(`- **Description:** ${project.project.description}`);
  lines.push(`- **Languages:** ${project.stack.languages.join(', ')}`);
  if (project.stack.frameworks?.length) {
    lines.push(`- **Frameworks:** ${project.stack.frameworks.join(', ')}`);
  }
  if (project.stack.packageManager) {
    lines.push(`- **Package manager:** ${project.stack.packageManager}`);
  }
  if (project.stack.testing?.length) {
    lines.push(`- **Testing:** ${project.stack.testing.join(', ')}`);
  }
  lines.push('');

  lines.push('## Before you change anything');
  lines.push('');
  lines.push('Read these source documents and follow them:');
  lines.push('');
  lines.push(
    `- \`.repospec/${project.documents.constitution}\` — principles that always hold`,
  );
  lines.push(
    `- \`.repospec/${project.documents.architecture}\` — how this project is structured`,
  );
  lines.push(
    `- \`.repospec/${project.documents.workflow}\` — how work flows to merge`,
  );
  lines.push('');

  if (rules.length > 0) {
    lines.push('## Rules');
    lines.push('');
    for (const rule of rules) {
      lines.push(
        `- **[${rule.meta.severity}]** ${rule.meta.title} — \`.repospec/${project.rules.dir}/${rule.meta.id}.md\``,
      );
    }
    lines.push('');
  }

  if (agents.length > 0) {
    lines.push('## Agents');
    lines.push('');
    for (const agent of agents) {
      lines.push(`- **${agent.meta.name}** — ${agent.meta.description}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

import type { Agent, Project, RepospecRepository } from '@repospec/protocol';
import type { Adapter, AdapterOutput } from './types.js';

/** Quote a value as a valid YAML double-quoted scalar. */
function yaml(value: string): string {
  return JSON.stringify(value);
}

/**
 * Claude Code requires a subagent `name` to be lowercase letters and hyphens
 * only. Slugify the role id so any id (e.g. `Reviewer`, `my_agent`) yields a
 * valid, loadable name and filename. Falls back to `agent` if nothing remains.
 */
export function subagentName(id: string): string {
  const slug = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'agent';
}

function bulletList(heading: string, items?: string[]): string {
  if (!items || items.length === 0) return '';
  return [`## ${heading}`, '', ...items.map((i) => `- ${i}`)].join('\n');
}

/**
 * Render one `.repospec/` role as a Claude Code subagent file: YAML frontmatter
 * (kept first so Claude Code can parse it) followed by a system prompt composed
 * from the role's description, responsibilities, boundaries, and body.
 */
export function renderSubagent(agent: Agent, project: Project): string {
  const { meta, body } = agent;

  const frontmatter = [
    '---',
    `name: ${yaml(subagentName(meta.id))}`,
    `description: ${yaml(meta.description)}`,
    ...(meta.model ? [`model: ${yaml(meta.model)}`] : []),
    '---',
    '',
  ].join('\n');

  // Each block is self-contained; blank blocks (absent sections) drop out, and
  // blocks are joined with a blank line so headings render correctly.
  const footer =
    "Operate within this project's constitution, architecture, and rules. See" +
    ' `AGENTS.md` (or the `.repospec/` directory) for the full project context.';
  const sections = [
    `You are the **${meta.name}** for the ${project.project.name} project.\n\n${meta.description}`,
    bulletList('Responsibilities', meta.responsibilities),
    bulletList('Boundaries', meta.boundaries),
    bulletList('Capabilities', meta.capabilities),
    body.trim(),
    `---\n\n${footer}`,
  ]
    .filter((s) => s.trim() !== '')
    .join('\n\n');

  return `${frontmatter}\n${sections}\n`;
}

/**
 * Adapter that projects each `.repospec/agents/<id>.md` role into a native
 * Claude Code subagent at `.claude/agents/<id>.md`. This turns the roles you
 * define once into subagents Claude Code can invoke — and fan out in parallel.
 */
export const claudeAgentsAdapter: Adapter = {
  id: 'claude-agents',
  description:
    'Claude Code subagents — generates .claude/agents/<id>.md per role',
  render: (repo: RepospecRepository): AdapterOutput[] =>
    repo.agents.map((agent) => ({
      path: `.claude/agents/${subagentName(agent.meta.id)}.md`,
      body: renderSubagent(agent, repo.project),
    })),
};

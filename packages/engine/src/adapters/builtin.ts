import type { RepospecRepository } from '@repospec/protocol';
import type { Adapter } from './types.js';
import { renderAssistantGuide } from './markdown.js';
import { claudeAgentsAdapter } from './claude-agents.js';

/** Prepend a YAML frontmatter block (kept first by the managed-header wrapper). */
function withFrontmatter(lines: string[], body: string): string {
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

/** Adapter for Claude / Claude Code, emitting `CLAUDE.md`. */
export const claudeAdapter: Adapter = {
  id: 'claude',
  description: 'Claude / Claude Code — generates CLAUDE.md',
  render: (repo) => [{ path: 'CLAUDE.md', body: renderAssistantGuide(repo) }],
};

/** Adapter for the cross-tool `AGENTS.md` convention. */
export const agentsAdapter: Adapter = {
  id: 'agents',
  description: 'Cross-tool AGENTS.md convention — generates AGENTS.md',
  render: (repo) => [{ path: 'AGENTS.md', body: renderAssistantGuide(repo) }],
};

/** Adapter for GitHub Copilot, emitting `.github/copilot-instructions.md`. */
export const copilotAdapter: Adapter = {
  id: 'copilot',
  description: 'GitHub Copilot — generates .github/copilot-instructions.md',
  render: (repo) => [
    {
      path: '.github/copilot-instructions.md',
      body: renderAssistantGuide(repo),
    },
  ],
};

/**
 * Adapter for Cursor, emitting `.cursor/rules/repospec.mdc`. The `.mdc`
 * frontmatter is required for the rule to activate: `alwaysApply: true` loads
 * this project context in every request.
 */
export const cursorAdapter: Adapter = {
  id: 'cursor',
  description: 'Cursor — generates .cursor/rules/repospec.mdc',
  render: (repo: RepospecRepository) => [
    {
      path: '.cursor/rules/repospec.mdc',
      body: withFrontmatter(
        [
          `description: ${JSON.stringify(`Project constitution, architecture, and rules for ${repo.project.project.name}.`)}`,
          'alwaysApply: true',
        ],
        renderAssistantGuide(repo),
      ),
    },
  ],
};

/**
 * Adapter for Windsurf, emitting `.windsurf/rules/repospec.md`. The
 * `trigger: always_on` frontmatter is required for Cascade to include the rule
 * in every message; without it the rule defaults to manual (@-mention only).
 */
export const windsurfAdapter: Adapter = {
  id: 'windsurf',
  description: 'Windsurf — generates .windsurf/rules/repospec.md',
  render: (repo) => [
    {
      path: '.windsurf/rules/repospec.md',
      body: withFrontmatter(['trigger: always_on'], renderAssistantGuide(repo)),
    },
  ],
};

/** Adapter for the Gemini CLI, emitting `GEMINI.md`. */
export const geminiAdapter: Adapter = {
  id: 'gemini',
  description: 'Gemini CLI — generates GEMINI.md',
  render: (repo) => [{ path: 'GEMINI.md', body: renderAssistantGuide(repo) }],
};

/** Adapter for Zed, emitting the project `.rules` file it auto-includes. */
export const zedAdapter: Adapter = {
  id: 'zed',
  description: 'Zed — generates .rules',
  render: (repo) => [{ path: '.rules', body: renderAssistantGuide(repo) }],
};

/** Adapter for Cline, emitting `.clinerules/repospec.md` (merged with siblings). */
export const clineAdapter: Adapter = {
  id: 'cline',
  description: 'Cline — generates .clinerules/repospec.md',
  render: (repo) => [
    { path: '.clinerules/repospec.md', body: renderAssistantGuide(repo) },
  ],
};

/** Adapter for Continue, emitting `.continue/rules/repospec.md`. */
export const continueAdapter: Adapter = {
  id: 'continue',
  description: 'Continue — generates .continue/rules/repospec.md',
  render: (repo) => [
    { path: '.continue/rules/repospec.md', body: renderAssistantGuide(repo) },
  ],
};

export { claudeAgentsAdapter } from './claude-agents.js';

/** All adapters that ship with the engine. */
export const builtinAdapters: Adapter[] = [
  claudeAdapter,
  agentsAdapter,
  copilotAdapter,
  cursorAdapter,
  windsurfAdapter,
  geminiAdapter,
  zedAdapter,
  clineAdapter,
  continueAdapter,
  claudeAgentsAdapter,
];

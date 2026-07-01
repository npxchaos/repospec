import type { Adapter } from './types.js';
import { renderAssistantGuide } from './markdown.js';

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

/** Adapter for Cursor, emitting `.cursor/rules/repospec.mdc`. */
export const cursorAdapter: Adapter = {
  id: 'cursor',
  description: 'Cursor — generates .cursor/rules/repospec.mdc',
  render: (repo) => [
    { path: '.cursor/rules/repospec.mdc', body: renderAssistantGuide(repo) },
  ],
};

/** Adapter for Windsurf, emitting `.windsurf/rules/repospec.md`. */
export const windsurfAdapter: Adapter = {
  id: 'windsurf',
  description: 'Windsurf — generates .windsurf/rules/repospec.md',
  render: (repo) => [
    { path: '.windsurf/rules/repospec.md', body: renderAssistantGuide(repo) },
  ],
};

/** Adapter for the Gemini CLI, emitting `GEMINI.md`. */
export const geminiAdapter: Adapter = {
  id: 'gemini',
  description: 'Gemini CLI — generates GEMINI.md',
  render: (repo) => [{ path: 'GEMINI.md', body: renderAssistantGuide(repo) }],
};

/** All adapters that ship with the engine. */
export const builtinAdapters: Adapter[] = [
  claudeAdapter,
  agentsAdapter,
  copilotAdapter,
  cursorAdapter,
  windsurfAdapter,
  geminiAdapter,
];

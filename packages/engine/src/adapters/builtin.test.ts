import { describe, expect, it } from 'vitest';
import { buildProject } from '../project.js';
import {
  builtinAdapters,
  windsurfAdapter,
  geminiAdapter,
  zedAdapter,
  clineAdapter,
  continueAdapter,
  claudeAgentsAdapter,
} from './builtin.js';

const repo = {
  project: buildProject({
    name: 'demo',
    description: 'A demo.',
    type: 'service',
    languages: ['typescript'],
  }),
  agents: [],
  rules: [],
};

const repoWithAgents = {
  ...repo,
  agents: [
    {
      meta: {
        id: 'reviewer',
        name: 'Reviewer',
        description: 'Reviews changes for correctness and style.',
        responsibilities: ['Check tests', 'Flag risky changes'],
        boundaries: ['Never merge without approval'],
      },
      body: 'Be concise and specific.',
    },
  ],
};

describe('builtin adapters', () => {
  it('ships windsurf and gemini alongside the originals', () => {
    const ids = builtinAdapters.map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'claude',
        'agents',
        'copilot',
        'cursor',
        'windsurf',
        'gemini',
        'zed',
        'cline',
        'continue',
        'claude-agents',
      ]),
    );
  });

  it('windsurf renders .windsurf/rules/repospec.md', () => {
    const out = windsurfAdapter.render(repo);
    expect(out).toHaveLength(1);
    expect(out[0]?.path).toBe('.windsurf/rules/repospec.md');
    expect(out[0]?.body).toContain('# demo — AI Assistant Guide');
  });

  it('gemini renders GEMINI.md', () => {
    const out = geminiAdapter.render(repo);
    expect(out[0]?.path).toBe('GEMINI.md');
  });

  it('zed / cline / continue render their native paths', () => {
    expect(zedAdapter.render(repo)[0]?.path).toBe('.rules');
    expect(clineAdapter.render(repo)[0]?.path).toBe('.clinerules/repospec.md');
    expect(continueAdapter.render(repo)[0]?.path).toBe(
      '.continue/rules/repospec.md',
    );
  });

  it('claude-agents renders one subagent file per role', () => {
    expect(claudeAgentsAdapter.render(repo)).toHaveLength(0); // no agents
    const out = claudeAgentsAdapter.render(repoWithAgents);
    expect(out).toHaveLength(1);
    expect(out[0]?.path).toBe('.claude/agents/reviewer.md');
    const body = out[0]?.body ?? '';
    // Frontmatter must be first so Claude Code can parse it.
    expect(body.startsWith('---\n')).toBe(true);
    expect(body).toContain('name: "reviewer"');
    expect(body).toContain(
      'description: "Reviews changes for correctness and style."',
    );
    expect(body).toContain('## Responsibilities');
    expect(body).toContain('- Check tests');
    expect(body).toContain('## Boundaries');
    expect(body).toContain('Be concise and specific.');
  });
});

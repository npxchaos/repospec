import { describe, expect, it } from 'vitest';
import { buildProject } from '../project.js';
import { builtinAdapters, windsurfAdapter, geminiAdapter } from './builtin.js';

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
});

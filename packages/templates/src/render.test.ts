import { describe, expect, it } from 'vitest';
import { interpolate, partials } from './render.js';
import { architecture } from './content/architecture.js';

describe('interpolate', () => {
  it('substitutes dotted paths and ignores brace whitespace', () => {
    const out = interpolate('# {{ project.name }} ({{project.type}})', {
      project: { name: 'acme', type: 'service' },
    });
    expect(out).toBe('# acme (service)');
  });

  it('throws on a missing variable rather than emitting a blank', () => {
    expect(() => interpolate('{{ missing }}', {})).toThrow(/missing/);
    expect(() => interpolate('{{ a.b }}', { a: {} })).toThrow(/a\.b/);
  });
});

describe('seed content via interpolate', () => {
  it('renders architecture.md from the project with the seeded note', () => {
    const out = architecture({
      repospecProtocol: '0.1',
      project: {
        name: 'acme',
        description: 'A billing service.',
        type: 'service',
      },
      stack: { languages: ['typescript'], packageManager: 'pnpm' },
      conventions: {},
      documents: {
        constitution: 'constitution.md',
        architecture: 'architecture.md',
        workflow: 'workflow.md',
      },
      agents: { dir: 'agents' },
      rules: { dir: 'rules' },
      adapters: [],
      plugins: [],
    } as unknown as Parameters<typeof architecture>[0]);

    expect(out).toContain('# Architecture — acme');
    expect(out).toContain('This is a **service**');
    expect(out).toContain('- **Languages:** typescript');
    expect(out).toContain(partials.seededNote.split('\n')[0]);
  });
});

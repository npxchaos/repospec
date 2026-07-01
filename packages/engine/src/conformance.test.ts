import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  readRepospec,
  RepospecValidationError,
  supports,
} from '@repospec/protocol';
import { NodeFileSystem } from './fs/node.js';
import { MemoryFileSystem } from './fs/memory.js';

// Repo root, resolved from this file (packages/engine/src/ -> ../../..).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const EXAMPLES = ['demo-service', 'acme-billing'];

describe('conformance: shipped examples', () => {
  for (const name of EXAMPLES) {
    it(`${name} is a valid .repospec/ at a supported protocol version`, async () => {
      const fs = new NodeFileSystem();
      const repo = await readRepospec(
        fs,
        join(ROOT, 'examples', name, '.repospec'),
      );
      expect(repo.project.project.name).toBe(name);
      expect(supports(repo.project.repospecProtocol)).toBe(true);
      // Every declared adapter/document is structurally present.
      expect(repo.project.adapters.length).toBeGreaterThan(0);
    });
  }
});

describe('conformance: invalid inputs are rejected', () => {
  const VALID = [
    'repospecProtocol: "0.1"',
    'project:',
    '  name: x',
    '  description: A project.',
    '  type: service',
    'stack:',
    '  languages: [typescript]',
  ].join('\n');

  function readProject(projectYaml: string) {
    const fs = new MemoryFileSystem({
      '/r/.repospec/project.yaml': projectYaml,
    });
    return readRepospec(fs, '/r/.repospec');
  }

  it('accepts a minimal valid project.yaml', async () => {
    await expect(readProject(VALID)).resolves.toBeDefined();
  });

  it('rejects a missing required field (project.description)', async () => {
    const bad = VALID.replace('  description: A project.\n', '');
    await expect(readProject(bad)).rejects.toBeInstanceOf(
      RepospecValidationError,
    );
  });

  it('rejects an out-of-enum project type', async () => {
    const bad = VALID.replace('type: service', 'type: banana');
    await expect(readProject(bad)).rejects.toBeInstanceOf(
      RepospecValidationError,
    );
  });

  it('rejects an empty languages list', async () => {
    const bad = VALID.replace('languages: [typescript]', 'languages: []');
    await expect(readProject(bad)).rejects.toBeInstanceOf(
      RepospecValidationError,
    );
  });
});

describe('conformance: agent and rule artifacts', () => {
  const PROJECT = [
    'repospecProtocol: "0.1"',
    'project:',
    '  name: x',
    '  description: A project.',
    '  type: service',
    'stack:',
    '  languages: [typescript]',
  ].join('\n');

  function readWith(files: Record<string, string>) {
    return readRepospec(
      new MemoryFileSystem({ '/r/.repospec/project.yaml': PROJECT, ...files }),
      '/r/.repospec',
    );
  }

  it('parses valid agent and rule frontmatter', async () => {
    const repo = await readWith({
      '/r/.repospec/agents/reviewer.md':
        '---\nid: reviewer\nname: Reviewer\ndescription: Reviews diffs.\n---\nBody.',
      '/r/.repospec/rules/tests.md':
        '---\nid: tests\ntitle: Tests required\nseverity: error\n---\nBody.',
    });
    expect(repo.agents.map((a) => a.meta.id)).toContain('reviewer');
    expect(repo.rules.map((r) => r.meta.id)).toContain('tests');
  });

  it('rejects an agent missing a required field (name)', async () => {
    await expect(
      readWith({
        '/r/.repospec/agents/bad.md':
          '---\nid: bad\ndescription: No name.\n---\nBody.',
      }),
    ).rejects.toBeInstanceOf(RepospecValidationError);
  });

  it('rejects a rule with an out-of-enum severity', async () => {
    await expect(
      readWith({
        '/r/.repospec/rules/bad.md':
          '---\nid: bad\ntitle: Bad\nseverity: critical\n---\nBody.',
      }),
    ).rejects.toBeInstanceOf(RepospecValidationError);
  });
});

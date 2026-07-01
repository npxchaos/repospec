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

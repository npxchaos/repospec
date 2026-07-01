import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { serializePluginLock } from '@repospec/protocol';
import { NodeFileSystem } from '../fs/node.js';
import { init } from '../operations/init.js';
import { buildApprovalLock, runPlugins } from './host.js';

const fs = new NodeFileSystem();
let root: string;

const PLUGIN_ENTRY = `export default async ({ repo }) => ({
  outputs: [{ path: 'PLUGIN.md', body: 'project: ' + repo.project.project.name }],
});
`;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'repospec-plugin-'));
  await init(
    fs,
    {
      name: 'acme',
      description: 'A test project.',
      type: 'service',
      languages: ['typescript'],
      adapters: ['claude'],
    },
    { cwd: root },
  );
  // Declare a plugin in project.yaml.
  const projectPath = join(root, '.repospec', 'project.yaml');
  const yaml = await readFile(projectPath, 'utf8');
  await writeFile(
    projectPath,
    yaml.replace(/plugins:.*$/m, 'plugins:\n  - id: gen-extra\n'),
  );
  // Install the plugin under .repospec/plugins/gen-extra/.
  const dir = join(root, '.repospec', 'plugins', 'gen-extra');
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, 'repospec-plugin.yaml'),
    'id: gen-extra\nversion: "1.0.0"\ndescription: Generates PLUGIN.md.\ncapabilities: [generate-outputs]\nentry: index.mjs\n',
  );
  await writeFile(join(dir, 'index.mjs'), PLUGIN_ENTRY);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function approve(): Promise<void> {
  const { lock } = await buildApprovalLock(fs, root);
  await writeFile(
    join(root, '.repospec', 'plugins.lock'),
    serializePluginLock(lock),
  );
}

describe('plugin runtime', () => {
  it('does not run an unapproved plugin', async () => {
    const { outputs, warnings } = await runPlugins(fs, root);
    expect(outputs).toEqual([]);
    expect(warnings.join('\n')).toContain('not approved');
  });

  it('runs an approved plugin in a worker and collects its output', async () => {
    await approve();
    const { outputs, warnings } = await runPlugins(fs, root);
    expect(warnings).toEqual([]);
    expect(outputs).toEqual([{ path: 'PLUGIN.md', body: 'project: acme' }]);
  });

  it('refuses to run after the approved code changes (integrity mismatch)', async () => {
    await approve();
    // Tamper with the entry after approval.
    await writeFile(
      join(root, '.repospec', 'plugins', 'gen-extra', 'index.mjs'),
      `${PLUGIN_ENTRY}\n// changed\n`,
    );
    const { outputs, warnings } = await runPlugins(fs, root);
    expect(outputs).toEqual([]);
    expect(warnings.join('\n')).toContain('integrity mismatch');
  });
});

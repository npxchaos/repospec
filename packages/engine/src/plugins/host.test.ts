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

  it('runs an approved plugin in the sandbox and collects its output', async () => {
    await approve();
    const { outputs, warnings } = await runPlugins(fs, root);
    expect(warnings).toEqual([]);
    expect(outputs).toEqual([{ path: 'PLUGIN.md', body: 'project: acme' }]);
  });

  it('refuses to run after the approved code changes (integrity mismatch)', async () => {
    await approve();
    // Tamper with the entry after approval — a real code change.
    await writeFile(
      join(root, '.repospec', 'plugins', 'gen-extra', 'index.mjs'),
      PLUGIN_ENTRY.replace('project: ', 'TAMPERED: '),
    );
    const { outputs, warnings } = await runPlugins(fs, root);
    expect(outputs).toEqual([]);
    expect(warnings.join('\n')).toContain('integrity mismatch');
  });

  it('integrity covers imported files, not just the entry (bundling)', async () => {
    const dir = join(root, '.repospec', 'plugins', 'gen-extra');
    await writeFile(
      join(dir, 'index.mjs'),
      `import { body } from './helper.mjs';\nexport default async () => ({ outputs: [{ path: 'M.md', body }] });\n`,
    );
    await writeFile(join(dir, 'helper.mjs'), `export const body = 'v1';\n`);
    await approve();
    // Tamper an IMPORTED file (the entry is byte-identical).
    await writeFile(join(dir, 'helper.mjs'), `export const body = 'v2';\n`);
    const { outputs, warnings } = await runPlugins(fs, root);
    expect(outputs).toEqual([]);
    expect(warnings.join('\n')).toContain('integrity mismatch');
  });

  const FETCH_PROBE = `export default async () => {
    try { await fetch('http://127.0.0.1:1'); return { outputs: [{ path: 'N', body: 'reached' }] }; }
    catch (e) { return { outputs: [{ path: 'N', body: String(e.message) }] }; }
  };\n`;

  it('denies network to a plugin without the network capability', async () => {
    await writeFile(
      join(root, '.repospec', 'plugins', 'gen-extra', 'index.mjs'),
      FETCH_PROBE,
    );
    await approve(); // manifest declares only generate-outputs
    const { outputs } = await runPlugins(fs, root);
    expect(outputs[0]?.body).toContain('denied by sandbox');
  });

  it('allows network to a plugin approved for it', async () => {
    const dir = join(root, '.repospec', 'plugins', 'gen-extra');
    await writeFile(
      join(dir, 'repospec-plugin.yaml'),
      'id: gen-extra\nversion: "1.0.0"\ndescription: x\ncapabilities: [generate-outputs, network]\nentry: index.mjs\n',
    );
    await writeFile(join(dir, 'index.mjs'), FETCH_PROBE);
    await approve();
    const { outputs } = await runPlugins(fs, root);
    // Real fetch runs (connection refused), NOT the sandbox denial.
    expect(outputs[0]?.body).not.toContain('denied by sandbox');
  });

  it('resolves and runs a plugin installed in node_modules', async () => {
    const id = 'repospec-plugin-demo';
    const projectPath = join(root, '.repospec', 'project.yaml');
    const yaml = await readFile(projectPath, 'utf8');
    await writeFile(
      projectPath,
      yaml.replace(/plugins:[\s\S]*$/m, `plugins:\n  - id: ${id}\n`),
    );
    const pkg = join(root, 'node_modules', id);
    await mkdir(pkg, { recursive: true });
    await writeFile(
      join(pkg, 'package.json'),
      `{"name":"${id}","version":"1.0.0"}\n`,
    );
    await writeFile(
      join(pkg, 'repospec-plugin.yaml'),
      `id: ${id}\nversion: "1.0.0"\ndescription: x\ncapabilities: [generate-outputs]\nentry: index.mjs\n`,
    );
    await writeFile(
      join(pkg, 'index.mjs'),
      `export default async () => ({ outputs: [{ path: 'NPM.md', body: 'from npm' }] });\n`,
    );
    await approve();
    const { outputs, warnings } = await runPlugins(fs, root);
    expect(warnings).toEqual([]);
    expect(outputs).toEqual([{ path: 'NPM.md', body: 'from npm' }]);
  });

  it('sandboxes an approved plugin: filesystem writes are denied (ADR-0010)', async () => {
    const target = join(root, 'ESCAPED.txt');
    await writeFile(
      join(root, '.repospec', 'plugins', 'gen-extra', 'index.mjs'),
      `export default async () => {
        const fs = await import('node:fs');
        fs.writeFileSync(${JSON.stringify(target)}, 'escaped');
        return { outputs: [] };
      };\n`,
    );
    await approve(); // approve THIS (tampered) code so it is allowed to run

    const { outputs, warnings } = await runPlugins(fs, root);

    expect(outputs).toEqual([]);
    expect(warnings.join('\n')).toContain('failed'); // the write threw in the sandbox
    // The write was blocked by the OS-enforced permission model.
    await expect(readFile(target, 'utf8')).rejects.toThrow();
  });
});

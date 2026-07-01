import { describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../fs/memory.js';
import type { InitInput } from '../project.js';
import { init } from './init.js';
import { planUpgrade, upgrade, type Migration } from './upgrade.js';

const ROOT = '/repo';
const ANSWERS: InitInput = {
  name: 'acme',
  description: 'A test project.',
  type: 'application',
  languages: ['typescript'],
  adapters: ['claude'],
};

async function repoAtVersion(version: string): Promise<MemoryFileSystem> {
  const fs = new MemoryFileSystem();
  await init(fs, ANSWERS, { cwd: ROOT });
  if (version !== '0.1') {
    const path = `${ROOT}/.repospec/project.yaml`;
    const yaml = await fs.readFile(path);
    await fs.writeFile(
      path,
      yaml.replace(/repospecProtocol:.*/, `repospecProtocol: "${version}"`),
    );
  }
  return fs;
}

describe('planUpgrade', () => {
  it('reports current when already at the target version', async () => {
    const report = await planUpgrade(await repoAtVersion('0.1'), { cwd: ROOT });
    expect(report.status).toBe('current');
    expect(report.from).toBe('0.1');
  });

  it('refuses a repository declaring a newer protocol', async () => {
    const report = await planUpgrade(await repoAtVersion('0.2'), { cwd: ROOT });
    expect(report.status).toBe('ahead');
  });

  it('reports no path when older and no migration exists', async () => {
    const report = await planUpgrade(await repoAtVersion('0.0'), { cwd: ROOT });
    expect(report.status).toBe('no-path');
  });

  it('errors when there is no repository', async () => {
    const report = await planUpgrade(new MemoryFileSystem(), { cwd: ROOT });
    expect(report.status).toBe('no-repo');
    expect(report.root).toBeNull();
  });
});

describe('upgrade', () => {
  it('applies a migration chain and bumps the protocol version', async () => {
    const fs = await repoAtVersion('0.0');
    const migration: Migration = {
      from: '0.0',
      to: '0.1',
      description: 'test migration',
      migrate: (tree) => ({
        ...tree,
        'constitution.md': `${tree['constitution.md'] ?? ''}\nMigrated.\n`,
      }),
    };

    const { report, result } = await upgrade(fs, {
      cwd: ROOT,
      migrations: [migration],
    });

    expect(report.status).toBe('migratable');
    expect(result?.written).toContain('.repospec/project.yaml');
    expect(result?.written).toContain('.repospec/constitution.md');

    const yaml = await fs.readFile(`${ROOT}/.repospec/project.yaml`);
    expect(yaml).toContain('repospecProtocol: "0.1"');
    const constitution = await fs.readFile(`${ROOT}/.repospec/constitution.md`);
    expect(constitution).toContain('Migrated.');
  });
});

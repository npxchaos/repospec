import { describe, expect, it } from 'vitest';
import { readRepospec } from '@repospec/protocol';
import { MemoryFileSystem } from '../fs/memory.js';
import { parseManaged } from '../managed.js';
import type { InitInput } from '../project.js';
import { init } from './init.js';
import { generate } from './generate.js';
import { sync } from './sync.js';
import { doctor } from './doctor.js';

const ROOT = '/repo';

const ANSWERS: InitInput = {
  name: 'acme',
  description: 'A test project.',
  type: 'application',
  languages: ['typescript'],
  packageManager: 'pnpm',
  branching: 'github-flow',
  commitStyle: 'conventional',
  adapters: ['claude', 'agents'],
};

async function freshInit() {
  const fs = new MemoryFileSystem();
  const { plan, result } = await init(fs, ANSWERS, { cwd: ROOT });
  return { fs, plan, result };
}

describe('init', () => {
  it('writes a valid .repospec/ and adapter outputs', async () => {
    const { fs, result } = await freshInit();
    const paths = result.written;
    expect(paths).toContain('.repospec/project.yaml');
    expect(paths).toContain('.repospec/constitution.md');
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('AGENTS.md');

    // The generated repository is valid per the spec.
    const repo = await readRepospec(fs, `${ROOT}/.repospec`);
    expect(repo.project.project.name).toBe('acme');
    expect(repo.agents.map((a) => a.meta.id)).toContain('reviewer');
    expect(repo.rules.map((r) => r.meta.id)).toContain('tests-required');
  });

  it('marks generated outputs with a managed header', async () => {
    const { fs } = await freshInit();
    const claude = await fs.readFile(`${ROOT}/CLAUDE.md`);
    const managed = parseManaged(claude);
    expect(managed).not.toBeNull();
    expect(managed?.protocol).toBe('0.1');
  });

  it('is re-run safe: a second init overwrites nothing human-owned', async () => {
    const { fs } = await freshInit();
    const { result } = await init(fs, ANSWERS, { cwd: ROOT });
    expect(result.written).not.toContain('.repospec/project.yaml');
    expect(result.skipped.map((s) => s.path)).toContain(
      '.repospec/project.yaml',
    );
  });
});

describe('sync', () => {
  it('is idempotent immediately after init', async () => {
    const { fs } = await freshInit();
    const { result, drift } = await sync(fs, { cwd: ROOT });
    expect(drift).toBe(false);
    expect(result?.written).toEqual([]);
  });

  it('regenerates outputs after a .repospec change', async () => {
    const { fs } = await freshInit();
    // Change the source of truth.
    const yaml = await fs.readFile(`${ROOT}/.repospec/project.yaml`);
    await fs.writeFile(
      `${ROOT}/.repospec/project.yaml`,
      yaml.replace('name: acme', 'name: renamed'),
    );
    const { drift, changes } = await sync(fs, { cwd: ROOT });
    expect(drift).toBe(true);
    expect(changes.map((c) => c.path)).toContain('CLAUDE.md');
    const claude = await fs.readFile(`${ROOT}/CLAUDE.md`);
    expect(claude).toContain('renamed');
  });

  it('does not overwrite a hand-modified output without force', async () => {
    const { fs } = await freshInit();
    await fs.writeFile(`${ROOT}/CLAUDE.md`, 'I edited this by hand.');
    const { conflicts } = await sync(fs, { cwd: ROOT });
    expect(conflicts.map((c) => c.path)).toContain('CLAUDE.md');
    expect(await fs.readFile(`${ROOT}/CLAUDE.md`)).toBe(
      'I edited this by hand.',
    );

    // With force, it is regenerated.
    await sync(fs, { cwd: ROOT, force: true });
    expect(await fs.readFile(`${ROOT}/CLAUDE.md`)).toContain('acme');
  });

  it('check mode reports drift without writing', async () => {
    const { fs } = await freshInit();
    await fs.writeFile(
      `${ROOT}/.repospec/project.yaml`,
      (await fs.readFile(`${ROOT}/.repospec/project.yaml`)).replace(
        'acme',
        'changed',
      ),
    );
    const before = await fs.readFile(`${ROOT}/CLAUDE.md`);
    const { drift, result } = await sync(fs, { cwd: ROOT, check: true });
    expect(drift).toBe(true);
    expect(result).toBeUndefined();
    expect(await fs.readFile(`${ROOT}/CLAUDE.md`)).toBe(before);
  });
});

describe('generate', () => {
  it('writes only adapter outputs', async () => {
    const { fs } = await freshInit();
    // Force regeneration by editing source.
    await fs.writeFile(
      `${ROOT}/.repospec/project.yaml`,
      (await fs.readFile(`${ROOT}/.repospec/project.yaml`)).replace(
        'acme',
        'gen',
      ),
    );
    const { result } = await generate(fs, { cwd: ROOT });
    expect(result.written).toContain('CLAUDE.md');
    expect(result.written).not.toContain('.repospec/project.yaml');
  });
});

describe('doctor', () => {
  it('reports ok for a fresh, in-sync repository', async () => {
    const { fs } = await freshInit();
    const report = await doctor(fs, { cwd: ROOT });
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it('errors when there is no .repospec/', async () => {
    const fs = new MemoryFileSystem();
    const report = await doctor(fs, { cwd: ROOT });
    expect(report.ok).toBe(false);
    expect(report.root).toBeNull();
  });

  it('warns when outputs drift from source', async () => {
    const { fs } = await freshInit();
    await fs.writeFile(
      `${ROOT}/.repospec/project.yaml`,
      (await fs.readFile(`${ROOT}/.repospec/project.yaml`)).replace(
        'acme',
        'drifted',
      ),
    );
    const report = await doctor(fs, { cwd: ROOT });
    expect(report.issues.some((i) => i.message.includes('out of date'))).toBe(
      true,
    );
  });

  it('warns when the code drifts from the declared stack', async () => {
    const { fs } = await freshInit(); // declares typescript, no frameworks
    await fs.writeFile(
      `${ROOT}/package.json`,
      JSON.stringify({ name: 'acme', dependencies: { next: '^14' } }),
    );
    const report = await doctor(fs, { cwd: ROOT });
    const messages = report.issues.map((i) => i.message).join('\n');
    // A framework present in deps but absent from project.yaml is flagged...
    expect(messages).toContain('nextjs');
    // ...and drift is a warning, not an error.
    expect(report.ok).toBe(true);
  });

  it('strict mode fails on drift warnings (for CI gating)', async () => {
    const { fs } = await freshInit();
    await fs.writeFile(
      `${ROOT}/package.json`,
      JSON.stringify({ name: 'acme', dependencies: { next: '^14' } }),
    );
    expect((await doctor(fs, { cwd: ROOT })).ok).toBe(true);
    expect((await doctor(fs, { cwd: ROOT, strict: true })).ok).toBe(false);
  });

  it('warns on a duplicate declared plugin (validation, no execution)', async () => {
    const { fs } = await freshInit();
    const path = `${ROOT}/.repospec/project.yaml`;
    const yaml = await fs.readFile(path);
    await fs.writeFile(
      path,
      yaml.replace(/plugins:.*$/m, 'plugins:\n  - id: dup\n  - id: dup\n'),
    );
    const report = await doctor(fs, { cwd: ROOT });
    expect(
      report.issues.some((i) => i.message.includes('Duplicate plugin')),
    ).toBe(true);
  });
});

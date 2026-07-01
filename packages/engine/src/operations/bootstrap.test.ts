import { describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../fs/memory.js';
import type { LlmClient } from '../llm.js';
import { harvestProse, inferProjectInput, planBootstrap } from './bootstrap.js';

const ROOT = '/repo';

function seed(): MemoryFileSystem {
  return new MemoryFileSystem({
    '/repo/package.json': JSON.stringify({
      name: '@acme/widget',
      description: 'A widget service.',
      engines: { node: '>=20.10.0' },
      dependencies: { '@nestjs/core': '^10' },
      devDependencies: {
        vitest: '^3',
        prettier: '^3',
        eslint: '^9',
        typescript: '^5',
      },
    }),
    '/repo/pnpm-lock.yaml': 'lockfileVersion: 1',
    '/repo/tsconfig.json': '{}',
  });
}

describe('inferProjectInput', () => {
  it('infers answers from manifests, lockfiles, and deps', async () => {
    const { input, evidence } = await inferProjectInput(seed(), ROOT);
    expect(input.name).toBe('widget'); // scope stripped
    expect(input.description).toBe('A widget service.');
    expect(input.languages).toContain('typescript');
    expect(input.packageManager).toBe('pnpm');
    expect(input.runtimes).toContain('node20'); // from engines.node
    expect(input.frameworks).toContain('nestjs');
    expect(input.testing).toContain('vitest');
    expect(input.formatter).toBe('prettier');
    expect(input.linter).toBe('eslint');
    expect(input.type).toBe('service');
    expect(evidence.length).toBeGreaterThan(0);
  });

  it('falls back to the directory name and typescript with no manifest', async () => {
    const { input } = await inferProjectInput(new MemoryFileSystem(), ROOT);
    expect(input.name).toBe('repo');
    expect(input.languages).toEqual(['typescript']);
    expect(input.type).toBe('service');
  });
});

describe('planBootstrap', () => {
  it('plans a full draft .repospec/ plus adapter outputs', async () => {
    const plan = await planBootstrap(seed(), { cwd: ROOT });
    const paths = plan.writes.map((w) => w.path);
    expect(paths).toContain('.repospec/project.yaml');
    expect(paths).toContain('.repospec/constitution.md');
    expect(paths).toContain('AGENTS.md');
    expect(paths).toContain('CLAUDE.md');
    expect(plan.evidence.length).toBeGreaterThan(0);
    // Nothing is written by planning.
    expect(plan.writes.every((w) => w.action === 'create')).toBe(true);
  });

  it('seeds prose docs from existing repo docs (offline import)', async () => {
    const fs = seed();
    await fs.writeFile(
      '/repo/ARCHITECTURE.md',
      '# Widget architecture\n\nThe widget service owns billing.\n',
    );
    await fs.writeFile(
      '/repo/CONTRIBUTING.md',
      '# Contributing\n\nBranch from main; squash-merge.\n',
    );
    const plan = await planBootstrap(fs, { cwd: ROOT });

    const arch = plan.writes.find(
      (w) => w.path === '.repospec/architecture.md',
    )?.contents;
    expect(arch).toContain(
      'Imported by `repospec bootstrap` from `ARCHITECTURE.md`',
    );
    expect(arch).toContain('The widget service owns billing.');
    // The source's own H1 is stripped; our titled heading replaces it.
    expect(arch).toContain('# Architecture — widget');
    expect(arch).not.toContain('# Widget architecture');

    const workflow = plan.writes.find(
      (w) => w.path === '.repospec/workflow.md',
    )?.contents;
    expect(workflow).toContain('Branch from main; squash-merge.');

    expect(plan.evidence).toContain(
      'architecture.md seeded from ARCHITECTURE.md',
    );
  });

  it('leaves prose docs as templates when import is disabled', async () => {
    const fs = seed();
    await fs.writeFile('/repo/ARCHITECTURE.md', '# A\n\nreal content\n');
    const plan = await planBootstrap(fs, { cwd: ROOT, importDocs: false });
    const arch = plan.writes.find(
      (w) => w.path === '.repospec/architecture.md',
    )?.contents;
    expect(arch).not.toContain('real content');
    expect(arch).not.toContain('Imported by');
  });

  it('harvestProse ignores empty source docs', async () => {
    const fs = seed();
    await fs.writeFile('/repo/ARCHITECTURE.md', '# Only a title\n');
    const { input } = await inferProjectInput(fs, ROOT);
    const { overrides } = await harvestProse(fs, ROOT, input);
    expect(overrides['architecture.md']).toBeUndefined();
  });

  it('refines the description via an opt-in LlmClient (metadata only)', async () => {
    const calls: string[] = [];
    const llm: LlmClient = {
      async complete({ prompt }) {
        calls.push(prompt);
        return 'A refined widget service for metered billing.';
      },
    };
    const plan = await planBootstrap(seed(), { cwd: ROOT, llm });

    const projectYaml = plan.writes.find(
      (w) => w.path === '.repospec/project.yaml',
    )?.contents;
    expect(projectYaml).toContain(
      'A refined widget service for metered billing.',
    );
    expect(plan.evidence).toContain('description refined by AI (opt-in)');
    // Only detected metadata is sent — never file contents.
    expect(calls[0]).toContain('Detected facts:');
  });
});

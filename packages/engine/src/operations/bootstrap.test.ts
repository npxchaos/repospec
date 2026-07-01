import { describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../fs/memory.js';
import type { LlmClient } from '../llm.js';
import { inferProjectInput, planBootstrap } from './bootstrap.js';

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

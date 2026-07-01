import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// End-to-end tests that run the BUILT binary (dist/bin.js) as a subprocess in
// throwaway directories. This is the layer that catches bundling / dist-wiring
// breakage the in-process unit tests can't see (e.g. a workspace dependency
// that isn't externalized correctly).

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const bin = join(here, '..', 'dist', 'bin.js');

/** Run the CLI in `cwd`. Returns exit status + captured output. */
function cli(cwd: string, args: string[]) {
  const r = spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

let dir: string;

beforeAll(() => {
  // The e2e tests exercise the built artifact; build it if it's missing so
  // `pnpm test` works from a clean checkout.
  if (!existsSync(bin)) {
    execFileSync('pnpm', ['-r', 'build'], { cwd: repoRoot, stdio: 'inherit' });
  }
}, 180_000);

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('cli e2e (built binary)', () => {
  it('reports its version', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'repospec-e2e-v-'));
    try {
      const r = cli(scratch, ['--version']);
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/\d+\.\d+\.\d+/);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it('init → sync --check → doctor, then detects hand-edit drift', () => {
    dir = mkdtempSync(join(tmpdir(), 'repospec-e2e-'));

    const init = cli(dir, [
      'init',
      '--yes',
      '--name',
      'e2e-app',
      '--type',
      'service',
      '--languages',
      'typescript',
      '--adapters',
      'claude,agents,cursor,claude-agents',
    ]);
    expect(init.status).toBe(0);

    // Human-owned source of truth.
    expect(existsSync(join(dir, '.repospec/project.yaml'))).toBe(true);
    expect(existsSync(join(dir, '.repospec/architecture.md'))).toBe(true);

    // Generated entrypoints.
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(true);

    // Cursor rule carries activation frontmatter on line 1.
    const mdc = readFileSync(join(dir, '.cursor/rules/repospec.mdc'), 'utf8');
    expect(mdc.startsWith('---\n')).toBe(true);
    expect(mdc).toContain('alwaysApply: true');

    // Seeded roles projected into native Claude Code subagents.
    const reviewer = join(dir, '.claude/agents/reviewer.md');
    expect(existsSync(reviewer)).toBe(true);
    expect(readFileSync(reviewer, 'utf8').startsWith('---\nname:')).toBe(true);

    // Freshly generated → in sync, and valid.
    expect(cli(dir, ['sync', '--check']).status).toBe(0);
    expect(cli(dir, ['doctor']).status).toBe(0);

    // Hand-edit a generated file → drift check must fail (ownership guard).
    const claude = join(dir, 'CLAUDE.md');
    writeFileSync(
      claude,
      readFileSync(claude, 'utf8') + '\n<!-- hand edit -->\n',
    );
    expect(cli(dir, ['sync', '--check']).status).not.toBe(0);
  });

  it('bootstrap imports an existing ARCHITECTURE.md offline', () => {
    const proj = mkdtempSync(join(tmpdir(), 'repospec-e2e-boot-'));
    try {
      writeFileSync(
        join(proj, 'package.json'),
        JSON.stringify({ name: 'boot-app', dependencies: {} }),
      );
      writeFileSync(
        join(proj, 'ARCHITECTURE.md'),
        '# Boot architecture\n\nThe service owns billing and invoicing.\n',
      );

      const r = cli(proj, ['bootstrap', '--yes']);
      expect(r.status).toBe(0);

      const arch = readFileSync(
        join(proj, '.repospec/architecture.md'),
        'utf8',
      );
      expect(arch).toContain('Imported by `repospec bootstrap`');
      expect(arch).toContain('The service owns billing and invoicing.');
    } finally {
      rmSync(proj, { recursive: true, force: true });
    }
  });
});

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  REPOSPEC_DIR,
  readRepospec,
  parsePluginManifest,
  parsePluginLock,
  type RepospecFileSystem,
  type PluginLock,
  type PluginLockEntry,
  type PluginManifest,
} from '@repospec/protocol';
import { integrityOf } from './integrity.js';

/** The capability enum type, reused for resolved plugins. */
type Capability = PluginManifest['capabilities'][number];

/**
 * Locate a declared plugin's directory: a local `.repospec/plugins/<id>/` first,
 * then an installed npm package `<id>` that ships a `repospec-plugin.yaml`
 * (resolved engine-side; the sandboxed child still receives only the source).
 * Returns `null` if neither has a manifest.
 */
async function locatePluginDir(
  fs: RepospecFileSystem,
  repospecDir: string,
  root: string,
  id: string,
): Promise<string | null> {
  const local = join(repospecDir, 'plugins', id);
  if (await fs.exists(join(local, 'repospec-plugin.yaml'))) return local;
  try {
    const require = createRequire(join(root, 'noop.js'));
    const pkgDir = dirname(require.resolve(`${id}/package.json`));
    if (await fs.exists(join(pkgDir, 'repospec-plugin.yaml'))) return pkgDir;
  } catch {
    // not an installed npm package — fall through
  }
  return null;
}

/** A file a plugin wants generated (same shape as an adapter output). */
export interface PluginOutput {
  path: string;
  body: string;
}

/** The result of running a repository's approved plugins. */
export interface PluginRunResult {
  /** Generated outputs from approved `generate-outputs` plugins. */
  outputs: PluginOutput[];
  /** Human-readable notes for every plugin that was skipped or failed. */
  warnings: string[];
}

/** A resolved declared plugin, for listing/approval. */
export interface ResolvedPlugin {
  id: string;
  version: string;
  capabilities: Capability[];
  integrity: string;
  /** `true` if an approval entry with a matching integrity exists. */
  approved: boolean;
}

/**
 * Resolve every declared plugin against its manifest, computing the integrity of
 * its entry and whether the lockfile currently approves that exact code. Does
 * not execute anything — used by `repospec plugins list`/`approve` and `doctor`.
 *
 * @param fs - The repository filesystem.
 * @param root - The repository root.
 * @returns The resolved plugins and warnings for unresolvable references.
 */
export async function resolvePlugins(
  fs: RepospecFileSystem,
  root: string,
): Promise<{ plugins: ResolvedPlugin[]; warnings: string[] }> {
  const repospecDir = join(root, REPOSPEC_DIR);
  const repo = await readRepospec(fs, repospecDir);
  const plugins: ResolvedPlugin[] = [];
  const warnings: string[] = [];

  let lock: PluginLock = { approved: [] };
  const lockPath = join(repospecDir, 'plugins.lock');
  if (await fs.exists(lockPath)) {
    lock = parsePluginLock(await fs.readFile(lockPath));
  }

  for (const ref of repo.project.plugins) {
    const dir = await locatePluginDir(fs, repospecDir, root, ref.id);
    if (!dir) {
      warnings.push(
        `Plugin "${ref.id}": no manifest (looked in .repospec/plugins/${ref.id}/ and node_modules).`,
      );
      continue;
    }
    const manifest = parsePluginManifest(
      await fs.readFile(join(dir, 'repospec-plugin.yaml')),
    );
    const entryPath = join(dir, manifest.entry);
    if (!(await fs.exists(entryPath))) {
      warnings.push(`Plugin "${ref.id}": entry "${manifest.entry}" missing.`);
      continue;
    }
    const integrity = integrityOf(await fs.readFile(entryPath));
    const approval = lock.approved.find((a) => a.id === ref.id);
    plugins.push({
      id: manifest.id,
      version: manifest.version,
      capabilities: manifest.capabilities,
      integrity,
      approved: approval?.integrity === integrity,
    });
  }

  return { plugins, warnings };
}

/**
 * Build an approval lockfile that approves every resolvable declared plugin at
 * its current integrity and declared capabilities. The caller writes it only
 * after operator consent (ADR-0008).
 *
 * @param fs - The repository filesystem.
 * @param root - The repository root.
 * @returns The lockfile to write and warnings for unresolvable plugins.
 */
export async function buildApprovalLock(
  fs: RepospecFileSystem,
  root: string,
): Promise<{ lock: PluginLock; warnings: string[] }> {
  const { plugins, warnings } = await resolvePlugins(fs, root);
  const approved: PluginLockEntry[] = plugins.map((p) => ({
    id: p.id,
    version: p.version,
    integrity: p.integrity,
    capabilities: p.capabilities,
  }));
  return { lock: { approved }, warnings };
}

// ESM runner, evaluated in a child `node` process under the Permission Model
// (ADR-0010). It reads {source, repo, capabilities} as JSON on stdin, imports the
// plugin as a data: URL (so the child needs NO filesystem access at all), and
// writes {outputs} | {error} as JSON on stdout. The child is spawned with env:{}
// and `--permission` with no --allow-* grants: no fs read/write, no child
// process, no worker, no addons. A plugin cannot touch the disk or spawn
// anything — the engine reads the source and owns all writes.
const RUNNER = `
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { data += c; });
process.stdin.on('end', async () => {
  try {
    const { source, repo, capabilities } = JSON.parse(data);
    if (!Array.isArray(capabilities) || !capabilities.includes('network')) {
      const deny = () => { throw new Error('network access denied by sandbox (network capability not approved)'); };
      globalThis.fetch = deny;
      globalThis.WebSocket = deny;
    }
    const url = 'data:text/javascript,' + encodeURIComponent(source);
    const mod = await import(url);
    const fn = mod && mod.default;
    if (typeof fn !== 'function') {
      process.stdout.write(JSON.stringify({ error: 'plugin has no default export function' }));
      return;
    }
    const result = await fn({ repo, capabilities });
    const outputs = Array.isArray(result && result.outputs) ? result.outputs : [];
    process.stdout.write(JSON.stringify({ outputs }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: String((e && e.message) || e) }));
  }
});
`;

interface WorkerResult {
  outputs?: unknown;
  error?: string;
}

function runInSubprocess(
  source: string,
  repo: unknown,
  capabilities: string[],
): Promise<WorkerResult> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        '--permission', // deny-by-default: no fs (read/write), child_process, worker, addons
        '--input-type=module',
        '-e',
        RUNNER,
      ],
      { env: {}, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ error: 'plugin timed out' });
    }, 10_000);

    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stderr.on('data', (d) => {
      err += d;
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ error: e.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const trimmed = out.trim();
      if (trimmed) {
        try {
          resolve(JSON.parse(trimmed) as WorkerResult);
          return;
        } catch {
          // fall through to error
        }
      }
      resolve({ error: err.trim() || `plugin exited with code ${code}` });
    });

    child.stdin.write(JSON.stringify({ source, repo, capabilities }));
    child.stdin.end();
  });
}

/**
 * Run a repository's approved plugins and collect their generated outputs.
 *
 * Enforces the trust model (ADR-0008/0009): a plugin runs only if it is
 * approved in `.repospec/plugins.lock` with a matching integrity hash and the
 * `generate-outputs` capability both declared and approved. Execution happens in
 * a worker with no ambient environment. Everything else is skipped with a
 * warning — never run.
 *
 * @param fs - The repository filesystem.
 * @param root - The repository root.
 * @returns The collected outputs and warnings for anything skipped.
 */
export async function runPlugins(
  fs: RepospecFileSystem,
  root: string,
): Promise<PluginRunResult> {
  const repospecDir = join(root, REPOSPEC_DIR);
  const repo = await readRepospec(fs, repospecDir);
  const outputs: PluginOutput[] = [];
  const warnings: string[] = [];

  let lock: PluginLock = { approved: [] };
  const lockPath = join(repospecDir, 'plugins.lock');
  if (await fs.exists(lockPath)) {
    lock = parsePluginLock(await fs.readFile(lockPath));
  }

  for (const ref of repo.project.plugins) {
    const dir = await locatePluginDir(fs, repospecDir, root, ref.id);
    if (!dir) {
      warnings.push(
        `Plugin "${ref.id}": no manifest (looked in .repospec/plugins/${ref.id}/ and node_modules). Skipped.`,
      );
      continue;
    }
    const manifest = parsePluginManifest(
      await fs.readFile(join(dir, 'repospec-plugin.yaml')),
    );
    const entryPath = join(dir, manifest.entry);
    if (!(await fs.exists(entryPath))) {
      warnings.push(
        `Plugin "${ref.id}": entry "${manifest.entry}" missing. Skipped.`,
      );
      continue;
    }
    const source = await fs.readFile(entryPath);
    const integrity = integrityOf(source);

    const approval = lock.approved.find((a) => a.id === ref.id);
    if (!approval) {
      warnings.push(
        `Plugin "${ref.id}" is not approved — run \`repospec plugins approve\`. Skipped.`,
      );
      continue;
    }
    if (approval.integrity !== integrity) {
      warnings.push(
        `Plugin "${ref.id}" integrity mismatch — not the approved code. Skipped.`,
      );
      continue;
    }
    if (
      !manifest.capabilities.includes('generate-outputs') ||
      !approval.capabilities.includes('generate-outputs')
    ) {
      warnings.push(
        `Plugin "${ref.id}": the generate-outputs capability is not both declared and approved. Skipped.`,
      );
      continue;
    }

    const result = await runInSubprocess(source, repo, approval.capabilities);
    if (result.error) {
      warnings.push(`Plugin "${ref.id}" failed: ${result.error}`);
      continue;
    }
    const list = Array.isArray(result.outputs) ? result.outputs : [];
    for (const item of list) {
      if (
        item &&
        typeof (item as PluginOutput).path === 'string' &&
        typeof (item as PluginOutput).body === 'string'
      ) {
        outputs.push({
          path: (item as PluginOutput).path,
          body: (item as PluginOutput).body,
        });
      }
    }
  }

  return { outputs, warnings };
}

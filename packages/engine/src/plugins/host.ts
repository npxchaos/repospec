import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
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

/** The capability enum type, reused for resolved plugins. */
type Capability = PluginManifest['capabilities'][number];
import { integrityOf } from './integrity.js';

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
    const dir = join(repospecDir, 'plugins', ref.id);
    const manifestPath = join(dir, 'repospec-plugin.yaml');
    if (!(await fs.exists(manifestPath))) {
      warnings.push(
        `Plugin "${ref.id}": no manifest at .repospec/plugins/${ref.id}/.`,
      );
      continue;
    }
    const manifest = parsePluginManifest(await fs.readFile(manifestPath));
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

// CommonJS worker body (eval workers run as CJS): no ambient env is passed
// (`env: {}` on the Worker), and the plugin receives only a read-only repo
// snapshot and its approved capability list over workerData. See ADR-0009.
const WORKER_CODE = `
const { workerData, parentPort } = require('node:worker_threads');
const { pathToFileURL } = require('node:url');
(async () => {
  try {
    const mod = await import(pathToFileURL(workerData.entry).href);
    const fn = mod && mod.default;
    if (typeof fn !== 'function') {
      parentPort.postMessage({ error: 'plugin has no default export function' });
      return;
    }
    const result = await fn({
      repo: workerData.repo,
      capabilities: workerData.capabilities,
    });
    const outputs = Array.isArray(result && result.outputs) ? result.outputs : [];
    parentPort.postMessage({ outputs });
  } catch (e) {
    parentPort.postMessage({ error: String((e && e.message) || e) });
  }
})();
`;

interface WorkerResult {
  outputs?: unknown;
  error?: string;
}

function runInWorker(
  entry: string,
  repo: unknown,
  capabilities: string[],
): Promise<WorkerResult> {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_CODE, {
      eval: true,
      env: {}, // no ambient environment for the plugin
      workerData: { entry, repo, capabilities },
      resourceLimits: { maxOldGenerationSizeMb: 128 },
    });
    const timer = setTimeout(() => {
      void worker.terminate();
      resolve({ error: 'plugin timed out' });
    }, 10_000);
    worker.once('message', (message: WorkerResult) => {
      clearTimeout(timer);
      void worker.terminate();
      resolve(message);
    });
    worker.once('error', (err) => {
      clearTimeout(timer);
      resolve({ error: err.message });
    });
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
    const dir = join(repospecDir, 'plugins', ref.id);
    const manifestPath = join(dir, 'repospec-plugin.yaml');
    if (!(await fs.exists(manifestPath))) {
      warnings.push(
        `Plugin "${ref.id}": no manifest at .repospec/plugins/${ref.id}/. Skipped.`,
      );
      continue;
    }
    const manifest = parsePluginManifest(await fs.readFile(manifestPath));
    const entryPath = join(dir, manifest.entry);
    if (!(await fs.exists(entryPath))) {
      warnings.push(
        `Plugin "${ref.id}": entry "${manifest.entry}" missing. Skipped.`,
      );
      continue;
    }
    const integrity = integrityOf(await fs.readFile(entryPath));

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

    const result = await runInWorker(entryPath, repo, approval.capabilities);
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

import { join } from 'node:path';
import {
  REPOSPEC_DIR,
  readRepospec,
  type RepospecFileSystem,
} from '@repospec/protocol';
import { planAdapterWrites } from '../render.js';
import type { AdapterRegistry } from '../adapters/registry.js';
import {
  applyPlan,
  type ApplyResult,
  type FilePlan,
  type PlannedWrite,
} from '../plan.js';
import { requireRepoRoot } from './locate-root.js';

/** Options for {@link sync}. */
export interface SyncOptions {
  /** Where to look for the repository. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Overwrite human-modified outputs. Default `false`. */
  force?: boolean;
  /** Report drift without writing anything. Default `false`. */
  check?: boolean;
  /** Adapter registry to use. Default: built-ins. */
  registry?: AdapterRegistry;
}

/** The outcome of a sync (or a `--check` dry run). */
export interface SyncResult {
  /** The full plan that was considered. */
  plan: FilePlan;
  /** The apply result, omitted in `check` mode. */
  result?: ApplyResult;
  /** Whether the outputs differ from the source of truth. */
  drift: boolean;
  /** Outputs that need writing. */
  changes: PlannedWrite[];
  /** Outputs skipped because a human modified them (need `--force`). */
  conflicts: PlannedWrite[];
}

function isConflict(write: PlannedWrite): boolean {
  return (
    write.action === 'skip' &&
    (write.reason === 'modified by hand' ||
      write.reason === 'exists and is not Repospec-managed')
  );
}

/**
 * Bring generated outputs into agreement with `.repospec/`. Idempotent: a second
 * run with no source change writes nothing. In `check` mode, nothing is
 * written and `drift` reflects whether a sync is needed (ADR-0004).
 *
 * @param fs - Target filesystem.
 * @param options - Sync options.
 * @returns The drift status, changes, conflicts, and (unless `check`) result.
 */
export async function sync(
  fs: RepospecFileSystem,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const cwd = options.cwd ?? process.cwd();
  const root = await requireRepoRoot(fs, cwd);
  const repo = await readRepospec(fs, join(root, REPOSPEC_DIR));
  const adapterPlan = await planAdapterWrites(fs, root, repo, {
    force: options.force,
    registry: options.registry,
  });
  const plan: FilePlan = {
    writes: adapterPlan.writes,
    warnings: adapterPlan.warnings,
  };

  const changes = plan.writes.filter((w) => w.action !== 'skip');
  const conflicts = plan.writes.filter(isConflict);
  const drift = changes.length > 0 || conflicts.length > 0;

  if (options.check) {
    return { plan, drift, changes, conflicts };
  }
  const result = await applyPlan(fs, plan);
  return { plan, result, drift, changes, conflicts };
}

import { join } from 'node:path';
import {
  PROTOCOL_VERSION,
  type RepospecFileSystem,
  type RepospecRepository,
} from '@repospec/protocol';
import type { AdapterRegistry } from './adapters/registry.js';
import { defaultRegistry } from './adapters/registry.js';
import { checksum, isModified, parseManaged, wrapManaged } from './managed.js';
import type { PlannedWrite } from './plan.js';

/** Options controlling how adapter outputs are planned. */
export interface RenderOptions {
  /** Overwrite human-modified or unmanaged outputs. Default `false`. */
  force?: boolean;
  /** Restrict to these adapter ids. Default: all enabled in `project.yaml`. */
  only?: string[];
  /** Adapter registry to resolve ids against. Default: built-ins. */
  registry?: AdapterRegistry;
  /**
   * Extra outputs from approved plugins (ADR-0009). Planned through the same
   * ownership/managed pipeline as adapter outputs.
   */
  pluginOutputs?: { path: string; body: string }[];
}

/** Planned adapter writes plus warnings for unknown adapter ids. */
export interface AdapterPlan {
  writes: PlannedWrite[];
  warnings: string[];
}

/**
 * Plan the generated outputs for a repository's enabled adapters, applying the
 * ownership model (ADR-0004): an unmanaged or hand-modified output is skipped
 * unless `force` is set.
 *
 * @param fs - The filesystem to inspect existing outputs on.
 * @param repoRoot - Absolute path to the repository root.
 * @param repo - The validated `.repospec/` repository.
 * @param options - Rendering options.
 * @returns The planned writes and any warnings.
 */
export async function planAdapterWrites(
  fs: RepospecFileSystem,
  repoRoot: string,
  repo: RepospecRepository,
  options: RenderOptions = {},
): Promise<AdapterPlan> {
  const registry = options.registry ?? defaultRegistry;
  const force = options.force ?? false;
  const enabled = repo.project.adapters.map((a) => a.id);
  const selected = options.only
    ? enabled.filter((id) => options.only?.includes(id))
    : enabled;

  const writes: PlannedWrite[] = [];
  const warnings: string[] = [];

  for (const id of selected) {
    const adapter = registry.get(id);
    if (!adapter) {
      warnings.push(`Unknown adapter "${id}" — skipped.`);
      continue;
    }
    for (const output of adapter.render(repo)) {
      writes.push(
        await planOutput(fs, repoRoot, output.path, output.body, force),
      );
    }
  }

  for (const output of options.pluginOutputs ?? []) {
    writes.push(
      await planOutput(fs, repoRoot, output.path, output.body, force),
    );
  }

  return { writes, warnings };
}

async function planOutput(
  fs: RepospecFileSystem,
  repoRoot: string,
  relPath: string,
  body: string,
  force: boolean,
): Promise<PlannedWrite> {
  const absPath = join(repoRoot, relPath);
  const contents = wrapManaged(body, PROTOCOL_VERSION);
  const base = { absPath, path: relPath, owner: 'repospec' as const, contents };

  if (!(await fs.exists(absPath))) {
    return { ...base, action: 'create' };
  }

  const existing = await fs.readFile(absPath);
  const managed = parseManaged(existing);

  if (!managed) {
    return force
      ? { ...base, action: 'overwrite', reason: 'forced over unmanaged file' }
      : {
          ...base,
          action: 'skip',
          reason: 'exists and is not Repospec-managed',
        };
  }
  if (isModified(managed)) {
    return force
      ? { ...base, action: 'overwrite', reason: 'forced over hand edits' }
      : { ...base, action: 'skip', reason: 'modified by hand' };
  }
  if (managed.checksum === checksum(body)) {
    return { ...base, action: 'skip', reason: 'up to date' };
  }
  return { ...base, action: 'overwrite', reason: 'out of date' };
}

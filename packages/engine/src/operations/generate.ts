import { join } from 'node:path';
import {
  REPOSPEC_DIR,
  readRepospec,
  type RepospecFileSystem,
} from '@repospec/protocol';
import { planAdapterWrites } from '../render.js';
import type { AdapterRegistry } from '../adapters/registry.js';
import { applyPlan, type ApplyResult, type FilePlan } from '../plan.js';
import { runPlugins } from '../plugins/host.js';
import { requireRepoRoot } from './locate-root.js';

/** Options for {@link generate}. */
export interface GenerateOptions {
  /** Where to look for the repository. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Overwrite human-modified outputs. Default `false`. */
  force?: boolean;
  /** Restrict generation to these adapter ids. */
  only?: string[];
  /** Adapter registry to use. Default: built-ins. */
  registry?: AdapterRegistry;
  /** Run approved plugins and include their outputs (opt-in; ADR-0009). */
  plugins?: boolean;
}

/**
 * Render the enabled adapter outputs from the current `.repospec/` and write them,
 * respecting the ownership model (ADR-0004). With `plugins`, approved plugin
 * outputs are included through the same pipeline.
 *
 * @param fs - Target filesystem.
 * @param options - Generate options.
 * @returns The plan and the apply result.
 */
export async function generate(
  fs: RepospecFileSystem,
  options: GenerateOptions = {},
): Promise<{ plan: FilePlan; result: ApplyResult }> {
  const cwd = options.cwd ?? process.cwd();
  const root = await requireRepoRoot(fs, cwd);
  const repo = await readRepospec(fs, join(root, REPOSPEC_DIR));

  let pluginOutputs: { path: string; body: string }[] | undefined;
  const pluginWarnings: string[] = [];
  if (options.plugins) {
    const run = await runPlugins(fs, root);
    pluginOutputs = run.outputs;
    pluginWarnings.push(...run.warnings);
  }

  const adapterPlan = await planAdapterWrites(fs, root, repo, {
    force: options.force,
    only: options.only,
    registry: options.registry,
    pluginOutputs,
  });
  const plan: FilePlan = {
    writes: adapterPlan.writes,
    warnings: [...adapterPlan.warnings, ...pluginWarnings],
  };
  const result = await applyPlan(fs, plan);
  return { plan, result };
}

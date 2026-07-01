import { join } from 'node:path';
import {
  REPOSPEC_DIR,
  parseAgent,
  parseRule,
  serializeProject,
  type RepospecFileSystem,
  type RepospecRepository,
  type Project,
} from '@repospec/protocol';
import { getSeedDocuments } from '@repospec/templates';
import { buildProject, type InitInput } from '../project.js';
import { planAdapterWrites } from '../render.js';
import type { AdapterRegistry } from '../adapters/registry.js';
import {
  applyPlan,
  type ApplyResult,
  type FilePlan,
  type PlannedWrite,
} from '../plan.js';

/** Options for {@link planInit} / {@link init}. */
export interface InitOptions {
  /** Repository root. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Overwrite existing human-owned files. Default `false`. */
  force?: boolean;
  /** Adapter registry to use. Default: built-ins. */
  registry?: AdapterRegistry;
  /**
   * Replace the contents of specific seed files, keyed by their path relative
   * to `.repospec/` (e.g. `architecture.md`). Used by `bootstrap` to seed prose
   * documents from a repository's existing docs instead of the generic
   * template. Unknown keys are ignored.
   */
  seedOverrides?: Record<string, string>;
}

/** A planned init: the file plan plus context about the target. */
export interface InitPlan extends FilePlan {
  /** The project that would be written. */
  project: Project;
  /** Whether a `.repospec/project.yaml` already existed. */
  existed: boolean;
}

async function planHumanFile(
  fs: RepospecFileSystem,
  repoRoot: string,
  relPath: string,
  contents: string,
  force: boolean,
): Promise<PlannedWrite> {
  const absPath = join(repoRoot, relPath);
  const base = { absPath, path: relPath, owner: 'human' as const, contents };
  if (!(await fs.exists(absPath))) return { ...base, action: 'create' };
  return force
    ? { ...base, action: 'overwrite', reason: 'forced' }
    : { ...base, action: 'skip', reason: 'exists (human-owned)' };
}

/**
 * Plan a `repospec init`: the human-owned `.repospec/` artifacts plus the generated
 * adapter outputs. Re-run safe — existing human files are skipped unless
 * `force` is set (ADR-0004).
 *
 * @param fs - Target filesystem.
 * @param input - Interview answers.
 * @param options - Init options.
 * @returns The full plan.
 */
export async function planInit(
  fs: RepospecFileSystem,
  input: InitInput,
  options: InitOptions = {},
): Promise<InitPlan> {
  const cwd = options.cwd ?? process.cwd();
  const force = options.force ?? false;
  const project = buildProject(input);
  const repospecDir = join(cwd, REPOSPEC_DIR);
  const existed = await fs.exists(join(repospecDir, 'project.yaml'));

  const writes: PlannedWrite[] = [];
  const warnings: string[] = [];

  writes.push(
    await planHumanFile(
      fs,
      cwd,
      join(REPOSPEC_DIR, 'project.yaml'),
      serializeProject(project),
      force,
    ),
  );

  const overrides = options.seedOverrides ?? {};
  const seeds = getSeedDocuments(project).map((seed) =>
    seed.path in overrides
      ? { ...seed, contents: overrides[seed.path] as string }
      : seed,
  );
  for (const seed of seeds) {
    writes.push(
      await planHumanFile(
        fs,
        cwd,
        join(REPOSPEC_DIR, seed.path),
        seed.contents,
        force,
      ),
    );
  }

  const repo: RepospecRepository = {
    project,
    agents: seeds
      .filter((s) => s.path.startsWith(`${project.agents.dir}/`))
      .map((s) => parseAgent(s.contents)),
    rules: seeds
      .filter((s) => s.path.startsWith(`${project.rules.dir}/`))
      .map((s) => parseRule(s.contents)),
  };

  const adapterPlan = await planAdapterWrites(fs, cwd, repo, {
    force,
    registry: options.registry,
  });
  writes.push(...adapterPlan.writes);
  warnings.push(...adapterPlan.warnings);

  return { writes, warnings, project, existed };
}

/**
 * Run a `repospec init`: plan, then apply.
 *
 * @param fs - Target filesystem.
 * @param input - Interview answers.
 * @param options - Init options.
 * @returns The plan and the apply result.
 */
export async function init(
  fs: RepospecFileSystem,
  input: InitInput,
  options: InitOptions = {},
): Promise<{ plan: InitPlan; result: ApplyResult }> {
  const plan = await planInit(fs, input, options);
  const result = await applyPlan(fs, plan);
  return { plan, result };
}

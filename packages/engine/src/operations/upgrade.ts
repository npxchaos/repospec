import { join } from 'node:path';
import {
  REPOSPEC_DIR,
  PROTOCOL_VERSION,
  compareProtocolVersions,
  parseProtocolVersion,
  type RepospecFileSystem,
} from '@repospec/protocol';
import { findRepoRoot } from '../locate.js';
import { applyPlan, type ApplyResult, type FilePlan } from '../plan.js';

/**
 * A migration transforms a conforming `.repospec/` at protocol `from` into one at
 * protocol `to` (`spec/versioning.md` §4). It is a pure function over the tree of
 * `.repospec/` files (relative path → contents); the engine handles reading,
 * writing, and bumping `repospecProtocol`.
 */
export interface Migration {
  from: string;
  to: string;
  description: string;
  migrate(tree: Record<string, string>): Record<string, string>;
}

/**
 * Built-in migrations, ordered oldest-first. Empty until a second protocol
 * version exists — `0.1` is the first, so there is nothing to migrate from yet.
 * Each future breaking version adds one entry here (RFC + ADR, per the spec).
 */
export const MIGRATIONS: readonly Migration[] = [];

/** What `planUpgrade` found. */
export type UpgradeStatus =
  | 'no-repo'
  | 'invalid-version'
  | 'current'
  | 'ahead'
  | 'migratable'
  | 'no-path';

/** The result of planning a `repospec upgrade`. */
export interface UpgradeReport {
  /** Repository root, or `null` if none was found. */
  root: string | null;
  /** The repository's current declared protocol version, if readable. */
  from: string | null;
  /** The version this implementation targets. */
  to: string;
  /** What was found. */
  status: UpgradeStatus;
  /** The migration chain that would run (empty unless `migratable`). */
  steps: Migration[];
  /** The planned writes (present only when `migratable`). */
  plan: FilePlan | null;
  /** A human-facing summary of the situation. */
  message: string;
}

/** Options for {@link planUpgrade} / {@link upgrade}. */
export interface UpgradeOptions {
  /** Where to start searching. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Migration set to use. Defaults to the built-ins (injectable for tests). */
  migrations?: readonly Migration[];
}

/** Read every file under a directory into a relative-path → contents map. */
async function readTree(
  fs: RepospecFileSystem,
  dir: string,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(rel: string): Promise<void> {
    const abs = rel ? join(dir, rel) : dir;
    for (const entry of await fs.readdir(abs)) {
      const childRel = rel ? `${rel}/${entry}` : entry;
      const childAbs = join(dir, childRel);
      try {
        out[childRel] = await fs.readFile(childAbs);
      } catch {
        // Not a file — treat as a directory and recurse.
        await walk(childRel);
      }
    }
  }
  await walk('');
  return out;
}

/** Rewrite the `repospecProtocol:` line of a project.yaml to a new version. */
function setProtocolVersion(projectYaml: string, version: string): string {
  return projectYaml.replace(/^(repospecProtocol:\s*).*$/m, `$1"${version}"`);
}

/** Extract `repospecProtocol` from raw project.yaml text without validating. */
function extractProtocolVersion(projectYaml: string): string | null {
  const match = /^repospecProtocol:\s*["']?([^"'\s]+)/m.exec(projectYaml);
  return match ? (match[1] ?? null) : null;
}

/** Find a chain of migrations from `from` to `to`, or `null` if none exists. */
function findMigrationPath(
  from: string,
  to: string,
  migrations: readonly Migration[],
): Migration[] | null {
  const steps: Migration[] = [];
  let current = from;
  // Bounded by the number of migrations to avoid cycles.
  for (let i = 0; i <= migrations.length && current !== to; i++) {
    const next = migrations.find((m) => m.from === current);
    if (!next) return null;
    steps.push(next);
    current = next.to;
  }
  return current === to ? steps : null;
}

/**
 * Plan a `repospec upgrade` (`spec/lifecycle.md` §2.5): read the repository's
 * declared protocol version, compare it to what this implementation targets, and
 * — if the repository is older and a migration chain exists — produce the writes
 * that would bring it current. Nothing is written.
 *
 * @param fs - The filesystem to inspect.
 * @param options - Upgrade options.
 * @returns A report describing the situation and any planned writes.
 */
export async function planUpgrade(
  fs: RepospecFileSystem,
  options: UpgradeOptions = {},
): Promise<UpgradeReport> {
  const cwd = options.cwd ?? process.cwd();
  const migrations = options.migrations ?? MIGRATIONS;
  const to = PROTOCOL_VERSION;
  const root = await findRepoRoot(fs, cwd);

  if (!root) {
    return {
      root: null,
      from: null,
      to,
      status: 'no-repo',
      steps: [],
      plan: null,
      message: 'No .repospec/ directory found. Run `repospec init`.',
    };
  }

  const repospecDir = join(root, REPOSPEC_DIR);
  const projectPath = join(repospecDir, 'project.yaml');
  const base = { root, to, steps: [] as Migration[], plan: null };

  if (!(await fs.exists(projectPath))) {
    return {
      ...base,
      from: null,
      status: 'invalid-version',
      message: 'No .repospec/project.yaml found.',
    };
  }

  const projectYaml = await fs.readFile(projectPath);
  const from = extractProtocolVersion(projectYaml);
  if (!from) {
    return {
      ...base,
      from: null,
      status: 'invalid-version',
      message: 'project.yaml does not declare a repospecProtocol version.',
    };
  }
  try {
    parseProtocolVersion(from);
  } catch {
    return {
      ...base,
      from,
      status: 'invalid-version',
      message: `Cannot parse protocol version "${from}".`,
    };
  }

  const cmp = compareProtocolVersions(from, to);
  if (cmp === 0) {
    return {
      ...base,
      from,
      status: 'current',
      message: `Already at the latest protocol version (${to}).`,
    };
  }
  if (cmp > 0) {
    return {
      ...base,
      from,
      status: 'ahead',
      message: `This repository declares protocol ${from}, newer than this tool supports (${to}). Upgrade @repospec/cli.`,
    };
  }

  const steps = findMigrationPath(from, to, migrations);
  if (!steps) {
    return {
      ...base,
      from,
      status: 'no-path',
      message: `No migration path from protocol ${from} to ${to} is available.`,
    };
  }

  const before = await readTree(fs, repospecDir);
  let tree: Record<string, string> = { ...before };
  for (const step of steps) tree = step.migrate(tree);
  if (tree['project.yaml']) {
    tree['project.yaml'] = setProtocolVersion(tree['project.yaml'], to);
  }

  const writes = Object.entries(tree)
    .filter(([rel, contents]) => before[rel] !== contents)
    .map(([rel, contents]) => ({
      absPath: join(repospecDir, rel),
      path: `${REPOSPEC_DIR}/${rel}`,
      owner: 'human' as const,
      contents,
      action: (before[rel] === undefined ? 'create' : 'overwrite') as
        'create' | 'overwrite',
      reason: `migrated to protocol ${to}`,
    }));

  return {
    ...base,
    from,
    status: 'migratable',
    steps,
    plan: { writes, warnings: [] },
    message: `Migrating protocol ${from} → ${to} (${steps.length} step${steps.length === 1 ? '' : 's'}).`,
  };
}

/**
 * Run a `repospec upgrade`: plan, then apply if a migration is available.
 *
 * @param fs - The filesystem to operate on.
 * @param options - Upgrade options.
 * @returns The report and, when a migration ran, the apply result.
 */
export async function upgrade(
  fs: RepospecFileSystem,
  options: UpgradeOptions = {},
): Promise<{ report: UpgradeReport; result: ApplyResult | null }> {
  const report = await planUpgrade(fs, options);
  if (report.status === 'migratable' && report.plan) {
    const result = await applyPlan(fs, report.plan);
    return { report, result };
  }
  return { report, result: null };
}

import { join } from 'node:path';
import {
  REPOSPEC_DIR,
  RepospecValidationError,
  PROTOCOL_VERSION,
  readRepospec,
  supports,
  type RepospecFileSystem,
} from '@repospec/protocol';
import { planAdapterWrites } from '../render.js';
import type { AdapterRegistry } from '../adapters/registry.js';
import { defaultRegistry } from '../adapters/registry.js';
import { findRepoRoot } from '../locate.js';
import { inferProjectInput } from './bootstrap.js';
import type { RepospecRepository } from '@repospec/protocol';

/** A single problem found by {@link doctor}. */
export interface DoctorIssue {
  level: 'error' | 'warning';
  message: string;
}

/** The result of a `repospec doctor` run. */
export interface DoctorReport {
  /** `true` if there are no error-level issues. */
  ok: boolean;
  /** The repository root, or `null` if none was found. */
  root: string | null;
  /** All issues found, errors and warnings. */
  issues: DoctorIssue[];
}

/** Options for {@link doctor}. */
export interface DoctorOptions {
  /** Where to start searching. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Adapter registry to use. Default: built-ins. */
  registry?: AdapterRegistry;
  /** Treat warnings as failures too, so CI can gate on them. Default false. */
  strict?: boolean;
}

const lc = (s: string): string => s.toLowerCase();

/**
 * Heuristic detection of drift between the code and its `.repospec/` description
 * (the `spec/` §10 open problem — a first cut). Only runs for repositories with
 * a package.json, where offline inference is reliable, and only emits warnings,
 * never errors, because the inference is necessarily incomplete.
 *
 * @param fs - The filesystem to inspect.
 * @param root - The repository root.
 * @param repo - The validated repository.
 * @param issues - The issue list to append warnings to.
 */
async function checkCodeDrift(
  fs: RepospecFileSystem,
  root: string,
  repo: RepospecRepository,
  issues: DoctorIssue[],
): Promise<void> {
  if (!(await fs.exists(join(root, 'package.json')))) return;

  const { input } = await inferProjectInput(fs, root);
  const declared = repo.project.stack;

  const declaredLangs = new Set(declared.languages.map(lc));
  const inferredLangs = new Set(input.languages.map(lc));
  for (const lang of declaredLangs) {
    if (!inferredLangs.has(lang)) {
      issues.push({
        level: 'warning',
        message: `project.yaml declares language "${lang}", but it was not detected in the repo.`,
      });
    }
  }
  for (const lang of inferredLangs) {
    if (!declaredLangs.has(lang)) {
      issues.push({
        level: 'warning',
        message: `Language "${lang}" is used in the repo but not declared in project.yaml.`,
      });
    }
  }

  if (
    input.packageManager &&
    declared.packageManager &&
    lc(input.packageManager) !== lc(declared.packageManager)
  ) {
    issues.push({
      level: 'warning',
      message: `project.yaml declares packageManager "${declared.packageManager}", but the repo uses "${input.packageManager}".`,
    });
  }

  const declaredRt = new Set((declared.runtimes ?? []).map(lc));
  const inferredRt = new Set((input.runtimes ?? []).map(lc));
  for (const rt of declaredRt) {
    if (!inferredRt.has(rt)) {
      issues.push({
        level: 'warning',
        message: `project.yaml declares runtime "${rt}", but the repo shows no sign of it.`,
      });
    }
  }
  for (const rt of inferredRt) {
    if (!declaredRt.has(rt)) {
      issues.push({
        level: 'warning',
        message: `Runtime "${rt}" is used by the repo but not declared in project.yaml.`,
      });
    }
  }

  const declaredFw = new Set((declared.frameworks ?? []).map(lc));
  const inferredFw = new Set((input.frameworks ?? []).map(lc));
  for (const fw of declaredFw) {
    if (!inferredFw.has(fw)) {
      issues.push({
        level: 'warning',
        message: `project.yaml declares framework "${fw}", but it is not in the dependencies.`,
      });
    }
  }
  for (const fw of inferredFw) {
    if (!declaredFw.has(fw)) {
      issues.push({
        level: 'warning',
        message: `Framework "${fw}" is in the dependencies but not declared in project.yaml.`,
      });
    }
  }

  const declaredTest = new Set((declared.testing ?? []).map(lc));
  const inferredTest = new Set((input.testing ?? []).map(lc));
  for (const t of declaredTest) {
    if (!inferredTest.has(t)) {
      issues.push({
        level: 'warning',
        message: `project.yaml declares testing tool "${t}", but it is not in the dependencies.`,
      });
    }
  }
  for (const t of inferredTest) {
    if (!declaredTest.has(t)) {
      issues.push({
        level: 'warning',
        message: `Testing tool "${t}" is in the dependencies but not declared in project.yaml.`,
      });
    }
  }
}

/** Compile a `*`/`**`/`?` glob to an anchored RegExp over posix paths. */
function globToRegExp(glob: string): RegExp {
  // Split on `**` (any path segments) so a single `*` stays within a segment.
  const body = glob
    .split('**')
    .map((seg) =>
      seg
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]'),
    )
    .join('.*');
  return new RegExp(`^${body}$`);
}

// Directories never worth walking when matching rule targets.
const WALK_IGNORE = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.repospec',
]);

/** List repository files (posix-relative), skipping heavy/generated dirs. */
async function walkRepoFiles(
  fs: RepospecFileSystem,
  root: string,
): Promise<string[]> {
  const out: string[] = [];
  async function walk(rel: string): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdir(rel ? join(root, rel) : root);
    } catch {
      return;
    }
    for (const name of entries) {
      if (WALK_IGNORE.has(name)) continue;
      const childRel = rel ? `${rel}/${name}` : name;
      try {
        await fs.readFile(join(root, childRel));
        out.push(childRel);
      } catch {
        await walk(childRel); // not a file → recurse as a directory
      }
    }
  }
  await walk('');
  return out;
}

/**
 * Detect code ⇄ rule drift: a rule whose `appliesTo` globs match no files in
 * the repository targets code that no longer exists. Only runs when at least one
 * rule declares `appliesTo`, so repositories that don't use it pay nothing.
 *
 * @param fs - The filesystem to inspect.
 * @param root - The repository root.
 * @param repo - The validated repository.
 * @param issues - The issue list to append warnings to.
 */
async function checkRuleTargets(
  fs: RepospecFileSystem,
  root: string,
  repo: RepospecRepository,
  issues: DoctorIssue[],
): Promise<void> {
  const ruled = repo.rules.filter((r) => (r.meta.appliesTo?.length ?? 0) > 0);
  if (ruled.length === 0) return;

  const files = await walkRepoFiles(fs, root);
  for (const rule of ruled) {
    const globs = rule.meta.appliesTo ?? [];
    const matched = globs.some((g) => {
      const re = globToRegExp(g);
      return files.some((f) => re.test(f));
    });
    if (!matched) {
      issues.push({
        level: 'warning',
        message: `Rule "${rule.meta.id}" applies to ${globs.join(', ')}, but no files match — it may target code that no longer exists.`,
      });
    }
  }
}

/**
 * Validate a repository's `.repospec/` and report problems with actionable
 * messages (see `spec/lifecycle.md` §2.4). Does not modify any files.
 *
 * @param fs - The filesystem to inspect.
 * @param options - Doctor options.
 * @returns A report; `ok` is false if any error-level issue was found.
 */
export async function doctor(
  fs: RepospecFileSystem,
  options: DoctorOptions = {},
): Promise<DoctorReport> {
  const cwd = options.cwd ?? process.cwd();
  const registry = options.registry ?? defaultRegistry;
  const strict = options.strict ?? false;
  const root = await findRepoRoot(fs, cwd);
  const issues: DoctorIssue[] = [];

  if (!root) {
    return {
      ok: false,
      root: null,
      issues: [
        {
          level: 'error',
          message: 'No .repospec/ directory found. Run `repospec init`.',
        },
      ],
    };
  }

  const repospecDir = join(root, REPOSPEC_DIR);

  let repo;
  try {
    repo = await readRepospec(fs, repospecDir);
  } catch (error) {
    if (error instanceof RepospecValidationError) {
      const messages = error.issues.length > 0 ? error.issues : [error.message];
      for (const message of messages) issues.push({ level: 'error', message });
      return { ok: false, root, issues };
    }
    throw error;
  }

  if (!supports(repo.project.repospecProtocol)) {
    issues.push({
      level: 'error',
      message: `Unsupported protocol version "${repo.project.repospecProtocol}" (this tool supports ${PROTOCOL_VERSION}). Try \`repospec upgrade\`.`,
    });
  }

  const docs: [string, string][] = [
    ['constitution', repo.project.documents.constitution],
    ['architecture', repo.project.documents.architecture],
    ['workflow', repo.project.documents.workflow],
  ];
  for (const [label, rel] of docs) {
    if (!(await fs.exists(join(repospecDir, rel)))) {
      issues.push({
        level: 'error',
        message: `Missing referenced ${label} document: .repospec/${rel}.`,
      });
    }
  }

  for (const adapter of repo.project.adapters) {
    if (!registry.has(adapter.id)) {
      issues.push({
        level: 'warning',
        message: `Unknown adapter "${adapter.id}" — it will be skipped.`,
      });
    }
  }

  // Plugins are declarative only — no code is executed (spec/configuration.md
  // §3.7). Validate their references without running anything.
  const seenPlugins = new Set<string>();
  for (const plugin of repo.project.plugins) {
    if (seenPlugins.has(plugin.id)) {
      issues.push({
        level: 'warning',
        message: `Duplicate plugin "${plugin.id}" declared in project.yaml.`,
      });
    }
    seenPlugins.add(plugin.id);
  }

  const adapterPlan = await planAdapterWrites(fs, root, repo, { registry });
  for (const write of adapterPlan.writes) {
    if (write.action !== 'skip') {
      issues.push({
        level: 'warning',
        message: `Adapter output ${write.path} is out of date — run \`repospec sync\`.`,
      });
    } else if (write.reason === 'modified by hand') {
      issues.push({
        level: 'warning',
        message: `Adapter output ${write.path} was modified by hand — \`repospec sync\` will not overwrite it without --force.`,
      });
    }
  }

  await checkCodeDrift(fs, root, repo, issues);
  await checkRuleTargets(fs, root, repo, issues);

  const hasError = issues.some((i) => i.level === 'error');
  const ok = strict ? issues.length === 0 : !hasError;
  return { ok, root, issues };
}

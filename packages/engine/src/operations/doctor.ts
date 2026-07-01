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

  return { ok: !issues.some((i) => i.level === 'error'), root, issues };
}

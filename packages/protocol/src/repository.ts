import { join } from 'node:path';
import { RepospecValidationError } from './errors.js';
import type { RepospecFileSystem } from './fs.js';
import {
  parseAgent,
  parseProject,
  parseRule,
  type Agent,
  type Rule,
} from './parse.js';
import type { Project } from './schemas.js';

/** The conventional name of the protocol directory. */
export const REPOSPEC_DIR = '.repospec';

/** A fully-read, validated `.repospec/` directory. */
export interface RepospecRepository {
  /** The validated root configuration. */
  project: Project;
  /** All agent artifacts, in directory order. */
  agents: Agent[];
  /** All rule artifacts, in directory order. */
  rules: Rule[];
}

async function readMarkdownDir<T>(
  fs: RepospecFileSystem,
  dir: string,
  parse: (text: string) => T,
  kind: string,
): Promise<T[]> {
  if (!(await fs.exists(dir))) return [];
  const names = (await fs.readdir(dir)).filter((n) => n.endsWith('.md')).sort();
  const out: T[] = [];
  for (const name of names) {
    const text = await fs.readFile(join(dir, name));
    try {
      out.push(parse(text));
    } catch (error) {
      if (error instanceof RepospecValidationError) {
        throw new RepospecValidationError(
          `${kind} "${name}" is invalid:`,
          error.issues.length > 0 ? error.issues : [error.message],
        );
      }
      throw error;
    }
  }
  return out;
}

function assertUniqueIds(ids: string[], kind: string): void {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) {
    throw new RepospecValidationError(`Duplicate ${kind} id(s):`, [...dupes]);
  }
}

/**
 * Read and validate a `.repospec/` directory from a filesystem.
 *
 * @param fs - The filesystem port to read through.
 * @param repospecDir - Absolute path to the `.repospec/` directory.
 * @returns The validated repository model.
 * @throws {RepospecValidationError} If any artifact is missing or invalid.
 */
export async function readRepospec(
  fs: RepospecFileSystem,
  repospecDir: string,
): Promise<RepospecRepository> {
  const projectPath = join(repospecDir, 'project.yaml');
  if (!(await fs.exists(projectPath))) {
    throw new RepospecValidationError('Missing .repospec/project.yaml.', []);
  }
  const project = parseProject(await fs.readFile(projectPath));

  const agents = await readMarkdownDir(
    fs,
    join(repospecDir, project.agents.dir),
    parseAgent,
    'agent',
  );
  const rules = await readMarkdownDir(
    fs,
    join(repospecDir, project.rules.dir),
    parseRule,
    'rule',
  );

  assertUniqueIds(
    agents.map((a) => a.meta.id),
    'agent',
  );
  assertUniqueIds(
    rules.map((r) => r.meta.id),
    'rule',
  );

  return { project, agents, rules };
}

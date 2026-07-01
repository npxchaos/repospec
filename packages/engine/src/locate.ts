import { dirname, join } from 'node:path';
import { REPOSPEC_DIR, type RepospecFileSystem } from '@repospec/protocol';

/**
 * Find the repository root by walking upward from a starting directory until a
 * `.repospec/` directory is found (see `spec/repository.md` §1).
 *
 * @param fs - The filesystem to search.
 * @param startDir - Absolute path to start from (typically the cwd).
 * @returns The directory containing `.repospec/`, or `null` if none is found.
 */
export async function findRepoRoot(
  fs: RepospecFileSystem,
  startDir: string,
): Promise<string | null> {
  let dir = startDir;
  for (;;) {
    if (await fs.exists(join(dir, REPOSPEC_DIR))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

import type { RepospecFileSystem } from '@repospec/protocol';
import { findRepoRoot } from '../locate.js';

/** Raised when an operation needs a `.repospec/` repository but none is found. */
export class NoRepospecRepositoryError extends Error {
  constructor() {
    super('No .repospec/ directory found. Run `repospec init` first.');
    this.name = 'NoRepospecRepositoryError';
  }
}

/**
 * Resolve the repository root or throw {@link NoRepospecRepositoryError}.
 *
 * @param fs - The filesystem to search.
 * @param cwd - Where to start searching.
 * @returns The directory containing `.repospec/`.
 */
export async function requireRepoRoot(
  fs: RepospecFileSystem,
  cwd: string,
): Promise<string> {
  const root = await findRepoRoot(fs, cwd);
  if (!root) throw new NoRepospecRepositoryError();
  return root;
}

import { createHash } from 'node:crypto';

/**
 * Compute the integrity hash of a plugin entry's source — the value pinned in
 * `.repospec/plugins.lock` and re-checked before execution (ADR-0008/0009).
 *
 * @param source - The entry file contents.
 * @returns An SRI-style `sha256-<base64>` string.
 */
export function integrityOf(source: string): string {
  return `sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}`;
}

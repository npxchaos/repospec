/**
 * The Repospec Protocol version this package implements.
 *
 * This is the version of the specification (`spec/`), not the npm package
 * version. See `spec/versioning.md`.
 */
export const PROTOCOL_VERSION = '0.1' as const;

/**
 * Report whether this implementation supports a given protocol version.
 *
 * Pre-1.0, support is exact-match on the `MAJOR.MINOR` string. The richer range
 * logic described in `spec/versioning.md` arrives with `repospec upgrade`.
 *
 * @param version - The `repospecProtocol` value declared by a repository.
 * @returns `true` if this implementation can operate on that version.
 */
export function supports(version: string): boolean {
  return version === PROTOCOL_VERSION;
}

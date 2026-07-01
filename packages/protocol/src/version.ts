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

/** A parsed `MAJOR.MINOR` protocol version. */
export interface ProtocolVersion {
  major: number;
  minor: number;
}

/**
 * Parse a `MAJOR.MINOR` protocol version string.
 *
 * @param version - e.g. `"0.1"`.
 * @returns The parsed major/minor.
 * @throws {Error} If the string is not `MAJOR.MINOR` of non-negative integers.
 */
export function parseProtocolVersion(version: string): ProtocolVersion {
  const match = /^(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) {
    throw new Error(
      `Invalid protocol version "${version}" (expected MAJOR.MINOR).`,
    );
  }
  return { major: Number(match[1]), minor: Number(match[2]) };
}

/**
 * Compare two `MAJOR.MINOR` protocol versions.
 *
 * @param a - Left version.
 * @param b - Right version.
 * @returns `-1` if a < b, `0` if equal, `1` if a > b.
 */
export function compareProtocolVersions(a: string, b: string): number {
  const va = parseProtocolVersion(a);
  const vb = parseProtocolVersion(b);
  if (va.major !== vb.major) return va.major < vb.major ? -1 : 1;
  if (va.minor !== vb.minor) return va.minor < vb.minor ? -1 : 1;
  return 0;
}

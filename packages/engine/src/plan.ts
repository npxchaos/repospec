import type { RepospecFileSystem } from '@repospec/protocol';

/** Who owns a written file (ADR-0004). */
export type Owner = 'human' | 'repospec';

/** What will happen to a file when a plan is applied. */
export type WriteAction = 'create' | 'overwrite' | 'skip';

/** A single planned file operation. */
export interface PlannedWrite {
  /** Absolute path on the target filesystem. */
  readonly absPath: string;
  /** Path relative to the repository root, for display. */
  readonly path: string;
  /** Who owns the resulting file. */
  readonly owner: Owner;
  /** The full contents that would be written. */
  readonly contents: string;
  /** The action that will be taken. */
  readonly action: WriteAction;
  /** Why, for skips and overwrites. */
  readonly reason?: string;
}

/** A set of planned writes plus any non-fatal warnings. */
export interface FilePlan {
  readonly writes: PlannedWrite[];
  readonly warnings: string[];
}

/** The outcome of applying a plan. */
export interface ApplyResult {
  /** Relative paths actually written. */
  readonly written: string[];
  /** Relative paths skipped, with reasons. */
  readonly skipped: { path: string; reason?: string }[];
}

/**
 * Apply a plan to a filesystem, performing every non-skip write.
 *
 * @param fs - The target filesystem.
 * @param plan - The plan to apply.
 * @returns A summary of what was written and skipped.
 */
export async function applyPlan(
  fs: RepospecFileSystem,
  plan: FilePlan,
): Promise<ApplyResult> {
  const written: string[] = [];
  const skipped: { path: string; reason?: string }[] = [];
  for (const write of plan.writes) {
    if (write.action === 'skip') {
      skipped.push({ path: write.path, reason: write.reason });
      continue;
    }
    await fs.writeFile(write.absPath, write.contents);
    written.push(write.path);
  }
  return { written, skipped };
}

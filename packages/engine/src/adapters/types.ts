import type { RepospecRepository } from '@repospec/protocol';

/** A single file an adapter wants written, relative to the repository root. */
export interface AdapterOutput {
  /** Path relative to the repository root, e.g. `CLAUDE.md`. */
  readonly path: string;
  /** The generated body, WITHOUT the managed header (the engine adds it). */
  readonly body: string;
}

/**
 * An adapter projects the `.repospec/` source of truth into a specific tool's
 * native entrypoint (ADR-0003). Adapters are pure: given a repository, they
 * return the files to generate. The engine owns writing, headers, and ownership
 * checks.
 */
export interface Adapter {
  /** Stable identifier referenced by `project.yaml` `adapters`. */
  readonly id: string;
  /** Human-facing description of what this adapter targets. */
  readonly description: string;
  /** Render the output file(s) for a repository. */
  render(repo: RepospecRepository): AdapterOutput[];
}

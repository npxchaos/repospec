import { join } from 'node:path';
import {
  REPOSPEC_DIR,
  readRepospec,
  type RepospecFileSystem,
} from '@repospec/protocol';
import { findRepoRoot } from '../locate.js';
import type { LlmClient } from '../llm.js';

/** The result of `architect`. */
export interface ArchitectResult {
  root: string | null;
  /** The proposed architecture.md content (a draft for human review). */
  draft: string;
  /** Absolute path the draft would be written to, if accepted. */
  path: string | null;
}

/** Options for {@link architect}. */
export interface ArchitectOptions {
  cwd?: string;
  /** What to design or revise, in the operator's words. */
  request: string;
}

async function readIfExists(
  fs: RepospecFileSystem,
  path: string,
): Promise<string | null> {
  return (await fs.exists(path)) ? fs.readFile(path) : null;
}

/**
 * Draft or revise `architecture.md` with an LLM (`spec/lifecycle.md` §2.6,
 * network + AI, opt-in). Grounds the model in the project identity and the
 * current architecture document, then returns a proposed replacement as a
 * *draft* — the caller decides whether to write it (human decisions win). Pure
 * aside from the injected filesystem and {@link LlmClient}.
 *
 * @param fs - The repository filesystem.
 * @param llm - The completion client.
 * @param options - cwd and the design request.
 * @returns The drafted document plus the path it targets.
 */
export async function architect(
  fs: RepospecFileSystem,
  llm: LlmClient,
  options: ArchitectOptions,
): Promise<ArchitectResult> {
  const cwd = options.cwd ?? process.cwd();
  const root = await findRepoRoot(fs, cwd);
  if (!root) {
    return {
      root: null,
      draft: '',
      path: null,
    };
  }

  const repospecDir = join(root, REPOSPEC_DIR);
  const repo = await readRepospec(fs, repospecDir);
  const archRel = repo.project.documents.architecture;
  const archPath = join(repospecDir, archRel);
  const current = await readIfExists(fs, archPath);

  const { project, stack } = repo.project;
  const system = [
    'You are the architect for a repository governed by the Repospec protocol.',
    'Produce a single, complete Markdown document to be saved as',
    `.repospec/${archRel}. Output ONLY the Markdown — no preamble, no code fences`,
    'around the whole document. Keep it concrete and current; do not invent',
    'technology the project does not use.',
    '',
    '## Project',
    `- Name: ${project.name}`,
    `- Type: ${project.type}`,
    `- Description: ${project.description}`,
    `- Languages: ${stack.languages.join(', ')}`,
    ...(stack.frameworks?.length
      ? [`- Frameworks: ${stack.frameworks.join(', ')}`]
      : []),
  ].join('\n');

  const prompt = [
    'Current architecture document:',
    '',
    current ?? '(none yet)',
    '',
    '## Request',
    options.request.trim() || 'Draft an initial architecture document.',
  ].join('\n');

  const draft = (await llm.complete({ system, prompt })).trim();
  return { root, draft: `${draft}\n`, path: archPath };
}

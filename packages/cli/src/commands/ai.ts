import { execFileSync } from 'node:child_process';
import type { Command } from 'commander';
import * as p from '@clack/prompts';
import {
  NodeFileSystem,
  architect,
  review,
  type ReviewFinding,
} from '@repospec/engine';
import { createLlmClient, describeLlmError } from '../llm.js';
import { error, info } from '../ui.js';

function gitDiff(staged: boolean, ref: string): string {
  const args = staged ? ['diff', '--cached'] : ['diff', ref];
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}

function formatFinding(f: ReviewFinding): string {
  const where = f.file ? ` ${f.file}${f.line ? `:${f.line}` : ''}` : '';
  return `  [${f.severity}]${where} ${f.message}`;
}

interface ReviewFlags {
  staged?: boolean;
  strict?: boolean;
}

async function runReview(ref: string, flags: ReviewFlags): Promise<void> {
  let diff: string;
  try {
    diff = gitDiff(flags.staged ?? false, ref || 'HEAD');
  } catch {
    error('Could not run `git diff`. Is this a git repository?');
    process.exitCode = 1;
    return;
  }
  if (!diff.trim()) {
    info('No changes to review.');
    return;
  }

  let result;
  try {
    result = await review(new NodeFileSystem(), createLlmClient(), {
      cwd: process.cwd(),
      diff,
    });
  } catch (err) {
    error(describeLlmError(err));
    process.exitCode = 1;
    return;
  }

  if (result.findings.length === 0) {
    info('✓ No findings — the change is consistent with the protocol.');
    return;
  }
  for (const finding of result.findings) info(formatFinding(finding));

  const hasError = result.findings.some((f) => f.severity === 'error');
  if (hasError || (flags.strict && result.findings.length > 0)) {
    process.exitCode = 1;
  }
}

interface ArchitectFlags {
  write?: boolean;
}

async function runArchitect(
  request: string,
  flags: ArchitectFlags,
): Promise<void> {
  let result;
  try {
    result = await architect(new NodeFileSystem(), createLlmClient(), {
      cwd: process.cwd(),
      request,
    });
  } catch (err) {
    error(describeLlmError(err));
    process.exitCode = 1;
    return;
  }

  if (!result.root || !result.path) {
    error('No .repospec/ directory found. Run `repospec init`.');
    process.exitCode = 1;
    return;
  }

  if (!flags.write) {
    info(result.draft);
    info('\nRe-run with --write to save this draft to .repospec/.');
    return;
  }

  const ok = await p.confirm({
    message: `Overwrite .repospec/architecture.md with this draft?`,
  });
  if (p.isCancel(ok) || !ok) {
    info('Not written.');
    process.exitCode = 1;
    return;
  }
  await new NodeFileSystem().writeFile(result.path, result.draft);
  info('~ .repospec/architecture.md');
  info('Review the draft and run `repospec sync`.');
}

/** Register the AI-assisted commands: review, architect. */
export function registerAi(program: Command): void {
  program
    .command('review')
    .description('Review a change against the protocol (AI-assisted)')
    .argument('[ref]', 'git ref to diff against', 'HEAD')
    .option('--staged', 'review staged changes (git diff --cached)')
    .option('--strict', 'exit non-zero on any finding, not just errors')
    .action(async (ref: string, flags: ReviewFlags) => {
      await runReview(ref, flags);
    });

  program
    .command('architect')
    .description('Draft or revise architecture.md (AI-assisted)')
    .argument('<request>', 'what to design or revise')
    .option('--write', 'write the draft to .repospec/architecture.md')
    .action(async (request: string, flags: ArchitectFlags) => {
      await runArchitect(request, flags);
    });
}

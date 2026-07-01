import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { NodeFileSystem, applyPlan, planBootstrap } from '@repospec/engine';
import { createLlmClient, describeLlmError } from '../llm.js';
import { error, info } from '../ui.js';

interface BootstrapFlags {
  yes?: boolean;
  force?: boolean;
  ai?: boolean;
  importDocs?: boolean;
}

function summarize(result: {
  written: string[];
  skipped: { path: string; reason?: string }[];
}): string {
  return [
    ...result.written.map((path) => `  + ${path}`),
    ...result.skipped.map((s) => `  · ${s.path} (skipped: ${s.reason})`),
  ].join('\n');
}

async function runBootstrap(flags: BootstrapFlags): Promise<void> {
  const fs = new NodeFileSystem();
  const cwd = process.cwd();

  let llm;
  if (flags.ai) {
    info(
      'AI assist on: sending the detected facts (metadata only, no source) to refine the description.',
    );
    llm = createLlmClient();
  }

  let plan;
  try {
    plan = await planBootstrap(fs, {
      cwd,
      force: flags.force,
      llm,
      importDocs: flags.importDocs,
    });
  } catch (err) {
    error(describeLlmError(err));
    process.exitCode = 1;
    return;
  }
  const evidence = plan.evidence.map((e) => `  • ${e}`).join('\n');

  if (flags.yes) {
    const result = await applyPlan(fs, plan);
    info('Bootstrapped a draft .repospec/ — review it before committing.');
    info(`Detected:\n${evidence}`);
    info(summarize(result));
    for (const warning of plan.warnings) error(warning);
    return;
  }

  p.intro('repospec bootstrap');
  p.note(evidence, 'Detected from your repository');
  p.note(
    plan.writes
      .map((w) =>
        w.action === 'skip'
          ? `  · ${w.path} (skip: ${w.reason})`
          : `  + ${w.path}`,
      )
      .join('\n'),
    'Planned files (draft)',
  );

  const ok = await p.confirm({
    message: 'Write this draft .repospec/? You review and edit it afterward.',
  });
  if (p.isCancel(ok) || !ok) {
    p.cancel('Aborted — nothing written.');
    process.exitCode = 1;
    return;
  }

  const result = await applyPlan(fs, plan);
  p.note(summarize(result), 'Wrote draft .repospec/');
  p.outro(
    'Draft written. Review .repospec/, edit it, then run `repospec sync`.',
  );
  for (const warning of plan.warnings) error(warning);
}

/** Register the `repospec bootstrap` command. */
export function registerBootstrap(program: Command): void {
  program
    .command('bootstrap')
    .description('Infer a draft .repospec/ from an existing repo (offline)')
    .option('-y, --yes', 'non-interactive; write the draft without prompting')
    .option('-f, --force', 'overwrite existing human-owned files')
    .option(
      '--ai',
      'opt in to AI refinement of the description (sends metadata)',
    )
    .option(
      '--no-import-docs',
      "don't seed prose docs from existing repo docs (e.g. ARCHITECTURE.md)",
    )
    .action(async (flags: BootstrapFlags) => {
      try {
        await runBootstrap(flags);
      } catch (err) {
        error((err as Error).message);
        process.exitCode = 1;
      }
    });
}

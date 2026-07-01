import type { Command } from 'commander';
import {
  NoRepospecRepositoryError,
  NodeFileSystem,
  doctor,
  generate,
  sync,
} from '@repospec/engine';
import { error, formatIssue, info, warn } from '../ui.js';

function handleNoRepo(err: unknown): boolean {
  if (err instanceof NoRepospecRepositoryError) {
    error(err.message);
    process.exitCode = 1;
    return true;
  }
  return false;
}

/** Register `repospec doctor`. */
function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Validate .repospec/ and report problems')
    .action(async () => {
      const report = await doctor(new NodeFileSystem(), { cwd: process.cwd() });
      if (report.issues.length === 0) {
        info('✓ Everything looks good.');
        return;
      }
      for (const issue of report.issues) info(formatIssue(issue));
      if (!report.ok) {
        process.exitCode = 1;
      }
    });
}

/** Register `repospec sync`. */
function registerSync(program: Command): void {
  program
    .command('sync')
    .description('Regenerate tool entrypoints from .repospec/')
    .option('-f, --force', 'overwrite hand-modified outputs')
    .option('--check', 'report drift without writing (for CI)')
    .action(async (flags: { force?: boolean; check?: boolean }) => {
      try {
        const result = await sync(new NodeFileSystem(), {
          cwd: process.cwd(),
          force: flags.force,
          check: flags.check,
        });

        for (const conflict of result.conflicts) {
          warn(
            `${conflict.path}: ${conflict.reason} (use --force to overwrite)`,
          );
        }

        if (flags.check) {
          if (result.drift) {
            error('Outputs are out of sync. Run `repospec sync`.');
            process.exitCode = 1;
          } else {
            info('✓ In sync.');
          }
          return;
        }

        const written = result.result?.written ?? [];
        if (written.length > 0) {
          for (const path of written) info(`  ~ ${path}`);
        } else if (result.conflicts.length > 0) {
          info(
            `No changes written — ${result.conflicts.length} output(s) modified by hand. Use --force to overwrite.`,
          );
        } else {
          info('✓ Already in sync.');
        }
      } catch (err) {
        if (handleNoRepo(err)) return;
        throw err;
      }
    });
}

/** Register `repospec generate`. */
function registerGenerate(program: Command): void {
  program
    .command('generate')
    .description('Render tool entrypoints from .repospec/')
    .option('-f, --force', 'overwrite hand-modified outputs')
    .option('--only <list>', 'comma-separated adapter ids to render')
    .action(async (flags: { force?: boolean; only?: string }) => {
      try {
        const { plan, result } = await generate(new NodeFileSystem(), {
          cwd: process.cwd(),
          force: flags.force,
          only: flags.only
            ? flags.only.split(',').map((s) => s.trim())
            : undefined,
        });
        for (const warning of plan.warnings) warn(warning);
        if (result.written.length === 0) {
          info('✓ Nothing to write.');
        } else {
          for (const path of result.written) info(`  ~ ${path}`);
        }
      } catch (err) {
        if (handleNoRepo(err)) return;
        throw err;
      }
    });
}

/** Register the maintenance commands: doctor, sync, generate. */
export function registerMaintenance(program: Command): void {
  registerDoctor(program);
  registerSync(program);
  registerGenerate(program);
}

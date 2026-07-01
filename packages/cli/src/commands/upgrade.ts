import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { NodeFileSystem, applyPlan, planUpgrade } from '@repospec/engine';
import { error, info } from '../ui.js';

interface UpgradeFlags {
  yes?: boolean;
}

async function runUpgrade(flags: UpgradeFlags): Promise<void> {
  const fs = new NodeFileSystem();
  const cwd = process.cwd();
  const report = await planUpgrade(fs, { cwd });

  if (report.status === 'current') {
    info(report.message);
    return;
  }
  if (report.status !== 'migratable' || !report.plan) {
    error(report.message);
    process.exitCode = 1;
    return;
  }

  const plan = report.plan;
  const steps = report.steps
    .map((s) => `  • ${s.from} → ${s.to}: ${s.description}`)
    .join('\n');
  const changes = plan.writes
    .map((w) => `  ${w.action === 'create' ? '+' : '~'} ${w.path}`)
    .join('\n');

  if (flags.yes) {
    const result = await applyPlan(fs, plan);
    info(report.message);
    info(result.written.map((x) => `  ~ ${x}`).join('\n'));
    return;
  }

  p.intro('repospec upgrade');
  p.note(steps, 'Migrations to apply');
  p.note(changes, 'Planned changes (source artifacts)');

  const ok = await p.confirm({
    message: `Apply migration to protocol ${report.to}? This edits .repospec/ source files.`,
  });
  if (p.isCancel(ok) || !ok) {
    p.cancel('Aborted — nothing changed.');
    process.exitCode = 1;
    return;
  }

  const result = await applyPlan(fs, plan);
  p.note(result.written.map((x) => `  ~ ${x}`).join('\n'), 'Migrated');
  p.outro(
    `Upgraded to protocol ${report.to}. Review the changes, then run \`repospec sync\`.`,
  );
}

/** Register the `repospec upgrade` command. */
export function registerUpgrade(program: Command): void {
  program
    .command('upgrade')
    .description('Migrate .repospec/ to a newer protocol version')
    .option('-y, --yes', 'apply the migration without prompting')
    .action(async (flags: UpgradeFlags) => {
      try {
        await runUpgrade(flags);
      } catch (err) {
        error((err as Error).message);
        process.exitCode = 1;
      }
    });
}

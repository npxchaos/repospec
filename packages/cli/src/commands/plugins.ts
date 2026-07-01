import { join } from 'node:path';
import type { Command } from 'commander';
import * as p from '@clack/prompts';
import {
  NoRepospecRepositoryError,
  NodeFileSystem,
  buildApprovalLock,
  requireRepoRoot,
  resolvePlugins,
} from '@repospec/engine';
import { REPOSPEC_DIR, serializePluginLock } from '@repospec/protocol';
import { error, info, warn } from '../ui.js';

async function runList(): Promise<void> {
  const fs = new NodeFileSystem();
  const root = await requireRepoRoot(fs, process.cwd());
  const { plugins, warnings } = await resolvePlugins(fs, root);

  if (plugins.length === 0) {
    info('No plugins declared in project.yaml.');
  }
  for (const plugin of plugins) {
    const status = plugin.approved ? 'approved' : 'NOT approved';
    info(
      `  ${plugin.id}@${plugin.version} [${status}] — ${plugin.capabilities.join(', ') || 'no capabilities'}`,
    );
  }
  for (const w of warnings) warn(w);
  info(
    '\nPlugins are declarative; code runs only for approved plugins via `repospec generate --plugins` (ADR-0008).',
  );
}

async function runApprove(flags: { yes?: boolean }): Promise<void> {
  const fs = new NodeFileSystem();
  const root = await requireRepoRoot(fs, process.cwd());
  const { lock, warnings } = await buildApprovalLock(fs, root);
  for (const w of warnings) warn(w);

  if (lock.approved.length === 0) {
    info('Nothing to approve.');
    return;
  }

  const summary = lock.approved
    .map(
      (a) =>
        `  ${a.id}@${a.version} — ${a.capabilities.join(', ') || 'no capabilities'}\n    ${a.integrity}`,
    )
    .join('\n');

  if (!flags.yes) {
    p.note(summary, 'Approving these plugins (their exact current code)');
    const ok = await p.confirm({
      message: 'Write .repospec/plugins.lock approving this code to run?',
    });
    if (p.isCancel(ok) || !ok) {
      info('Not approved.');
      process.exitCode = 1;
      return;
    }
  }

  const lockPath = join(root, REPOSPEC_DIR, 'plugins.lock');
  await fs.writeFile(lockPath, serializePluginLock(lock));
  info('~ .repospec/plugins.lock');
  info('Approved. Run `repospec generate --plugins` to include their outputs.');
}

/** Register the `repospec plugins` command group. */
export function registerPlugins(program: Command): void {
  const plugins = program
    .command('plugins')
    .description('Inspect and approve declarative plugins');

  plugins
    .command('list')
    .description('List declared plugins and their approval status')
    .action(async () => {
      try {
        await runList();
      } catch (err) {
        if (err instanceof NoRepospecRepositoryError) error(err.message);
        else error((err as Error).message);
        process.exitCode = 1;
      }
    });

  plugins
    .command('approve')
    .description('Approve declared plugins (writes .repospec/plugins.lock)')
    .option('-y, --yes', 'approve without prompting')
    .action(async (flags: { yes?: boolean }) => {
      try {
        await runApprove(flags);
      } catch (err) {
        if (err instanceof NoRepospecRepositoryError) error(err.message);
        else error((err as Error).message);
        process.exitCode = 1;
      }
    });
}

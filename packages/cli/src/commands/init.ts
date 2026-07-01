import { basename } from 'node:path';
import type { Command } from 'commander';
import * as p from '@clack/prompts';
import {
  NodeFileSystem,
  builtinAdapters,
  init,
  type InitInput,
} from '@repospec/engine';
import { error, info } from '../ui.js';

interface InitFlags {
  yes?: boolean;
  force?: boolean;
  name?: string;
  description?: string;
  type?: string;
  languages?: string;
  adapters?: string;
}

const TYPES = ['application', 'library', 'service', 'cli', 'monorepo'] as const;

function splitList(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function nonInteractiveInput(cwd: string, flags: InitFlags): InitInput {
  const type = (flags.type ?? 'application') as InitInput['type'];
  if (!TYPES.includes(type)) {
    throw new Error(
      `Invalid --type "${type}". Expected one of ${TYPES.join(', ')}.`,
    );
  }
  return {
    name: flags.name ?? basename(cwd),
    description: flags.description ?? `A ${type} project.`,
    type,
    languages: flags.languages ? splitList(flags.languages) : ['typescript'],
    adapters: flags.adapters ? splitList(flags.adapters) : ['claude'],
  };
}

async function interview(cwd: string): Promise<InitInput | null> {
  p.intro('repospec init');

  const answers = await p.group(
    {
      name: () =>
        p.text({
          message: 'Project name',
          initialValue: basename(cwd),
          validate: (v) => (v.trim() ? undefined : 'Required'),
        }),
      description: () =>
        p.text({
          message: 'One-sentence description',
          validate: (v) => (v.trim() ? undefined : 'Required'),
        }),
      type: () =>
        p.select({
          message: 'Project type',
          options: TYPES.map((t) => ({ value: t, label: t })),
          initialValue: 'application' as (typeof TYPES)[number],
        }),
      languages: () =>
        p.text({
          message: 'Primary languages (comma-separated)',
          initialValue: 'typescript',
          validate: (v) => (v.trim() ? undefined : 'Required'),
        }),
      packageManager: () =>
        p.text({ message: 'Package manager (optional)', placeholder: 'pnpm' }),
      branching: () =>
        p.select({
          message: 'Branching model',
          options: [
            { value: 'github-flow', label: 'GitHub flow' },
            { value: 'trunk', label: 'Trunk-based' },
            { value: 'gitflow', label: 'Git flow' },
          ],
          initialValue: 'github-flow' as 'github-flow' | 'trunk' | 'gitflow',
        }),
      adapters: () =>
        p.multiselect({
          message: 'AI assistant adapters to generate',
          options: builtinAdapters.map((a) => ({
            value: a.id,
            label: a.id,
            hint: a.description,
          })),
          initialValues: ['claude'],
          required: true,
        }),
    },
    { onCancel: () => process.exit(1) },
  );

  return {
    name: answers.name,
    description: answers.description,
    type: answers.type,
    languages: splitList(answers.languages),
    packageManager: answers.packageManager?.trim() || undefined,
    branching: answers.branching as InitInput['branching'],
    adapters: answers.adapters,
  };
}

async function runInit(flags: InitFlags): Promise<void> {
  const fs = new NodeFileSystem();
  const cwd = process.cwd();

  const input = flags.yes
    ? nonInteractiveInput(cwd, flags)
    : await interview(cwd);
  if (!input) {
    process.exitCode = 1;
    return;
  }

  const { plan, result } = await init(fs, input, { cwd, force: flags.force });

  const created = result.written;
  const skipped = result.skipped;

  const summary = [
    ...created.map((path) => `  + ${path}`),
    ...skipped.map((s) => `  · ${s.path} (skipped: ${s.reason})`),
  ].join('\n');

  if (flags.yes) {
    info(plan.existed ? 'Updated .repospec/' : 'Initialized .repospec/');
    info(summary);
  } else {
    p.note(summary, plan.existed ? 'Updated .repospec/' : 'Created .repospec/');
    p.outro('Done. Commit .repospec/ and the generated entrypoints.');
  }

  for (const warning of plan.warnings) {
    error(warning);
  }
}

/** Register the `repospec init` command. */
export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Initialize the Repospec protocol in this repository')
    .option('-y, --yes', 'non-interactive; use defaults and flags')
    .option('-f, --force', 'overwrite existing human-owned files')
    .option('--name <name>', 'project name (with --yes)')
    .option('--description <text>', 'project description (with --yes)')
    .option('--type <type>', 'project type (with --yes)')
    .option('--languages <list>', 'comma-separated languages (with --yes)')
    .option('--adapters <list>', 'comma-separated adapter ids (with --yes)')
    .action(async (flags: InitFlags) => {
      try {
        await runInit(flags);
      } catch (err) {
        error((err as Error).message);
        process.exitCode = 1;
      }
    });
}
